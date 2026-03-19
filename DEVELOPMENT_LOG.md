# Hugo Site Development Log

Last updated: 2026-03-18

## 1) Project Goal

From a basic Hugo blog scaffold to a writing-focused site with:

- richer Markdown rendering (closer to Typora reading experience)
- Mermaid diagram support
- improved article typography and code/figure styles
- tag taxonomy + single tag filtering
- multi-tag combination filtering (AND logic) on the writing list
- tag frequency statistics and descending sort in filter chips

## 2) Initial Baseline (Before Changes)

The project already had basic Hugo layout files and simple styles:

- `layouts/_default/baseof.html`
- `layouts/_default/list.html`
- `layouts/_default/single.html`
- `assets/css/main.css`
- `layouts/partials/mermaid.html` (old conditional script logic)
- `layouts/_markup/render-codeblock-mermaid.html`
- `static/js/mermaid-init.js` (present but not fully unified with template flow)

Main issues at this stage:

- Markdown extensions were not fully enabled in config.
- Mermaid rendering path had overlapping logic and was not fully consistent.
- Article typography was basic and not close to Typora.
- No usable tag filtering UX in writing pages.

## 3) Phase A: Markdown + Typora-like Article Experience

### A.1 Hugo Markdown configuration upgrades

Edited: `hugo.toml`

What was added:

- `markup.goldmark` renderer/parser/extension settings
- enabled extensions: table, taskList, footnote, definitionList, strikethrough, typographer, cjk, passthrough
- `markup.highlight` options for fenced code behavior

Result:

- richer Markdown syntax support became stable and explicit.

### A.2 Unified Mermaid rendering pipeline

Edited:

- `layouts/_default/baseof.html`
- `layouts/_default/single.html`
- `layouts/partials/mermaid.html`
- `layouts/_markup/render-codeblock-mermaid.html`
- `static/js/mermaid-init.js`

What changed:

- Mermaid script injection moved to base template and became page-aware.
- `single.html` removed duplicate/old injection point.
- render hook sets page state (`hasMermaid`) when Mermaid block exists.
- `partials/mermaid.html` now loads Mermaid JS only when needed.
- Mermaid client script standardized (CDN version and theme variables).

Result:

- Mermaid code blocks render reliably with one consistent flow.
- pages without Mermaid no longer load Mermaid script.

### A.3 Article typography redesign (Typora-like)

Edited: `assets/css/main.css` (rewritten)

What changed:

- refined visual tokens (colors, spacing, fonts, borders, shadows)
- improved article reading container style
- detailed styles for headings, paragraphs, lists, blockquotes
- code block + inline code polish
- table, footnotes, task-list, details styles
- diagram block styles and responsive behavior
- mobile readability tuning

Result:

- significantly improved reading experience in article pages.

### A.4 Markdown image render hook enhancement

Added: `layouts/_markup/render-image.html`

What changed:

- Markdown image output wrapped as `figure`
- optional `figcaption` from title
- `loading="lazy"` added

Result:

- image rendering is cleaner and more article-friendly.

## 4) Phase B: Tag System (Single Tag Filter + Display)

### B.1 Taxonomy configuration

Edited: `hugo.toml`

What changed:

- added `[taxonomies]`
- `tag = 'tags'`
- `category = 'categories'`

Result:

- Hugo now generates tag term pages (`/tags/<term>/`).

### B.2 Tag UI for writing list and post cards

Edited:

- `layouts/_default/list.html`
- `layouts/_default/single.html`
- `assets/css/main.css`
- `layouts/partials/tags-filter.html` (new)

What changed:

- writing list page gained top tag chips (`All`, `#tag...`)
- tag term pages reuse the same tag bar
- each post item shows its own tag chips
- single article header also shows clickable tags

Result:

- users can browse by tag quickly via normal Hugo routes.

### B.3 Content front matter updates (sample posts)

Edited:

- `content/writing/first-post.md`
- `content/writing/mermaid.md`

What changed:

- added `tags: [...]` in front matter

Result:

- example pages immediately participate in tag listing/filtering.

## 5) Phase C: Multi-Tag Combination Filtering (AND)

### C.1 Template data attributes for client-side filtering

Edited:

- `layouts/_default/list.html`
- `layouts/partials/tags-filter.html`

What changed:

- added filter root and metadata attributes (`data-tag-filter-root`, `data-initial-tag`, etc.)
- each post includes normalized tag slug data (`data-post-tags`)
- added empty-result message placeholder
- tag chips now expose `data-tag`

Result:

- template provides all structured data needed for JS filtering.

### C.2 Multi-select filter script

Added: `static/js/tags-filter.js`

Core behaviors:

- click tags to toggle selection
- support selecting one or multiple tags
- AND logic: post must contain all selected tags
- `All` clears selection
- URL query sync: `/writing/?tags=tag1,tag2`
- browser history compatibility via `replaceState` and `popstate`
- dynamic summary and empty-state messaging

Result:

- users can perform combination filtering without page reloads.

### C.3 Supporting styles for new interactions

Edited: `assets/css/main.css`

What changed:

- tag filter layout refinements
- active/hover chip states
- meta text and empty-state styles

Result:

- multi-tag filtering is visually clear and consistent with site theme.

## 6) Phase D: Tag Frequency Count + Descending Sort

### D.1 Frequency aggregation based on all writing posts

Edited: `layouts/partials/tags-filter.html`

What changed:

- for all writing pages, tag occurrences are counted
- a unified per-tag data object is built (`slug`, `label`, `count`, `url`)
- tags are sorted by `count desc` before rendering

Result:

- high-frequency tags appear earlier in the selection bar.

### D.2 Count display in tag chips

Edited:

- `layouts/partials/tags-filter.html`
- `assets/css/main.css`

What changed:

- each chip now shows count (example: `#mermaid 12`)
- dedicated `.tag-count` style added for readable compact display
- helper text updated to explain sort rule

Result:

- users can quickly identify popular tags and prioritize filters.

## 7) Full File Change List

Updated files:

- `hugo.toml`
- `assets/css/main.css`
- `layouts/_default/baseof.html`
- `layouts/_default/list.html`
- `layouts/_default/single.html`
- `layouts/partials/mermaid.html`
- `layouts/_markup/render-codeblock-mermaid.html`
- `static/js/mermaid-init.js`
- `content/writing/first-post.md`
- `content/writing/mermaid.md`

New files:

- `layouts/_markup/render-image.html`
- `layouts/partials/tags-filter.html`
- `static/js/tags-filter.js`
- `DEVELOPMENT_LOG.md`

## 8) How to Add Tags in New Articles

Use front matter:

```yaml
---
title: "Your Post"
date: 2026-03-18
draft: false
tags: ["hugo", "mermaid", "network"]
summary: "Short summary."
---
```

## 9) Verification Performed

Build command used repeatedly during development:

```bash
hugo
```

Validation goals:

- template compilation succeeds
- Mermaid pages load Mermaid script, non-Mermaid pages do not
- tag term pages are generated
- writing list supports multi-tag AND filtering
- tag chips display per-tag counts and are sorted by frequency (desc)

## 10) Current Feature Snapshot

Current writing system supports:

- rich Markdown syntax
- Mermaid rendering
- improved article readability (Typora-like direction)
- tag display in post list and post header
- single-tag routing pages (`/tags/<term>/`)
- multi-tag combination filtering on list page via UI and URL params
- tag chips show article-frequency counts and are sorted high-to-low
