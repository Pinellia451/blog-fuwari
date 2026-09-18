---
title: Mihomo 设置指南
published: 2025-10-05
description: 整理 Mihomo 在 Android 等场景下的配置补充、模块设置与常见注意事项。
tags: [mihomo, proxy, clash, env-setup]
category: 环境与系统
draft: false
device: Windows
---
## Android

将新模块推送到 Mihomo 配置目录：

```shell
adb push "$HOME/Downloads/TT/Clash配置.yaml" /sdcard/Android/Clash
```

## macOS

macOS 版 Clash Verge Rev 在这台设备上运行不稳定，改为直接运行 Mihomo 内核。

```shell
macOS sudo mv mihomo.plist /Library/LaunchDaemons
# 加载服务
sudo launchctl load /Library/LaunchDaemons/mihomo.plist
# 查看服务
sudo launchctl list | grep mihomo
# 卸载停止服务
sudo launchctl unload /Library/LaunchDaemons/mihomo.plist

# 启动服务
sudo launchctl start mihomo
# 停止服务
sudo launchctl stop mihomo


```

## macOS TUN 与 DNS 排查

记录日期：2026-08-12。

macOS 使用 Mihomo TUN 时，抖音、百度等国内网站明显卡顿，Google 也无法访问。关闭 TUN 后恢复正常，设置系统 SOCKS 代理后 Google 可以访问。

排查确认问题不在代理节点或规则：即使切换为全局 DIRECT，流量仍然需要经过 TUN 入站协议栈，因此 TUN 路径异常依然会影响连接。将 TUN 从 `gvisor` 调整为 `system`，移除无效的 `device: wlan9`，关闭 `strict-route` 和 IPv6，并将 MTU 调整为 1380 后，仍未解决 Google 访问问题。

最终确认根因是 macOS 的局域网 DNS 没有被 Mihomo 劫持。系统 DNS 指向路由器（例如 `192.168.x.1`），同时配置又排除了整个局域网地址段：

```yaml
tun:
  enable: true
  stack: system
  auto-route: true
  auto-detect-interface: false
  dns-hijack:
    - any:53
    - tcp://any:53
  strict-route: false
  mtu: 1380
  route-exclude-address:
    - 192.168.0.0/16
    - fc00::/7

interface-name: en0
ipv6: false
```

由于路由器地址位于被排除的 `192.168.0.0/16` 中，发往路由器的 53 端口请求不会进入 TUN，`dns-hijack` 无法生效。路由器当时为 `www.google.com` 返回了错误的公网地址，而 Mihomo DNS 返回的是正常的 Fake-IP `198.18.x.x`。显式设置 SOCKS 代理时，域名直接交给 Mihomo，所以 Google 可以访问。

解决方法是把 macOS Wi-Fi 的普通 DNS 改为公网 DNS，使 53 端口查询进入 TUN 后由 Mihomo 劫持：

```shell
sudo networksetup -setdnsservers Wi-Fi 223.5.5.5 119.29.29.29
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

修改后可通过以下命令验证：

```shell
dscacheutil -q host -a name www.google.com
```

开启 Fake-IP TUN 时，正常结果应为 `198.18.x.x`，而不是路由器返回的错误公网 IP。

修改普通 DNS 不会使 Bonjour/mDNS 失效。mDNS 使用 UDP 5353 和组播地址 `224.0.0.251`/`FF02::FB`，与普通 DNS 的 53 端口不同；`.local` 设备发现、AirPlay、AirDrop 和 Bonjour 打印机仍可正常工作。可能受影响的是由路由器普通 DNS 提供的 `nas`、`router.lan` 等内部域名，而不是 `设备名.local`。可使用 `dns-sd -G v4v6 设备名.local` 验证 mDNS。
