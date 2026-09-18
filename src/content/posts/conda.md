---
title: Python 环境配置
published: 2025-08-08
description: 通过视频和简要选型说明，了解 Miniconda、conda-forge 与 mamba 的适用场景。
tags: [conda, python, env-setup]
category: 环境与系统
draft: false
device: Windows
---
这篇短文保留一段 Python 环境配置视频，并补充工具选择结论。需要在无 root 服务器上部署时，可改用体积更小的 `micromamba`。

## 介绍视频

<div style="position: relative; width: 60%; aspect-ratio: 16/9; border-bottom: 20px solid #ffffff00;">
    <iframe src="https://player.bilibili.com/player.html?bvid=BV1Fm4ZzDEeY"
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
        scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true">
    </iframe>
</div>

## 选择建议

1. 需要完整 Conda 体验时使用 `Miniconda`，代价是安装和环境求解相对较重。
2. 已经使用 `conda-forge` 时，可以用 `mamba` 加快依赖求解。
3. 无 root 权限或希望减少安装体积时，优先考虑 `micromamba`。
