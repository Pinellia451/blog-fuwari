---
title: 在文章中嵌入视频
published: 2023-08-01
description: 展示在 Markdown 文章中嵌入 YouTube、哔哩哔哩和 m3u8 播放器的方法。
tags: [demo, video]
category: Examples
draft: true
device: Windows
---
Astro 的 Markdown 内容可以直接使用 HTML，因此可以粘贴视频平台提供的嵌入代码。发布前应确认来源可信，并为 iframe 设置明确尺寸和 `allowfullscreen`。

```yaml
---
title: Include Video in the Post
published: 2023-10-19
// ...
---

<iframe width="100%" height="468" src="https://www.youtube.com/embed/5gIf0_xpFPI?si=N1WTorLKL0uwLsU_" title="YouTube video player" frameborder="0" allowfullscreen></iframe>
```

## YouTube

<iframe width="100%" height="468" src="https://www.youtube.com/embed/5gIf0_xpFPI?si=N1WTorLKL0uwLsU_" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

## Bilibili

<div style="position: relative; width: 60%; aspect-ratio: 16/9;">
    <iframe src="//player.bilibili.com/player.html?bvid=BV1Fm4ZzDEeY"
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
        scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>
</div>

## m3u8

<iframe src="https://m3u8player.org/player.html?url=https://raw.githubusercontent.com/Pinellia451/m3u8-storge/refs/heads/main/11.m3u8"></iframe>
