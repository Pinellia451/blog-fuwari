---
title: macOS 读写 NTFS 移动硬盘：从只读 FSKit 到 macFUSE
published: 2026-07-17
description: 记录在 macOS 上识别只读 NTFS 分区，并通过 macFUSE 与 NTFS-3G 将移动硬盘手动挂载为可写模式的完整流程。
tags: [macos, ntfs, storage, env-setup]
category: 环境与系统
draft: false
aigc: Codex
device: Mac
---

Windows 常用的 NTFS 移动硬盘接到 macOS 后，文件通常可以读取，却不能新建、修改或删除。下面记录一次把 `WD elements` 移动硬盘从系统默认的只读挂载，切换为 NTFS-3G 可写挂载的过程。

> [!IMPORTANT]
> 这不是“开启 macOS 原生 NTFS 写入”。本文实测环境中的 `mount_ntfs` 来自 Homebrew 安装的 `ntfs-3g-mac`，底层依赖 macFUSE。macOS 自带的 NTFS 支持仍以只读为主。

## 实测环境

- macOS 26.5.1
- Apple FSKit 默认只读挂载
- `ntfs-3g-mac 2022.10.3`
- macFUSE
- NTFS 分区：`/dev/disk8s1`
- 卷标：`WD elements`

磁盘编号会随连接顺序变化，`/dev/disk8s1` 只适用于这次实测。执行命令前一定要先确认自己的设备编号，不要直接照抄。

## 先确认 `mount_ntfs` 来自哪里

参考文章写于较早的 macOS 版本，其测试系统为 10.13.6。较新的 macOS 不应再把 `mount_ntfs` 理解为系统自带的可写 NTFS 驱动。

先检查当前实际调用的程序：

```bash
command -v mount_ntfs
readlink "$(command -v mount_ntfs)"
```

本机输出指向：

```text
/opt/homebrew/sbin/mount_ntfs
../Cellar/ntfs-3g-mac/2022.10.3/sbin/mount_ntfs
```

这说明命令是 NTFS-3G 的 Homebrew 包装脚本。重新挂载后，`mount` 显示的文件系统类型也会从 `ntfs` 变成 `macfuse`。

如果提示 `command not found: mount_ntfs`，需要先安装 macFUSE 和 NTFS-3G：

```bash
brew tap gromgit/fuse
brew install --cask macfuse
brew install gromgit/fuse/ntfs-3g-mac
```

