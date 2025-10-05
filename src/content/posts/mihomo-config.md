---
title: mihomo 设置指南
published: 2025-10-05
description: 配置文件的补充说明
tags: [环境配置,]
category: 环境配置
draft: false
---

# Android
机端新模块  
```shell
adb push /Users/nhk/Downloads/TT/Clash配置.yaml /sdcard/Android/Clash
```
# MAC
macOS sudo mv mihomo.plist /Library/LaunchDaemons
```shell
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