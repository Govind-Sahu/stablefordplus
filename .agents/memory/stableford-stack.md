---
name: Stableford+ Stack Decisions
description: Key decisions and gotchas for the Stableford+ project setup on Replit
---

# Stableford+ Stack Decisions

## Vite port must be 5000 for webview
Replit's webview output type requires port 5000. Vite's default is 5173. Always set `server.port: 5000` in vite.config.js.

**Why:** configureWorkflow throws `Configuration Error: Webview output requires port 5000` if port doesn't match.

**How to apply:** vite.config.js `server.port = 5000`; workflow `waitForPort: 5000, outputType: "webview"`.

## PostCSS config required for Tailwind in Vite
Tailwind CSS will silently fail (no styles applied) without a `postcss.config.js`. Create it with tailwindcss and autoprefixer plugins.

**Why:** Vite uses PostCSS under the hood; without the config, Tailwind directives in index.css don't transform.

**How to apply:** Always create postcss.config.js when setting up Tailwind + Vite.

## Backend runs on port 3001, console output type
Express backend uses `outputType: "console"`, Vite proxies `/api` and `/uploads` to `http://localhost:3001`.
