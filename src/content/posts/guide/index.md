---
title: Fuwari 文章编写指南
published: 2024-04-01
description: "说明 Fuwari 文章 frontmatter、文件位置和资源组织方式。"
image: "./cover.jpeg"
tags: [demo, astro, guide]
category: Guides
draft: true
device: Windows
---
> Cover image source: [Source](https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/208fc754-890d-4adb-9753-2c963332675d/width=2048/01651-1456859105-(colour_1.5),girl,_Blue,yellow,green,cyan,purple,red,pink,_best,8k,UHD,masterpiece,male%20focus,%201boy,gloves,%20ponytail,%20long%20hair,.jpeg)

这个博客基于 [Astro](https://astro.build/) 构建。本页只记录项目特有的文章约定；通用功能以 [Astro 文档](https://docs.astro.build/) 为准。

## 文章 frontmatter

```yaml
---
title: My First Blog Post
published: 2023-09-09
description: This is the first post of my new Astro blog.
image: ./cover.jpg
tags: [Foo, Bar]
category: Front-end
draft: false
---
```

| Attribute       | Description                                                                                                                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`       | The title of the post.                                                                                                                                                                                                          |
| `published`   | The date the post was published.                                                                                                                                                                                                |
| `description` | A short description of the post. Displayed on index page.                                                                                                                                                                       |
| `image`       | The cover image path of the post.``1. Start with `http://` or `https://`: Use web image``2. Start with `/`: For image in `public` dir``3. With none of the prefixes: Relative to the markdown file |
| `tags`        | The tags of the post.                                                                                                                                                                                                           |
| `category`    | The category of the post.                                                                                                                                                                                                       |
| `draft`       | If this post is still a draft, which won't be displayed.                                                                                                                                                                        |

## 文件位置

文章放在 `src/content/posts/` 中。需要把封面或正文图片与文章放在一起时，可以为文章建立独立子目录。

```
src/content/posts/
├── post-1.md
└── post-2/
    ├── cover.png
    └── index.md
```
