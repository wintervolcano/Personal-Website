# Fazal Kareem Portfolio

Personal website for Fazal Kareem, a PhD researcher in radio astronomy. This repo contains the main Vite app plus a standalone 3D globular cluster explorer.

## What is here

- Core site pages for Home, About, Research, Publications, Projects, Blog, Resources, Gallery, Affiliations, and Personal Recommendations.
- Search Mode, an interactive pulsar exploration experience backed by TRAPUM data.
- A detections dashboard for internal stats and activity tracking.
- A standalone globular cluster 3D explorer served from `public/globular-clusters-3d.html` and routed at `/globular-cluster-explorer`.
- Serverless API routes in `api/` for likes and detection counts using Vercel KV.

## Content and assets

- Markdown content lives in `src/content` for blog posts, research entries, projects, and resources.
- Images, PDFs, and static assets live in `public`.

## Data and tooling

- `scripts/build-trapum-pulsars.mjs` builds `src/data/trapum_pulsars.json` from `trapum.org` and writes discovery images to `public/trapum/discoveries`.
- `gc-worker/` contains a Cloudflare Worker that proxies globular cluster catalogs for the 3D explorer.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Useful scripts

- `npm run trapum:build` builds TRAPUM data and images.
- `npm run build:trapum` runs the data build then a production build.
- `npm run compress:gallery` compresses the gallery assets.
- `npm run gallery:webp` converts gallery images to WebP.

## Environment variables

- Vercel KV variables are required for likes and detection endpoints in `api/` when running against KV.
