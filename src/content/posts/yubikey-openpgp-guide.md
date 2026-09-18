---
title: 使用 YubiKey 配置 OpenPGP：密钥生成、备份与日常使用
published: 2026-08-11
description: 从零配置 YubiKey 或兼容 OpenPGP 智能卡，涵盖 GnuPG 安装、密钥规划、离线备份、卡槽迁移、签名、加密、Git 与 SSH，以及丢失后的恢复和吊销。
tags: [openpgp, yubikey, gnupg, security, ssh, guide]
category: 环境与系统
draft: false
aigc: Codex
device: MacBook Pro
---

把 OpenPGP 私钥放进 YubiKey 一类的智能卡，核心价值不是“免密码”，而是让私钥不再以可直接复制的文件形式长期留在电脑中。签名、解密和身份认证都由卡片内部完成，即使电脑遭到入侵，攻击者也很难直接导出私钥。

下面从密钥结构设计开始，依次完成备份验证、迁移入卡、Git 签名、SSH 登录和灾难恢复准备。文中的身份、邮箱、指纹、文件名和公钥地址均为脱敏示例，使用时需要替换成自己的实际信息：

```text
Example User <user@example.com>
```

主密钥指纹统一使用以下占位符表示：

```text
<PRIMARY_KEY_FINGERPRINT>
```

> [!IMPORTANT]
> OpenPGP 公钥、完整指纹和卡片序列号不是同一种东西。公钥和完整指纹可以公开；私钥、PIN、Reset Code 和私钥备份绝不能公开。本文不会记录真实 PIN、Reset Code 或设备序列号。

## 最终要得到什么

OpenPGP 卡提供三个相互独立的私钥槽：

| 卡槽 | 能力 | 用途 |
| --- | --- | --- |
| Signature | `S` | 文件、邮件和 Git commit 签名 |
| Encryption | `E` | 解密发给自己的数据 |
| Authentication | `A` | SSH 等身份认证 |

本文复现当前已经使用的结构：

```text
主密钥      [SC]  → Signature 槽
加密子密钥   [E]  → Encryption 槽
认证子密钥   [A]  → Authentication 槽
```

其中 `S`、`C`、`E`、`A` 分别表示 Sign、Certify、Encrypt 和 Authenticate。

还有一种隔离更严格的结构：让主密钥只具有 `[C]` 能力并永久离线，另外创建 `[S]`、`[E]`、`[A]` 三把子密钥放入卡片。这样日常使用的卡片无法直接签发新子密钥或修改身份，适合长期维护的重要身份。本文采用 `[SC] + [E] + [A]`，优点是结构简单、能够复现当前配置；如果以后准备重建长期身份，可以再评估离线 `[C]` 方案。

> [!WARNING]
> `keytocard` 会在保存后把当前钥匙环里的对应私钥材料替换为智能卡引用。卡内私钥不能再导出，所以必须在迁移之前完成完整私钥备份，并实际验证备份可以恢复。

## 1. 准备 GnuPG 与卡片

### macOS

使用 Homebrew 安装 GnuPG 和图形化 PIN 输入程序：

```bash
brew install gnupg pinentry-mac
```

检查版本：

```bash
gpg --version
```

如果终端无法弹出 PIN 输入窗口，可以在 `~/.gnupg/gpg-agent.conf` 中加入实际路径：

```text
pinentry-program /opt/homebrew/bin/pinentry-mac
```

Intel Mac 的路径通常是 `/usr/local/bin/pinentry-mac`，以 `command -v pinentry-mac` 的输出为准。修改后重启 agent：

```bash
gpgconf --kill gpg-agent
```

### Linux

Debian 或 Ubuntu 可以安装：

```bash
sudo apt update
sudo apt install gnupg scdaemon pcscd
```

部分发行版还需要启动 PC/SC 服务：

```bash
sudo systemctl enable --now pcscd
```

### 检查 OpenPGP 应用

插入设备后执行：

```bash
gpg --card-status
```

应能看到以下字段：

```text
Application type .: OpenPGP
Signature key ....: [none]
Encryption key....: [none]
Authentication key: [none]
```

如果卡槽里已经有指纹，不要继续覆盖，先确认它们是否属于仍在使用的密钥。

本文使用的设备在 Reader 字段中显示为 `LibreKeys ... yubikey`，而不是标准的 Yubico 厂商名称。因此，算法、触摸确认和 KDF 等能力一律以 `gpg --card-status` 的实际结果及固件文档为准，不能只根据 USB 名称推断。

