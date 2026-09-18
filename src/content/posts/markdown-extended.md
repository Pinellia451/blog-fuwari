---
title: Markdown 扩展功能示例
published: 2024-05-01
updated: 2024-11-29
description: '展示 Fuwari 支持的 GitHub 仓库卡片和提示块语法。'
image: ''
tags: [demo, markdown]
category: 'Examples'
draft: true
device: Windows
---
本页用于验证 Fuwari 的 Markdown 扩展语法。修改 remark 或 rehype 插件后，可以通过这里检查仓库卡片和提示块是否仍能正确渲染。

## GitHub 仓库卡片

仓库卡片会链接到对应的 GitHub 项目，并在页面加载时读取公开仓库信息。

::github{repo="Fabrizz/MMM-OnSpotify"}

使用 `::github{repo="<owner>/<repo>"}` 插入仓库卡片。

```markdown
::github{repo="saicaca/fuwari"}
```

## 提示块

支持 `note`、`tip`、`important`、`warning` 和 `caution` 五种类型。

:::note
Highlights information that users should take into account, even when skimming.
:::

:::tip
Optional information to help a user be more successful.
:::

:::important
Crucial information necessary for users to succeed.
:::

:::warning
Critical content demanding immediate user attention due to potential risks.
:::

:::caution
Negative potential consequences of an action.
:::

### Basic Syntax

```markdown
:::note
Highlights information that users should take into account, even when skimming.
:::

:::tip
Optional information to help a user be more successful.
:::
```

### Custom Titles

The title of the admonition can be customized.

:::note[MY CUSTOM TITLE]
This is a note with a custom title.
:::

```markdown
:::note[MY CUSTOM TITLE]
This is a note with a custom title.
:::
```

### GitHub Syntax

> [!TIP]
> [The GitHub syntax](https://github.com/orgs/community/discussions/16925) is also supported.

```
> [!NOTE]
> The GitHub syntax is also supported.

> [!TIP]
> The GitHub syntax is also supported.
```
