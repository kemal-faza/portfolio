# Kemal Faza — Portfolio

Source for my personal portfolio: one page covering four projects, each with screenshots and a short write-up.

It runs on Astro with Tailwind CSS v4 and builds to plain static HTML. Screenshots go through Astro's image pipeline and come out as responsive WebP. Inter is bundled with the build rather than pulled from a font CDN.

## Where things live

Copy and markup are in `src/pages/index.astro`, styles in `src/styles/global.css`, and project images in `src/assets/`. Parts of the YoDips screenshots are blacked out on purpose, so keep them that way.

## Tests

`npm test` builds the site and then runs the Playwright suite in `tests/` against the
built output. The specs cover the motion layer: scroll reveals, the DAC metric
counters, and reduced-motion behaviour.

## Motion

The page ships one small client script (`src/scripts/motion.js`) that drives the
scroll reveals, the metric counters, and the phone-gallery parallax. It is
opt-out by default, not opt-in:

- An inline guard in the document head marks `<html>` with `data-motion` before
  first paint, and only when `prefers-reduced-motion` is not set. CSS hides the
  animated elements under that attribute alone, so a visitor without JavaScript
  is never shown a blank page.
- If the module fails to load or throws, the guard drops the attribute and every
  element becomes visible again.
- The script re-checks the reduced-motion preference itself, because Motion's
  vanilla `animate()` does not honour it.

Hand-written copy always stays in the HTML. The counters in the DAC write-up hold
their real values in the markup and only animate over the top of them, so the
numbers are correct for search engines and screen readers.