## 2. 先规划算法与有效期

当前卡片报告的属性是：

```text
Key attributes ...: rsa2048 rsa2048 rsa2048
```

因此本文统一使用 RSA-2048，优先保证导入成功和客户端兼容性。不要在没有确认固件支持的情况下直接修改 `key-attr`。如果使用的是明确支持 RSA-3072、RSA-4096 或 ECC 的设备，可以在创建身份之前重新评估算法，但三把待迁移密钥必须与对应卡槽兼容。

本文把有效期设为 `0`，即 OpenPGP 元数据中的“永不过期”。这不表示算法和设备会永远安全，只表示 GnuPG 不会因为日期自动判定密钥失效。长期身份仍应定期评估算法、设备状态和备份介质。

## 3. 创建主密钥与子密钥

先创建具有认证和签名能力的主密钥：

```bash
gpg --quick-generate-key \
  "Example User <user@example.com>" \
  rsa2048 cert,sign 0
```

为本地私钥设置一条足够强、且与卡片 PIN 不同的保护密码。

查看完整指纹：

```bash
gpg --list-secret-keys \
  --keyid-format long \
  --with-subkey-fingerprint \
  "user@example.com"
```

复制 `sec` 下一行的 40 位完整主密钥指纹，并设置变量：

```bash
FPR='<PRIMARY_KEY_FINGERPRINT>'
```

不要使用只有 8 位或 16 位的短 Key ID。先验证变量确实指向预期身份：

```bash
gpg --list-secret-keys --keyid-format long "$FPR"
```

添加加密子密钥和认证子密钥：

```bash
gpg --quick-add-key "$FPR" rsa2048 encrypt 0
gpg --quick-add-key "$FPR" rsa2048 auth 0
```

再次检查结构：

```bash
gpg --list-secret-keys \
  --keyid-format long \
  --with-subkey-fingerprint \
  "$FPR"
```

此时应类似：

```text
sec   rsa2048/... [SC]
ssb   rsa2048/... [E]
ssb   rsa2048/... [A]
```

## 4. 在迁移前制作完整备份

把下面的目录改为加密移动硬盘或其他离线介质上的真实路径：

```bash
BACKUP_DIR="/Volumes/EncryptedBackup/openpgp-backup"
install -d -m 700 "$BACKUP_DIR"
```

导出公钥、完整私钥、子密钥和 ownertrust：

```bash
gpg --armor \
  --output "$BACKUP_DIR/example-public.asc" \
  --export "$FPR"

gpg --armor \
  --output "$BACKUP_DIR/example-secret-full.asc" \
  --export-secret-keys "$FPR"

gpg --armor \
  --output "$BACKUP_DIR/example-secret-subkeys.asc" \
  --export-secret-subkeys "$FPR"

gpg --export-ownertrust \
  > "$BACKUP_DIR/ownertrust.txt"
```

`--export-ownertrust` 应通过 Shell 重定向保存；某些 GnuPG 版本不会把这个命令的输出写入 `--output` 指定的文件。如果信任记录直接打印在终端里，应检查 `ownertrust.txt` 是否真的存在。

GnuPG 通常会在生成主密钥时自动创建吊销证书。把它复制到备份介质：

```bash
cp "$HOME/.gnupg/openpgp-revocs.d/$FPR.rev" \
  "$BACKUP_DIR/example-revocation-certificate.rev"

chmod 600 "$BACKUP_DIR"/*
ls -la "$BACKUP_DIR"
```

备份目录至少应包含：

```text
example-public.asc
example-secret-full.asc
example-secret-subkeys.asc
example-revocation-certificate.rev
ownertrust.txt
```

推荐保存两份加密离线备份，并放在不同地点。私钥保护密码、卡片 PIN 和 Reset Code 不要与备份介质放在一起。

### 实际验证备份

“文件存在”不等于“能够恢复”。创建一个隔离的临时 GnuPG 主目录：

```bash
VERIFY_HOME="$(mktemp -d)"
chmod 700 "$VERIFY_HOME"
```

导入完整私钥备份：

```bash
gpg --homedir "$VERIFY_HOME" \
  --import "$BACKUP_DIR/example-secret-full.asc"

gpg --homedir "$VERIFY_HOME" \
  --list-secret-keys \
  --keyid-format long \
  --with-subkey-fingerprint \
  "$FPR"
```

