import { animate, inView, scroll, stagger } from 'motion';

/**
 * The landing page's motion layer.
 *
 * Contract with the markup:
 *   [data-hero]              hero blocks, animate once on load
 *   [data-reveal]            reveal on scroll; ="image" adds a slight scale
 *   [data-reveal-stagger]    container whose children reveal in sequence
 *   [data-count]             number that counts up to its authored value
 *   [data-parallax]          scroll-linked vertical drift
 *
 * Content is hidden by CSS only while <html> carries [data-motion], which an
 * inline guard in the document head sets before first paint and only when the
 * visitor has not asked for reduced motion. That guard also removes the
 * attribute if this module never boots, so copy cannot be stranded invisible.
 *
 * The module re-checks the gate on its own because Motion's vanilla
 * `animate()` does not honour `prefers-reduced-motion` by itself.
 */

const EASE = [0.22, 1, 0.36, 1];
const RISE = 22;
const DURATION = 0.65;
const STAGGER = 0.1;

/** Mirror of the selector list the stylesheet hides under [data-motion]. */
const HIDDEN_BY_CSS = '[data-hero], [data-reveal], [data-reveal-stagger] > *';

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Last resort: whatever went wrong, hand the reader the whole document. */
function revealEverything(root) {
  for (const el of root.querySelectorAll(HIDDEN_BY_CSS)) {
    el.style.opacity = '1';
    el.style.transform = 'none';
  }
}

/** Show `elements` as-is, without animation, and say why. */
function showWithoutAnimation(elements, error) {
  for (const el of elements) {
    el.style.opacity = '1';
    el.style.transform = 'none';
  }
  console.error('[motion] reveal failed, content shown without animation', error);
}

/**
 * Reveal `elements` once `trigger` scrolls into view.
 *
 * The animation runs inside a callback that fires long after setup, so this
 * guards itself: a throw here would otherwise strand the elements at the
 * opacity the stylesheet gave them, which is to say invisible.
 */
function revealOnScroll(trigger, elements, { keyframes, options, transition }) {
  inView(
    trigger,
    () => {
      try {
        animate(elements, keyframes, transition);
      } catch (error) {
        showWithoutAnimation(elements, error);
      }
    },
    options,
  );
}

/**
 * Count up to the value already authored in the markup, then restore it
 * exactly.
 *
 * A synchronous throw needs no recovery: nothing has been written yet, so the
 * element still holds the authored value, which is the state we want. Only the
 * logging here is for diagnosis.
 */
function countUp(el) {
  const authored = (el.textContent ?? '').trim();
  const target = Number(authored);
  if (!Number.isFinite(target)) return;

  try {
    const decimals = authored.split('.')[1]?.length ?? 0;
    animate(0, target, {
      duration: 1.1,
      ease: EASE,
      onUpdate: (value) => {
        el.textContent = value.toFixed(decimals);
      },
      onComplete: () => {
        el.textContent = authored;
      },
    });
  } catch (error) {
    console.error('[motion] metric counter left at its authored value', error);
  }
}

function setupParallax(root) {
  if (!window.matchMedia('(min-width: 761px)').matches) return;

  const images = [...root.querySelectorAll('[data-parallax]')];
  const gallery = images[0]?.parentElement;
  if (!gallery) return;

  for (const [index, image] of images.entries()) {
    // The middle screen drifts least, so the row reads as layered rather than sliding.
    const drift = images.length > 2 && index === 1 ? 10 : 22;
    scroll(animate(image, { y: [drift, -drift] }, { ease: 'linear' }), {
      target: gallery,
      offset: ['start end', 'end start'],
    });
  }
}

export function initMotion(doc = document) {
  const root = doc.documentElement;

  // Reduced motion, or the head guard's failsafe already handed content back:
  // the stylesheet is showing everything, so leave the document untouched.
  if (prefersReducedMotion() || !root.hasAttribute('data-motion')) return;

  try {
    const hero = root.querySelectorAll('[data-hero]');
    if (hero.length) {
      animate(hero, { opacity: [0, 1], y: [RISE, 0] }, { duration: 0.7, ease: EASE, delay: stagger(0.09, { startDelay: 0.04 }) });
    }

    for (const el of root.querySelectorAll('[data-reveal]')) {
      const withScale = el.getAttribute('data-reveal') === 'image';
      revealOnScroll(el, [el], {
        keyframes: { opacity: [0, 1], y: [RISE, 0], ...(withScale ? { scale: [0.985, 1] } : null) },
        options: { amount: 0.15 },
        transition: { duration: DURATION, ease: EASE },
      });
    }

    for (const group of root.querySelectorAll('[data-reveal-stagger]')) {
      const items = [...group.children];
      if (!items.length) continue;
      revealOnScroll(group, items, {
        keyframes: { opacity: [0, 1], y: [RISE, 0] },
        options: { amount: 0.25 },
        transition: { duration: DURATION, ease: EASE, delay: stagger(STAGGER) },
      });
    }

    for (const el of root.querySelectorAll('[data-count]')) {
      inView(el, () => countUp(el), { amount: 0.5 });
    }

    setupParallax(root);
  } catch (error) {
    revealEverything(root);
    root.removeAttribute('data-motion');
    console.error('[motion] falling back to static content', error);
    return;
  }

  // Tell the head guard's failsafe that the layer is live.
  root.setAttribute('data-motion-ready', '');
}
