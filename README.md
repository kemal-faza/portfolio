# Kemal Faza — Portfolio

Source for my personal portfolio: one page covering four projects, each with screenshots and a short write-up.

It runs on Astro with Tailwind CSS v4 and builds to plain static HTML. Screenshots go through Astro's image pipeline and come out as responsive WebP. Inter is bundled with the build rather than pulled from a font CDN.

## Where things live

Copy and markup are in `src/pages/index.astro`, styles in `src/styles/global.css`, and project images in `src/assets/`. Parts of the YoDips screenshots are blacked out on purpose, so keep them that way.

## Tests

`npm test` runs the Playwright suite in `tests/`, which covers the motion layer: scroll reveals, the DAC metric counters, and reduced-motion behaviour. That layer isn't wired up yet, so the specs checking for a shipped script and a JS-rendered score fail for now.