进行一次签名测试。不要把待签名内容通过管道传给 GnuPG，否则 pinentry 可能无法从当前终端读取保护密码，并报错 `Inappropriate ioctl for device`：

```bash
export GPG_TTY="$(tty)"

VERIFY_FILE="$(mktemp /tmp/openpgp-backup-verification.XXXXXX)"
VERIFY_SIGNATURE="$BACKUP_DIR/$(basename "$VERIFY_FILE").asc"
printf 'OpenPGP backup verification\n' > "$VERIFY_FILE"

gpg --homedir "$VERIFY_HOME" \
  --local-user "$FPR" \
  --armor \
  --clearsign \
  --output "$VERIFY_SIGNATURE" \
  "$VERIFY_FILE"

gpg --homedir "$VERIFY_HOME" \
  --verify "$VERIFY_SIGNATURE"
```

只有看到 `Good signature`，并确认临时钥匙环中存在 `[SC]`、`[E]`、`[A]` 的完整私钥后，才能继续。临时环境中 UID 显示 `[未知]` 只是因为没有导入 ownertrust，不表示备份损坏，也不影响签名验证。

## 5. 修改卡片 PIN

进入卡片编辑模式：

```bash
gpg --card-edit
```

依次进入管理模式和 PIN 菜单：

```text
admin
passwd
```

通常可以看到：

```text
1 - change PIN
2 - unblock PIN
3 - change Admin PIN
4 - set the Reset Code
Q - quit
```

至少完成以下三项：

1. 修改用户 PIN；
2. 修改管理员 PIN；
3. 设置独立的 Reset Code。

标准原厂 YubiKey 的默认用户 PIN 通常为 `123456`，管理员 PIN 通常为 `12345678`，但兼容设备不一定相同。以厂商文档为准，不要连续猜测，因为每类 PIN 通常只有三次重试机会。

`Max. PIN lengths` 显示的是最大长度，不是最小长度。标准 OpenPGP 卡通常要求用户 PIN 至少 6 位、管理员 PIN 和 Reset Code 至少 8 位；兼容固件还可能有更严格的字符限制。为了兼容性，本文建议使用 8 位以上的用户 PIN，以及 12～16 位 ASCII 字母和数字组成的管理员 PIN、Reset Code，不要使用 4 位数字 PIN。

修改 PIN 时，pinentry 会先收集当前 PIN、新 PIN 和重复的新 PIN，最后才一次性交给卡片验证。因此，看到“输入新 PIN”的界面不代表当前 PIN 已经通过验证。如果最终提示 `Bad PIN` 或“损坏的 PIN”，先退出并运行 `gpg --card-status`：管理员 PIN 对应 `PIN retry counter` 的最后一位；若计数没有减少，更可能是新 PIN 太短或格式不受支持，若计数减少则说明当前 PIN 错误。

三类凭据的用途不同：

- 用户 PIN：执行签名、解密和认证；
- 管理员 PIN：修改卡片设置、写入或删除密钥；
- Reset Code：用户 PIN 被锁定后的恢复凭据。

## 6. 把三把私钥迁移到卡片

进入密钥编辑界面：

```bash
gpg --edit-key "$FPR"
```

先输入：

```text
list
```

### 主密钥迁移到 Signature 槽

刚进入编辑界面时不要选择任何子密钥，直接执行：

```text
keytocard
```

选择：

```text
1
```

也就是 `Signature key`。

GnuPG 会询问“真的要移动主密钥吗”，确认后可能显示：

```text
Note: the local copy of the secret key will only be deleted with "save".
```

这表示主密钥已经写入卡片，而钥匙环中的本地副本要到最后执行 `save` 才会移除。此时先继续迁移 `[E]` 和 `[A]`，不要提前保存。

### `[E]` 子密钥迁移到 Encryption 槽

如果 `[E]` 是第一把子密钥：

```text
key 1
list
```

确认只有 `[E]` 子密钥前面出现 `*`，然后执行：

```text
keytocard
```

选择：

```text
2
```

迁移完成后取消选择：

```text
key 1
```

### `[A]` 子密钥迁移到 Authentication 槽

如果 `[A]` 是第二把子密钥：

```text
key 2
list
```

确认只有 `[A]` 子密钥前面出现 `*`，然后执行：

```text
keytocard
```

选择：

```text
3
```

可以再输入一次 `key 2` 取消选择，然后运行 `list`，确认没有误选其他子密钥，最后保存：

```text
key 2
list
save
```

