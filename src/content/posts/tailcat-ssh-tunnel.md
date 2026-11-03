---
title: 用 Tailcat 搭建免账号的 SSH 穿透通道
published: 2026-11-03
description: Tailcat 是 Tailscale 官方出的小工具，不需要 Tailscale 账号、不需要 root、也不用开放入站端口，服务器起一个进程、本机一条命令就能拿到 SSH 会话。本文整理 Linux/macOS/Windows 三端的安装、常驻、固定地址，以及指定私钥与隧道身份的几种写法。
tags: [tailcat, ssh, tooling, guide, linux, macos, windows]
category: 环境与系统
draft: false
device: MacBook Pro
---

最近在几台机器之间来回跳，发现 [Tailcat](https://github.com/tailscale/tailcat) 比想象中省事。它是 Tailscale 官方从自家开源代码里拆出来的一个小工具，定位是「能穿透 NAT 的 netcat」：不需要 Tailscale 账号，不需要控制平面，也不需要 root，进程完全跑在用户态，不改路由表、不改 DNS。

它做的事很简单：一端 `serve`，打印出一串 `tc...` 地址；另一端拿着这串地址 `ssh` 过去。所有流量走 WireGuard 加密，先用 DERP 中继完成打洞握手，之后能直连就自动升级成点对点 UDP。

本文记录三端（Linux 服务器、Windows 服务器、macOS 本机）的完整用法，以及几个真正容易踩的坑。

## 它和 Tailscale 的区别

| | Tailscale | Tailcat |
|---|---|---|
| 需要账号 | 是 | 否 |
| 需要控制平面 | 是 | 否，靠带外交换地址 |
| 需要 root | 通常需要（建网卡、改路由） | 不需要，纯用户态 |
| 节点寻址 | 100.x.y.z 稳定 IP | 一次性 `tc...` 地址或 DNS TXT |
| 典型用法 | 组网、访问内网全部服务 | 把某个端口 / SSH 打通 |

所以它更适合「我就想连这一台机器」的场景，而不是替一套内网组网方案。地址本身就是凭证，这点后面会反复提到。

## 服务器装什么

### Linux

先看架构，`x86_64` 对应 `amd64`，`aarch64` 对应 `arm64`：

```bash
uname -m
```

Debian / Ubuntu：

```bash
curl -LO https://github.com/tailscale/tailcat/releases/download/v0.7.0/tailcat_0.7.0_linux_amd64.deb
sudo apt install ./tailcat_0.7.0_linux_amd64.deb
```

其他方式任选其一：

- Fedora / RHEL：下载对应 `.rpm`，`sudo dnf install ./tailcat_*.rpm`
- Arch：`yay -S tailcat`（AUR）
- 有 snapd：`sudo snap install tailcat`
- 有 Go 工具链：`go install github.com/tailscale/tailcat/cmd/tailcat@latest`

`sudo` 只用于安装包，运行不需要 root。

### Windows

PowerShell 里装（需要先有 Scoop）：

```powershell
scoop install tailcat
```

没有 Scoop 就下载 zip 解压：

```powershell
# ARM 机器把 amd64 换成 arm64
curl.exe -LO https://github.com/tailscale/tailcat/releases/download/v0.7.0/tailcat_0.7.0_windows_amd64.zip
Expand-Archive tailcat_0.7.0_windows_amd64.zip -DestinationPath $env:USERPROFILE\bin -Force
```

然后把 `%USERPROFILE%\bin` 加进用户环境变量 `Path`。

### 本机（macOS）

```bash
brew install tailcat
```

## 最简路径：三条命令

服务器上：

```bash
tailcat serve no-auth-ssh
```

输出：

```text
🐈 Server listening with new address: tcFwWCCcjS5nKNqAod034nWoJZW0LZqDhhC8U_dKdnDRYQ8uNGFpGQEu
```

本机：

```bash
tailcat ssh tcFwWCCcjS5nKNqAod034nWoJZW0LZqDhhC8U_dKdnDRYQ8uNGFpGQEu
```

直接就是一个 shell。Windows 服务器进去是 PowerShell。

这里用的是 tailcat **自带的 SSH 服务端**，服务器上不需要跑 sshd，也不需要在防火墙放行 22 端口。

> [!WARNING]
> `no-auth-ssh` 的地址就是密码。任何拿到这串 `tc...` 的人都能以运行 tailcat 的那个用户身份登录，而且 Windows 上会直接拿到一个 PowerShell。只用私密渠道传递，不要写进 DNS TXT、不要发群、不要贴进 issue。

## 推荐路径：公钥认证

同样是内置 SSH 服务端，但要求客户端出示公钥：

```bash
tailcat serve --ssh-authorized-keys=~/.ssh/authorized_keys ssh
```

`--ssh-authorized-keys` 接受逗号分隔的多种来源：

- `authorized_keys` 文件路径
- 直接写一行 OpenSSH 公钥
- `用户名@github`，启动时去 `https://github.com/用户名.keys` 拉取

```bash
tailcat serve --ssh-authorized-keys=bradfitz@github,./contractor.pub ssh
```

每个来源都必须在启动时存在且能解析，否则进程直接退出——这比「静默启动了一个没人能连的服务」要好。

> [!NOTE]
> 只接受**普通公钥行**。`authorized_keys` 里的选项（`command=`、`from=` 等）会被拒绝，因为内置服务端没实现这些限制。OpenSSH CA 签发的证书也没有文档支持，用普通公钥即可。

客户端连接方式不变：

```bash
tailcat ssh tcFwWCCcjS5nKNqAod034n...
```

## 让服务器常驻

### Linux：systemd 用户服务

不需要 root，也不用改系统配置：

```bash
mkdir -p ~/.config/systemd/user
cat > ~/.config/systemd/user/tailcat-ssh.service <<'EOF'
[Unit]
Description=Tailcat SSH
After=network-online.target

[Service]
ExecStart=%h/.local/bin/tailcat serve --ssh-authorized-keys=%h/.ssh/authorized_keys ssh
Restart=always

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable --now tailcat-ssh
loginctl enable-linger $USER
```

用 deb / rpm 装的话，`ExecStart` 换成 `/usr/bin/tailcat`。

`enable-linger` 这一句是关键：不开启的话，退出登录后用户级 systemd 会被回收，服务跟着停。

日志用 `journalctl --user -u tailcat-ssh -f` 看。

### Windows：任务计划程序

不建议注册成 Windows 服务。内置 SSH 服务端的交互式会话走 ConPTY，需要挂在用户会话上；服务跑在 Session 0 里，拿不到控制台也拿不到用户环境。用任务计划程序，并且选 **“只在用户登录时运行”**：

- 触发器：登录时
- 操作：程序 `C:\Users\你\scoop\shims\tailcat.exe`，参数 `serve --ssh-authorized-keys=C:\Users\你\.ssh\authorized_keys ssh`
- 不要勾「不管用户是否登录都要运行」，那会破坏交互式会话

另外，注册成服务还意味着拿不到用户环境变量和家目录，登录进去的 shell 会缺一堆东西。

## 固定地址

默认每次 `serve` 都会生成一次性密钥，进程退出后地址永久失效。想固定：

```bash
tailcat genkey --key=default --fixed-region
```

它会打印一次地址，并写入 `~/.config/tailcat/keys/default.private.json`。之后 `serve` 会自动复用，启动日志会变成：

```text
🐈 Server listening with saved key "default": tcXXXXXXXXX
```

`default` 是个魔法名字：只要这个密钥存在，裸跑 `tailcat serve` 就会用它。想临时回到一次性地址，加 `--key=new`。

> [!CAUTION]
> 固定地址等于长期凭证。任何曾经拿到过这个地址的人，都能连上未来的每一次 `serve`。所以固定地址时务必同时启用 `--ssh-authorized-keys`，或者在隧道层用 `--allow` 限定客户端公钥。

想删掉：

```bash
tailcat genkey --delete --key=default
tailcat genkey --list
```

## 指定 SSH 私钥

这一节是实际配置时最容易卡住的地方，因为 `tailcat ssh` 的用法是：

```text
tailcat ssh [-p <port|ip:port>] [user@]<tc-addr> [<command> [args...]]
```

它会把 destination **之后的所有参数原样传给 ssh**，而且内部在 destination 前已经加了 `--`。所以下面两种写法都不行：

```bash
tailcat ssh tcXXX -i ~/.ssh/work_ed25519   # ✗ 被当作远端命令
tailcat ssh -i ~/.ssh/work_ed25519 tcXXX   # ✗ tailcat 不认 -i
```

`-p` 在 `tailcat ssh` 里的含义也不同：它是 **tailcat 服务端的端口**（默认 22），或者 exit-node 模式下服务器网络里的 `ip:port`。

三种可用的写法：

### 方法一：ssh-agent

`tailcat ssh` 最终调用的是系统 ssh，agent 里的密钥会自动参与认证：

```bash
ssh-add ~/.ssh/work_ed25519
tailcat ssh tcXXX
```

最省事，适合临时用。

### 方法二：写进 ~/.ssh/config

因为 `tailcat ssh` 本质就是「系统 ssh + 一条 ProxyCommand」，完全可以自己拼出来，这样所有 ssh 选项都能用：

```ini
Host mybox
    HostName tailcat                    # 只是个标签，不参与解析
    ProxyCommand tailcat tcFwWCCcjS5nKNqAod034n... 22
    IdentityFile ~/.ssh/work_ed25519
    IdentitiesOnly yes
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
```

之后：

```bash
ssh mybox
ssh mybox "uname -a"
scp file mybox:/tmp/
```

`scp` 也能直接用，因为它走的是同一个 ProxyCommand。`IdentitiesOnly yes` 建议加上，否则 ssh 会把所有 key 挨个试一遍，可能触发服务端的认证次数上限。

### 方法三：一条命令内联

```bash
ssh -i ~/.ssh/work_ed25519 \
    -o IdentitiesOnly=yes \
    -o StrictHostKeyChecking=no \
    -o UserKnownHostsFile=/dev/null \
    -o "ProxyCommand=tailcat tcFwWCCcjS5nKNqAod034n... 22" \
    mybox
```

最后的 `mybox` 可以是任意名字，真实连接由 ProxyCommand 完成。

## 隧道身份：另一层「密钥」

如果把上面的叫「SSH 层认证」，tailcat 自己还有一层「隧道层认证」，两者是独立的。

生成客户端身份：

```bash
tailcat genkey --client --key=client-default
```

它会打印公钥，形如 `nodekey:cfb6bfa77a...`。服务器端限定只有这个客户端能连：

```bash
tailcat serve --allow=nodekey:cfb6bfa77a... --ssh-authorized-keys=~/.ssh/authorized_keys ssh
```

客户端这边不需要额外参数——`client-default` 存在时会自动使用。想用别的名字或指定文件：

```bash
tailcat --key=myclient ssh tcXXX
tailcat --key=~/.config/tailcat/keys/myclient.private.json ssh tcXXX
```

`--key` 是**全局 flag，必须写在子命令前面**。

查看当前会用的公钥：

```bash
tailcat printpub
```

两层认证叠加之后，即使地址被泄露，对方也需要同时持有被允许的隧道身份和 SSH 私钥，安全性才算正经。

## 几个容易忽略的细节

**不做 host key 校验。** `tailcat ssh` 内部固定加了：

```text
-o StrictHostKeyChecking no
-o UserKnownHostsFile /dev/null
-o UpdateHostKeys no
```

它在自己的信任模型里成立——WireGuard 层已经认证了对端，host key 并不是唯一凭据。但如果你习惯靠指纹确认服务器身份，要知道这里没有这一步。

**出站即可，不用进入站。** 需要放通的是出站 UDP（NAT 打洞）和 TCP 443（DERP 中继）。云厂商安全组通常不用改。

**连不上先测链路。**

```bash
tailcat ping tcXXX
```

输出会告诉你走的是 `direct` 还是 `DERP`。如果一直落在 DERP，吞吐会被共享中继的限速拖住，但延迟通常还能用。

**默认用官方限速中继。** 打洞失败时会回落到 `tailcat.dev` 提供的公共 DERP，这是有速率限制的共享资源。需要稳定高带宽的话，可以自己跑一个 [derper](https://github.com/tailscale/tailscale/tree/main/cmd/derper)，两端用 `--derpmap-url` 指过去。

**Windows 权限跟着启动者走。** 用普通 PowerShell 启动就是普通用户；用「以管理员身份运行」启动，登录进去的会话就是提权的。远程会话里没法弹 UAC，要提权只能从启动方式上解决。

**登录身份就是跑 tailcat 的那个账户**，家目录也是它的家目录。Linux 上想要 root 就用 root 跑，Windows 上想要 SYSTEM 就别指望交互式 shell。

## 顺带能做的事

同一条隧道还能直接用来转发端口和传文件，不必另配：

```bash
# 把服务器 8080 映射到本地 18080
tailcat forward tcXXX 18080:8080

# 打开服务器上的网页
tailcat browse tcXXX

# 传文件（服务器端先 tailcat recv ~/inbox）
tailcat cp report.pdf tcXXX:

# 测吞吐和延迟
tailcat perf tcXXX
```

Windows 服务器上把 RDP 打出来也很顺手：

```bash
tailcat forward tcXXX 13389:3389
```

如果主要用途是图形化操作，直接在 Windows 上 `tailcat serve 3389` 比走 SSH 更合适。

## 一套完整配置

服务器（Linux 或 Windows 都一样）：

```bash
tailcat genkey --key=default --fixed-region
tailcat serve --allow=nodekey:<客户端公钥> \
              --ssh-authorized-keys=~/.ssh/authorized_keys ssh
```

本机 `~/.ssh/config`：

```ini
Host mybox
    ProxyCommand tailcat tc固定地址 22
    IdentityFile ~/.ssh/work_ed25519
    IdentitiesOnly yes
```

之后就是 `ssh mybox`。地址固定、隧道身份明确、SSH 层还有公钥，三层都不依赖「谁都不知道这串地址」这种假设。

对个人几台机器的场景来说，这套配置的心智负担比开 VPN 或者折腾 frp 小得多：服务器上没有监听端口，客户端上没有常驻进程，地址还能随时作废重来。
