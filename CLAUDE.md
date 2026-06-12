# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
│   ├── [...page].astro    # Paginated index (home)
│   ├── [spec].astro       # Tag/category filtered view
│   ├── archive.astro      # Archive page
│   ├── about.astro        # About page
│   ├── friends.astro      # Friends links page
│   ├── rss.xml.ts         # RSS feed generation
│   └── robots.txt.ts      # Robots.txt
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
├── constants/             # Constants (link presets, icons, theme modes)
└── utils/                 # Utility functions (date, URL, content, settings)
```

### Post Frontmatter

Posts in `src/content/posts/` use YAML frontmatter:

```yaml
---
title: My First Blog Post
published: 2023-09-09
description: Short description
image: ./cover.jpg          # Optional: cover image (relative, /public, or URL)
tags: [Foo, Bar]
category: Front-end
draft: false                # Set true to hide from published site
device: Windows             # Optional: metadata badge (Windows, Linux, Mac)
lang: jp                    # Optional: if post language differs from site lang
---
```

Custom fields (added in this fork): `device`, `lang`, and AIGC-related metadata.

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

## Development Notes

- **Package manager**: pnpm only (enforced via `preinstall` script)
- **Formatter**: Biome (configured for JS/TS/Astro/Svelte via VSCode settings and `biome.json`)
- **CSS framework**: TailwindCSS 3 + Stylus for custom variables
- **Page transitions**: Swup (smooth navigation between pages)
- **Search**: Pagefind (build-time indexing, no server needed)
- **Comments**: Giscus (GitHub Discussions-based)