> [!CAUTION]
> `key N` 是切换第 N 把子密钥的选择状态，不是把选择直接切换过去；再次输入同一个命令才会取消其前面的 `*`。如果 `[E]` 和 `[A]` 前面同时出现 `*`，先对不需要的那一把再执行一次 `key N`。子密钥编号取决于实际钥匙环，以 `[E]` 和 `[A]` 标志为准，不要盲目照搬编号。执行 `save` 前再次确认卡槽选择正确。

## 7. 验证卡片状态

查看 OpenPGP 卡：

```bash
gpg --card-status
```

配置成功后应同时出现三把指纹：

```text
Signature key ....: <PRIMARY_KEY_FINGERPRINT>
Encryption key....: <ENCRYPTION_SUBKEY_FINGERPRINT>
Authentication key: <AUTH_SUBKEY_FINGERPRINT>
```

再查看本地钥匙环：

```bash
gpg --list-secret-keys \
  --keyid-format long \
  --with-subkey-fingerprint \
  "$FPR"
```

预期类似：

```text
sec>  rsa2048/... [SC]
ssb>  rsa2048/... [E]
ssb>  rsa2048/... [A]
```

`>` 表示私钥操作由智能卡完成，本地只保留卡片引用。它不表示私钥已经被公开或可以从卡中导出。

## 8. 分别测试三个卡槽

### 签名与验证

```bash
export GPG_TTY="$(tty)"

SIGN_TEST="$(mktemp /tmp/openpgp-card-signing.XXXXXX)"
SIGNATURE="${SIGN_TEST}.sig.asc"
printf 'OpenPGP smartcard signing test: %s\n' \
  "$(date '+%Y-%m-%dT%H:%M:%S%z')" \
  > "$SIGN_TEST"

gpg --local-user "$FPR" \
  --armor \
  --detach-sign \
  --output "$SIGNATURE" \
  "$SIGN_TEST"

gpg --verify "$SIGNATURE" "$SIGN_TEST"

printf '测试文件：%s\n签名文件：%s\n' \
  "$SIGN_TEST" "$SIGNATURE"
```

预期看到：

```text
Good signature from "Example User <user@example.com>"
```

### 加密与解密

```bash
printf 'OpenPGP smartcard encryption test\n' \
  > /tmp/openpgp-plaintext.txt

gpg --armor \
  --recipient "$FPR" \
  --output /tmp/openpgp-encrypted.asc \
  --encrypt /tmp/openpgp-plaintext.txt

gpg --decrypt /tmp/openpgp-encrypted.asc
```

加密只需要公钥，因此拔掉卡片仍可加密；解密必须使用卡片中的 `[E]` 私钥。可以拔卡后再尝试解密，确认操作确实依赖设备。

### 导出 SSH 公钥

```bash
gpg --export-ssh-key "$FPR"
```

应得到类似：

```text
ssh-rsa AAAA... openpgp:0x...
```

这只能证明认证子密钥可以转换为 SSH 公钥。完整 SSH 登录配置见后文。

## 9. 配置 Git commit 签名

让 Git 使用这把 OpenPGP 密钥：

```bash
git config --global user.signingkey "$FPR"
git config --global commit.gpgsign true
git config --global tag.gpgSign true
git config --global gpg.program "$(command -v gpg)"
```

进行一次本地测试：

```bash
mkdir /tmp/gpg-git-sign-test
cd /tmp/gpg-git-sign-test
git init
git commit --allow-empty -m "test OpenPGP signing"
git log --show-signature -1
```

要让 GitHub 显示 `Verified`，还需要：

1. 把 `user@example.com` 添加到 GitHub 账号并完成验证；
2. 在 GitHub 的 SSH and GPG keys 页面添加 ASCII 公钥；
3. commit 的作者邮箱必须属于该账号。

导出可粘贴到 GitHub 的公钥：

```bash
gpg --armor --export "$FPR"
```

## 10. 把认证子密钥用于 SSH

在 `~/.gnupg/gpg-agent.conf` 中加入：

```text
enable-ssh-support
```

重启 gpg-agent：

```bash
gpgconf --kill gpg-agent
gpgconf --launch gpg-agent
```

当前终端指向 GnuPG 提供的 SSH agent socket：

```bash
export SSH_AUTH_SOCK="$(gpgconf --list-dirs agent-ssh-socket)"
```

把同一行写入 `~/.zshrc` 或 `~/.bashrc`，然后重新打开终端。检查 agent 是否识别卡片：