安装 macFUSE 后，按系统提示在“系统设置 → 隐私与安全性”中允许其扩展，并在需要时重新启动。不要为了省事直接关闭 SIP；若系统要求调整 Apple 芯片 Mac 的启动安全策略，应以 [macFUSE 官方说明](https://github.com/macfuse/macfuse/wiki) 为准。

## 第一步：识别 NTFS 分区

插入移动硬盘后，先列出外置磁盘并核对分区信息：

```bash
diskutil list external
diskutil info /dev/disk8s1
```

确认设备编号无误后，查看当前挂载参数：

```bash
mount | grep ntfs
```

本次输出为：

```text
/dev/disk8s1 on /Volumes/WD elements (ntfs, local, nodev, nosuid, read-only, noowners, noatime, fskit)
```

其中几个关键字段是：

- `ntfs`：分区文件系统为 NTFS；
- `read-only`：当前明确以只读方式挂载；
- `fskit`：当前走的是 macOS 的 FSKit 挂载路径；
- `noowners`：不在该卷上执行常规的所有者权限检查。

## 第二步：卸载系统的只读挂载

卸载分区不会清除数据，但执行前仍应关闭正在访问移动硬盘的 Finder 窗口、终端和应用。

```bash
sudo umount /dev/disk8s1
```

也可以让 Disk Utility 框架处理：

```bash
diskutil unmount /dev/disk8s1
```

这里只是卸载文件系统，不是把物理硬盘弹出。设备节点仍然存在，下一步可以立即重新挂载。

## 第三步：建立挂载目录

这里把挂载点放在桌面，名称为 `md1`：

```bash
mkdir -p "$HOME/Desktop/md1"
```

挂载目录必须已经存在，而且应当是空目录。路径中如果包含空格，记得加引号。

## 第四步：以可写方式重新挂载

```bash
sudo mount_ntfs -o rw,nobrowse /dev/disk8s1 "$HOME/Desktop/md1"
```

参数含义如下：

- `rw`：请求以读写模式挂载；
- `nobrowse`：不把该挂载点作为普通磁盘显示在 Finder 侧边栏；
- `/dev/disk8s1`：需要挂载的 NTFS 分区；
- `"$HOME/Desktop/md1"`：访问该分区的新入口。

命令成功时通常没有输出，这是正常现象。因为使用了 `nobrowse`，可以直接打开挂载目录：

```bash
open "$HOME/Desktop/md1"
```

## 第五步：验证是否真的可写

不要只看 `mount_ntfs` 是否报错。先检查实际挂载类型：

```bash
mount | grep '/Desktop/md1'
```

本机重新挂载后的结果为：

```text
/dev/disk8s1 on /Users/nhk/Desktop/md1 (macfuse, local, synchronous, noatime, nobrowse)
```

初始状态中的 `read-only` 已经消失，并且文件系统类型变成了 `macfuse`。最后创建一个临时文件，验证真实写入：

```bash
test_file="$HOME/Desktop/md1/.ntfs-write-test"
touch "$test_file" && rm "$test_file" && echo "NTFS 写入测试通过"
```

只有这一步成功，才能确认当前分区确实可写。

## 安全卸载与恢复默认挂载

使用完毕后，不要直接拔出移动硬盘。先卸载 macFUSE 挂载：

```bash
sudo umount "$HOME/Desktop/md1"
```

然后弹出整块物理磁盘。注意这里使用 `disk8`，而不是分区 `disk8s1`：

```bash
diskutil eject /dev/disk8
```

如果只是想退出可写模式，并恢复 macOS 默认的只读挂载，可以执行：

```bash
sudo umount "$HOME/Desktop/md1"
rmdir "$HOME/Desktop/md1"
diskutil mount /dev/disk8s1
```

手动挂载不会永久修改 NTFS 分区；移动硬盘重新插入后，macOS 通常仍会按默认只读方式挂载。

## 常见问题

### Finder 中看不到移动硬盘

这是 `nobrowse` 的预期行为，不代表挂载失败。使用下面的命令打开即可：

```bash
open "$HOME/Desktop/md1"
```

如果希望它作为普通卷显示，可以尝试去掉 `nobrowse`，但手动挂载点的位置与 Finder 展示效果可能因系统版本而异。

### 提示 `Resource busy`

通常是原来的只读卷尚未卸载，或者某个应用仍在使用它。先关闭相关 Finder 窗口和文件，再检查：

```bash
mount | grep disk8s1
```

确认旧挂载消失后再执行 `mount_ntfs`。

### 提示 macFUSE 不可用

检查 macFUSE 是否已安装、系统扩展是否获准，以及安装后是否完成重启。还可以确认 NTFS-3G 是否存在：

```bash
brew list --versions ntfs-3g-mac
command -v mount_ntfs
```

### Windows 休眠或快速启动导致拒绝写入

如果 NTFS-3G 提示卷处于 hibernated、unclean 或 unsafe state，不要强制挂载。把硬盘接回 Windows，关闭“快速启动”和休眠，执行完整关机；必要时先运行：

```powershell
chkdsk X: /f
```

将 `X:` 替换为移动硬盘的盘符，修复完成并正常弹出后再回到 macOS。

### 是否适合长期使用

NTFS-3G + macFUSE 适合临时兼容已有的 NTFS 硬盘，但性能、系统升级兼容性和异常断电后的恢复能力都需要谨慎对待。重要数据应保留备份；需要长期高频写入时，可以考虑成熟的商业 NTFS 驱动。若硬盘可以重新格式化且主要在 Windows 与 macOS 间交换文件，exFAT 往往更省心，但格式化前必须先备份全部数据。

## 小结

这次操作的状态变化可以概括为：

```text
macOS FSKit 只读挂载
        ↓ 卸载
NTFS-3G + macFUSE 可写挂载
        ↓ 安全卸载
重新插入后恢复系统默认行为
```

最重要的不是记住 `disk8s1`，而是每次先确认设备编号；也不要因为 `mount_ntfs` 没有输出就默认成功，始终用 `mount` 和一次真实的临时文件写入完成验证。

## 参考资料

- [怎样在苹果电脑上用移动硬盘（使用 NTFS 格式硬盘）？](https://zhuanlan.zhihu.com/p/82665550)——原文测试于 macOS 10.13.6，提供了“卸载后重新挂载”的基本思路。
- [macFUSE](https://github.com/macfuse/macfuse)
- [NTFS-3G](https://github.com/tuxera/ntfs-3g)
- [gromgit/homebrew-fuse](https://github.com/gromgit/homebrew-fuse)
