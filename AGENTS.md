# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

Fuwari — a personal blog built with [Astro](https://astro.build) + Svelte + TailwindCSS. Deployed at https://pinellia.uk/. This is a custom fork of the [saicaca/fuwari](https://github.com/saicaca/fuwari) template with numerous modifications.

## Language

- Blog content is primarily in **Chinese (zh_CN)**.
- Code comments, config, and variable naming follow English conventions.

## Key Commands

| Command | Action |
|---------|--------|
| `pnpm dev` | Start local dev server at `localhost:4321` |
| `pnpm build` | Build production site to `./dist/` + index with Pagefind |
| `pnpm preview` | Preview built site locally |
| `pnpm new-post <filename>` | Scaffold a new blog post |
| `pnpm format` | Format code with Biome |
| `pnpm lint` | Lint and auto-fix with Biome |
| `pnpm check` | Run Astro checks |
| `pnpm type-check` | TypeScript type checking (`tsc --noEmit`) |

## Architecture

### Directory Layout

```
src/
├── config.ts              # Site-wide config (nav, profile, theme, license, giscus)
├── content/
│   ├── config.ts          # Astro content collection schema
│   └── posts/             # Blog posts (Markdown, frontmatter-driven)
├── components/            # UI components (Astro + Svelte)
│   ├── PostCard.astro     # Blog post card (list view)
│   ├── PostMeta.astro     # Post metadata badges (tags, device, AIGC)
│   ├── PostPage.astro     # Full post page layout
│   ├── Search.svelte      # Pagefind-based search overlay
│   ├── ArchivePanel.svelte # Archive view
│   └── ...
├── layouts/
│   ├── Layout.astro       # Base HTML shell
│   └── MainGridLayout.astro # Grid layout for index/archive
├── pages/
│   ├── [...page].astro       # Paginated index (home)
│   ├── [spec].astro          # Static pages (about, friends) — excludes from slug list
│   ├── posts/[...slug].astro # Individual post page
│   ├── archive.astro         # Archive page
│   ├── about.astro           # About page
│   ├── friends.astro         # Friends links page
│   ├── rss.xml.ts            # RSS feed generation
│   └── robots.txt.ts         # Robots.txt
├── plugins/               # Custom remark/rehype plugins
│   ├── rehype-component-admonition.mjs  # Admonition (note/tip/warning/etc.) rendering
│   ├── rehype-component-github-card.mjs # GitHub repo card component
│   ├── remark-directive-rehype.js       # Directive AST parsing
│   ├── remark-excerpt.js                # Post excerpt extraction
│   ├── remark-reading-time.mjs          # Reading time calculation
│   └── expressive-code/                 # Expressive Code customization
│       ├── custom-copy-button.ts
│       └── language-badge.ts
├── styles/                # Global styles (CSS + Stylus)
├── types/config.ts        # TypeScript type definitions
├── i18n/                  # i18n translations (i18nKey.ts, translation.ts)
├── constants/             # Constants (link presets, icons, theme modes, tag display map)
│   ├── constants.ts
│   ├── icon.ts
│   ├── link-presets.ts
│   └── tag-display.ts     # Tag slug → display name mapping + getTagDisplayName()
└── utils/                 # Utility functions
    ├── content-utils.ts   # Post queries, getTagList(), getCategoryList()
    ├── date-utils.ts      # Date formatting helpers
    ├── setting-utils.ts   # Site setting helpers
    └── url-utils.ts       # URL builders (getTagUrl, getCategoryUrl, getPostUrlBySlug)
```

### Post Frontmatter

Posts in `src/content/posts/` use YAML frontmatter:

```yaml
---
title: My First Blog Post
published: 2023-09-09
updated: 2024-11-29           # Optional: last-modified date (shown in PostMeta)
description: Short description
image: ./cover.jpg            # Optional: cover image (relative, /public, or URL)
tags: [conda, python, env-setup]
category: 环境配置
draft: false                  # true = hidden from all published views
hide: true                    # Optional: hide from index but keep in archive/sitemap
device: MacBook Pro           # Optional: metadata badge (Windows, Linux, Mac, MacBook Pro)
aigc: Cursor                  # Optional: AI-assisted label
lang: jp                      # Optional: override site language for this post
---
```

Custom fields added in this fork: `device`, `lang`, `hide`, `aigc`, `updated`.

### Tag System

Tags follow a **slug → display name** architecture:

- **In frontmatter**: tags are **English lowercase slugs** (e.g., `env-setup`, `photography`). These appear in URL query params (`/archive/?tag=photography`).
- **On screen**: rendered via `getTagDisplayName()` in `src/constants/tag-display.ts`, which maps slugs to Chinese/human-readable names (e.g., `env-setup` → `环境配置`).
- When adding a new tag, add it to the frontmatter first, then add a mapping entry in `tag-display.ts`. Tags without a mapping fall back to displaying the raw slug.
- Three components call `getTagDisplayName()`: `PostMeta.astro`, `widget/Tags.astro`, `ArchivePanel.svelte`.
- `src/utils/content-utils.ts` provides `getTagList()` (tag counts) and `getCategoryList()`.

### Markdown Extensions

In addition to standard GFM, the blog supports:
- **Admonitions**: `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!CAUTION]`, `> [!WARNING]`
- **GitHub Repository Cards**: `::github{repo="user/repo"}`
- **Expressive Code**: Enhanced code blocks with line numbers, collapsible sections, copy button, language badges
- **KaTeX**: Math rendering via `$...$` / `$$...$$`
- **Auto-heading anchors** with anchor icons
- **Reading time** auto-calculation
- **Sectionize**: Auto-wrap headings in sections

### Content Collection Schema

Defined in `src/content/config.ts` — validates frontmatter for all posts using Zod.

### Site Configuration

All site-wide config lives in `src/config.ts`:
- `siteConfig` — title, subtitle, lang, theme color, banner, TOC, favicon
- `navBarConfig` — navigation links (Home, Archive, About, Friends, GitHub, Wiki)
- `profileConfig` — avatar, name, bio, social links
- `licenseConfig` — CC BY-NC-SA 4.0
- `expressiveCodeConfig` — code block theme
- `giscusConfig` — comment system (Giscus connected to this repo)

### Build Pipeline

Astro builds to static HTML → Pagefind indexes the output in `dist/` for search. Deployed via Vercel.

### Content Visibility

Three frontmatter flags control visibility:
- `draft: true` — excluded from all views in production (index, archive, tag filters, sitemap).
- `hide: true` — hidden from the home page index, but still appears in archive, tag/category filters, and sitemap. Used for photo sets and hidden pages.
- No flag — fully visible everywhere.

`content-utils.ts` exposes two query functions: `getSortedPosts()` (home page, respects `hide`) and `getSortedPostsForArchive()` (archive, includes hidden).

### Post Image Storage

Images for a post live alongside the `.md` file or in subdirectories:
```
src/content/posts/
├── my-post.md
├── my-post/            # Images referenced as ./my-post/image.png
│   └── image.png
├── guide/
│   ├── index.md
│   └── cover.jpeg
└── image/
    └── conda/          # Shared images across posts
```

Posts can include raw `<style>` and `<script>` blocks (not frontmatter-wrapped) for per-post CSS/JS — used by photo posts (`P-*.md`).

## Development Notes

- **Package manager**: pnpm only (enforced via `preinstall` script)
- **Formatter**: Biome (configured for JS/TS/Astro/Svelte via VSCode settings and `biome.json`)
- **CSS framework**: TailwindCSS 3 + Stylus for custom variables
- **Page transitions**: Swup (smooth navigation between pages)
- **Search**: Pagefind (build-time indexing, no server needed)
- **Comments**: Giscus (GitHub Discussions-based)