```bash
ssh-add -L
```

也可以直接导出公钥保存：

```bash
gpg --export-ssh-key "$FPR" > ~/.ssh/openpgp-backup.pub
```

把这行公钥添加到服务器的 `~/.ssh/authorized_keys` 或 GitHub 的 SSH keys 页面，再执行实际登录测试：

```bash
ssh -T git@github.com
```

拔掉卡后再次连接，应当无法使用这把私钥完成认证。

## 11. 发布公钥与指纹

导出公开版本：

```bash
gpg --armor \
  --output example-public.asc \
  --export "$FPR"
```

可以把它发布到个人网站，例如：

```text
https://example.com/pgp.asc
```

这个地址必须直接返回 `example-public.asc` 的 ASCII 公钥内容。OpenPGP 卡的公钥 URL 是单个字符串字段，只支持一个 URL；如果需要多个镜像，应使用一个长期稳定的地址，再由服务器通过 HTTP 重定向到当前镜像。

设置卡片上的公钥 URL：

```bash
gpg --card-edit
```

```text
admin
url
https://example.com/pgp.asc
quit
```

上传后检查服务器返回的指纹：

```bash
curl -fsSL https://example.com/pgp.asc |
  gpg --show-keys --fingerprint
```

只能公开 `example-public.asc`。不要上传整个备份目录，也不要公开 `example-secret-full.asc`、`example-secret-subkeys.asc`、吊销证书或 `ownertrust.txt`；备份签名测试文件也不是公钥。

完整指纹应通过另一个独立渠道公开，供别人核对：

```text
<PRIMARY_KEY_FINGERPRINT>
```

还可以把公钥上传到支持的密钥服务器：

```bash
gpg --keyserver hkps://keys.openpgp.org \
  --send-keys "$FPR"
```

密钥服务器上的记录通常无法像普通文件一样彻底删除，只能通过吊销来声明失效。上传前应确认 UID 中的邮箱适合长期公开；使用 keys.openpgp.org 时，还需要按邮件完成 UID 验证，其他人才可按邮箱搜索到它。

## 12. 可选的卡片安全设置

### 每次签名都重新验证 PIN

当前状态如果显示：

```text
Signature PIN ....: 非强制
```

表示一次成功验证后，同一会话中的后续签名可能不再要求 PIN。重要发布密钥可以切换为强制：

```bash
gpg --card-edit
```

输入：

```text
admin
forcesig
quit
```

`forcesig` 是切换命令，再执行一次会恢复原状态。频繁签 Git commit 时，非强制更方便；签软件发布包或重要文件时，强制更稳妥。

### 物理触摸确认 UIF

如果设备明确支持触摸确认，可以先单独测试签名槽：

```bash
gpg --card-edit
```

```text
admin
uif 1 on
quit
```

确认签名能在触摸后成功，再按需启用解密和认证：

```text
uif 2 on
uif 3 on
```

对应关系为：

```text
UIF 1 = Sign
UIF 2 = Decrypt
UIF 3 = Auth
```

启用 `Sign=on` 后，签名流程通常仍会先要求用户 PIN；PIN 窗口关闭后，GnuPG 可能只是在终端中静默等待，并不会再弹出“请按键”窗口。此时直接触摸设备即可。可以故意暂时不触摸：若签名命令持续等待，说明 UIF 正在生效；若签名立即完成，先确认 `gpg --list-secret-keys` 中签名主密钥显示为 `sec>`。如果确实是 `sec>` 且无需触摸也能签名，说明兼容固件虽然报告 `Sign=on`，但没有实际执行触摸策略。

> [!CAUTION]
> 兼容卡未必实现了与原厂 YubiKey 相同的触摸行为。先用 `on` 测试，不要直接设为 `permanent`；永久模式通常无法关闭，只能重置 OpenPGP 应用并清空密钥。

### KDF

OpenPGP Card KDF 会先在客户端对 PIN 进行加盐和迭代派生，再把结果交给卡片。它可以强化 PIN 处理，但要求所有客户端和固件都正确支持。

当前兼容设备的状态是：

```text
KDF setting ......: off
```

在固件来源、旧客户端兼容性和恢复流程都没有验证之前，建议保持关闭。KDF 不是越多越好的通用开关，错误启用可能导致旧设备无法验证 PIN。

### 卡片元数据

`name`、`lang`、`login` 和公钥 URL 都只是元数据，不决定密钥安全。可以在以下界面按需设置：

