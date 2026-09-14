# Kemal Faza — Portfolio

A single-page portfolio built with Astro and Tailwind CSS v4. Astro generates static HTML with no client-side JavaScript. Project screenshots are served as responsive WebP images; Inter is hosted locally.

## Development

Requires Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

## Production

```sh
npm run build
npm run preview
```

Deploy `dist/` to any static host. No backend or environment variables are required.

Edit portfolio content in `src/pages/index.astro`, styling in `src/styles/global.css`, and project images in `src/assets/`. Keep the redactions in YoDips screenshots intact.
