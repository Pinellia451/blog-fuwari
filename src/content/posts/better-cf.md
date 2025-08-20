---
title: cf加速实践
published: 2025-08-20
description: 尝试加速cf的服务国内访问，但失败
tags: [Cloudflare]
category: Cloudflare
draft: false
---
# 参考

https://cmliussss.com/p/BestWorkers/

## 结果记录

尝试加速本博客 blog.pinellia.uk为例

### itdog tcping全绿：

![1755619518954](https://ipfs.pinellia.uk/ipfs/QmYaCGNTTrshP8FbKaCkbfCfpqWMBE3aVE3G8UtmNF2s2U)

但本地的设备包括电脑手机，在走直连的情况下，访问极其受限，大部分情况下：

```
curl报错为curl: (35) LibreSSL SSL_connect: SSL_ERROR_SYSCALL in connection to blog.pinellia.uk 
浏览器报错：ERR_CONNECTION_CLOSED
```

### 确认非dns问题

clash的dns结果与itdog吻合：

<div style="display: flex; gap: 16px;">
    <img src="image/better-cf/1755619893625.png" alt="1755619893625" style="width: 49%;">
    <img src="image/better-cf/1755619405601.png" alt="1755619405601" style="width: 49%;">
</div>

尝试指定
找不到无法访问的原因，走代理的情况下能连接。
可以ping通解析出来的ip

rec：
平板和电脑等了很长时间莫名其妙就能连接了