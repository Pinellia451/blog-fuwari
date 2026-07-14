# Pinellia Blog

[Pinellia Blog](https://pinellia.uk/) 是一个使用 Astro、Svelte 和 Tailwind CSS 构建的个人博客，内容以中文为主，主要记录环境配置、编程与算法、Web 工具和摄影。

项目基于 [saicaca/fuwari](https://github.com/saicaca/fuwari) 深度定制，采用静态构建并部署到 Vercel。

## 功能

- Astro 静态生成与 Svelte 交互组件
- 明暗主题和可调主题色
- Pagefind 全文搜索
- 文章归档、分类和标签筛选
- 目录、阅读时间与上一篇/下一篇导航
- RSS、sitemap 和结构化数据
- Giscus 评论
- 扩展 Markdown：提示块、GitHub 仓库卡片、KaTeX 和 Expressive Code

## 本地开发

需要 Node.js 20+ 和 pnpm 9+。

```sh
pnpm install
pnpm dev
```

开发服务器默认运行在 <http://localhost:4321>。

## 常用命令

| 命令 | 说明 |
|---|---|
| `pnpm dev` | 启动本地开发服务器 |
| `pnpm build` | 构建生产站点并生成 Pagefind 索引 |
| `pnpm preview` | 本地预览生产构建 |
| `pnpm new-post <filename>` | 创建文章草稿文件 |
| `pnpm check` | 运行 Astro 检查 |
| `pnpm type-check` | 运行 TypeScript 类型检查 |
| `pnpm lint` | 使用 Biome 检查并修复源码 |
| `pnpm format` | 使用 Biome 格式化源码 |

## 内容结构

文章位于 `src/content/posts/`，页面内容位于 `src/content/pages/`。文章图片建议与 Markdown 文件放在同级目录或专属子目录中。

```yaml
---
title: 文章标题
published: 2026-01-01
updated: 2026-01-02
description: 用一两句话概括文章内容
image: ./cover.jpg
tags: [python, env-setup]
category: 环境与系统
draft: false
hide: false
device: MacBook Pro
aigc: Claude Code
---
```

### 可见性

- `draft: true`：生产环境不发布。
- `hide: true`：不在首页展示，但仍保留在归档、筛选页和 sitemap 中。
- 两者均为 `false`：正常公开展示。

### 分类和标签

- 每篇文章只使用一个主分类。
- 标签使用英文小写 slug，通常保留 2–4 个。
- 标签显示名维护在 `src/constants/tag-display.ts`。
- 当前主分类为：环境与系统、编程与算法、Web 与工具、摄影。

## 关键配置

- `src/config.ts`：站点标题、导航、个人资料、主题、许可和 Giscus。
- `src/content/config.ts`：文章 frontmatter 校验规则。
- `astro.config.mjs`：Astro、Markdown 与构建配置。
- `vercel.json`：旧文章 URL 重定向。

## 部署

生产构建命令为：

```sh
pnpm build
```

构建结果输出到 `dist/`。仓库当前通过 Vercel 部署到 <https://pinellia.uk/>。

## 致谢与许可

- 博客模板：[Fuwari](https://github.com/saicaca/fuwari)
- 文章默认采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- 项目代码沿用仓库中的 [MIT License](./LICENSE)
