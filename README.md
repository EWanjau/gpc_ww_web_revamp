# GracePoint Church Waiyaki Way website

Mobile-first React/Vite homepage prototype with shared navigation and visitor journeys for Plan a visit and Missional Communities.

## Run locally

```sh
npm install
npm run dev
```

Build the static deployable site with `npm run build`; serve `dist/` from any static host. Run the agreed rendered visitor journeys with `npm run test:journeys` (Playwright and Google Chrome at `/usr/bin/google-chrome` are used in this workspace).

## Framework and WordPress

This starter uses **React + TypeScript + Vite**. Vite emits static HTML, CSS and JavaScript that can be deployed to a static host or served behind WordPress. This keeps page delivery lightweight and makes content connections explicit.

Homepage content is read from WordPress's public REST API, `GET {VITE_WORDPRESS_API_URL}/pages?slug=home&_fields=title,content,excerpt,acf`. By default `VITE_WORDPRESS_API_URL` is `https://gpcwaiyakiway.org/wp-json/wp/v2`; set that environment variable for another WordPress install. The `home` page's title and excerpt/content feed the hero. Staff and volunteers can update these through the regular WordPress editor without code changes. The app falls back to a generic welcome message if the public request is unavailable or content is empty. No authenticated writes or credentials are needed in the browser.

The visitor information currently reflects details published on the official GracePoint Church Waiyaki Way site at `https://gpcwaiyakiway.org/` (Sunday 10:30 am–12:30 pm; Muthiga along Wambaa–Wamakima Road; public email `info@gpcwaiyakiway.org`). Review these details in WordPress before deployment if they change. Missional Community and serving links open pre-addressed email drafts; replace with managed WordPress destinations when those pages are available.

## Content updates

1. Sign into WordPress and open **Pages → Home**.
2. Update the title and excerpt (or body content) and publish.
3. Reload the homepage to see the latest published content.

The current design provides starter layout and copy for other homepage sections; those sections can be moved into editable fields/blocks as the page's WordPress content model is finalized.