```text
gpg --card-edit
admin
name
lang
login
url
quit
```

只有当 ASCII 公钥已经长期托管在稳定的 HTTPS 地址时，才建议填写 URL。URL 指向的只能是公钥，绝不能是私钥备份。

## 13. 在新电脑上恢复使用

新电脑不需要导入完整私钥，只需导入公钥并让 GnuPG 学习卡片：

```bash
gpg --import example-public.asc
gpg --card-status
```

如果本地没有正确建立卡片引用，可以执行：

```bash
gpg-connect-agent "scd serialno" "learn --force" /bye
```

然后重新检查：

```bash
gpg --list-secret-keys \
  --keyid-format long \
  --with-subkey-fingerprint \
  "$FPR"
```

需要 SSH 时，再配置 `enable-ssh-support` 和 `SSH_AUTH_SOCK`。不要为了日常使用而把完整私钥备份导入联网电脑；那会抵消智能卡隔离私钥的主要价值。

## 14. 卡片丢失、损坏或 PIN 锁定

### 用户 PIN 锁定

如果用户 PIN 的重试次数降到 0，可以使用事先设置的 Reset Code 或管理员 PIN 解锁。不要继续猜测，以免管理员 PIN 也被锁定。

### 卡片损坏但身份仍需继续使用

从经过验证的完整私钥备份恢复到隔离环境，准备一枚新卡，再将密钥写入新卡。因为原 OpenPGP 私钥并没有从旧卡中导出，而是从迁移前的备份重新获得，所以备份是整个恢复流程的唯一可靠基础。

### 卡片丢失或怀疑已被复制使用

如果无法确认卡片仍在自己控制下，应使用离线保存的吊销证书吊销主密钥，并尽快发布更新后的公钥状态。吊销代表整套身份失效；如果只是轮换某一把子密钥，则需要使用认证主密钥吊销旧子密钥、添加新子密钥并重新发布公钥。

导入自动生成的吊销证书前，应先阅读文件头部的说明。GnuPG 生成的 `.rev` 文件通常会在 Armor 开头故意加入一个冒号，防止误导入；正式使用时需要按文件内说明去掉该字符，再导入并发布吊销后的公钥。

> [!WARNING]
> 吊销通常不可逆。只有在密钥确实需要作废时才执行，不要把“测试吊销证书”放在真实钥匙环或公开密钥服务器上。

## 15. 日常检查清单

- 定期执行 `gpg --card-status`，确认三个卡槽指纹和 PIN 重试次数正常；
- 每次修改 UID、有效期或子密钥后，重新导出并发布公钥；
- 至少每年检查两份离线备份是否仍可读取；
- 保持 GnuPG、scdaemon、pinentry 和设备固件更新；
- 不把私钥备份、保护密码、PIN 与 Reset Code 放在同一位置；
- 保留一枚备用兼容卡，或至少记录经过验证的换卡流程；
- “永不过期”不等于永远安全，定期重新评估算法和设备寿命。

## 验收结果

完成配置后，应得到类似以下结构：

```text
主密钥 [SC]
<PRIMARY_KEY_FINGERPRINT>

加密子密钥 [E]
<ENCRYPTION_SUBKEY_FINGERPRINT>

认证子密钥 [A]
<AUTH_SUBKEY_FINGERPRINT>
```

仅看到三把指纹还不算完成。最终验收应同时满足：离线备份已在隔离钥匙环中成功导入并签名，签名与解密均需要卡片，SSH 已完成一次真实登录，`sec>` / `ssb>` 显示本地只保留卡片引用，公钥和完整指纹也已发布到稳定位置。可选安全开关应在这些基础流程通过后再逐项启用。

## 参考资料

- [GnuPG Manual：Smart Card Tool](https://www.gnupg.org/documentation/manuals/gnupg/Smart-Card-Tool.html)
- [GnuPG Manual：OpenPGP Card](https://www.gnupg.org/documentation/manuals/gnupg/OpenPGP-Card.html)
- [GnuPG Manual：GPG Configuration Options](https://www.gnupg.org/documentation/manuals/gnupg/GPG-Configuration-Options.html)
- [Yubico OpenPGP 文档](https://developers.yubico.com/PGP/)
- [GitHub：管理 commit 签名验证](https://docs.github.com/zh/authentication/managing-commit-signature-verification)
- [keys.openpgp.org 使用说明](https://keys.openpgp.org/about/usage)
