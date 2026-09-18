---
title: Cloudflare 加速实践
published: 2025-08-20
description: 记录一次改善 Cloudflare 服务国内访问速度的实践、测试过程与未达预期的原因。
tags: [cloudflare, cdn, web]
category: Web 与工具
draft: false
device: MacBook Pro
---
这次测试以 `blog.pinellia.uk` 为例，目标是改善 Cloudflare 服务在国内网络中的直连表现。参考方案来自 [BestWorkers](https://cmliussss.com/p/BestWorkers/)。

## 测试结果

### ITDOG TCPing 正常

![1755619518954](https://ipfs.pinellia.uk/ipfs/QmYaCGNTTrshP8FbKaCkbfCfpqWMBE3aVE3G8UtmNF2s2U)

ITDOG 的 TCPing 测试全部通过，但电脑和平板直连时仍然经常无法访问：

```text
curl: (35) LibreSSL SSL_connect: SSL_ERROR_SYSCALL in connection to blog.pinellia.uk
浏览器：ERR_CONNECTION_CLOSED
```

### 排除 DNS 解析差异

Clash 的 DNS 解析结果与 ITDOG 一致：

<div style="display: flex; gap: 16px;">
    <img src="https://ipfs.pinellia.uk/ipfs/QmfHVxTswG6Yr3B4ZJVjTMzkSzg5BszYAiLabQH6UN3iXt" alt="1755619893625" style="width: 49%;">
    <img src="https://ipfs.pinellia.uk/ipfs/QmQ1x4uCyp56m4X7q65sS3DJbACVn79DnKv87b2JpjMbpM" alt="1755619405601" style="width: 49%;">
</div>

解析出的 IP 可以 Ping 通，走代理时也能正常连接，因此问题不像是单纯的 DNS 解析错误。测试期间没有找到稳定复现的具体原因；电脑和平板等待一段时间后恢复直连。

这次调整没有形成可以验证的加速结论。后续排查应分别记录 DNS 结果、TLS 握手、路由和不同运营商网络下的表现，不能只根据 TCPing 全绿判断站点已经可用。
