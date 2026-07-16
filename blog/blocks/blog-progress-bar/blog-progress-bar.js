const ARIA_LABEL = 'Reading progress';

// Pure math: what percentage (0-100) of the tracked region has been scrolled
// past. `top`/`height` describe the tracked element's absolute document
// position and height; `vh` is the viewport height. Progress reaches 100
// when the bottom of the tracked region reaches the bottom of the viewport,
// i.e. scrollY === top + (height - vh).
//
// When the tracked region is shorter than (or equal to) the viewport there's
// nothing to scroll through, so we report 0 rather than 100 — an unscrolled
// short article reads as "not started" rather than "already read".
export function computeProgress(scrollY, top, height, vh) {
  const range = height - vh;
  if (range <= 0) return 0;
  const ratio = (scrollY - top) / range;
  return Math.max(0, Math.min(100, ratio * 100));
}

function getTrackedElement() {
  return document.querySelector('.blog-content') ?? document.querySelector('main');
}

function measure(target) {
  if (!target) return { top: 0, height: 0 };
  const rect = target.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    height: target.offsetHeight,
  };
}

function buildBar(el) {
  el.classList.add('blog-progress-bar');
  el.setAttribute('role', 'progressbar');
  el.setAttribute('aria-valuemin', '0');
  el.setAttribute('aria-valuemax', '100');
  el.setAttribute('aria-valuenow', '0');
  el.setAttribute('aria-label', ARIA_LABEL);
  el.replaceChildren();

  const fill = document.createElement('div');
  fill.className = 'blog-progress-bar-fill';
  el.append(fill);
  return fill;
}

export default async function init(el) {
  if (!el) return;

  try {
    const fill = buildBar(el);
    const target = getTrackedElement();

    let bounds = measure(target);
    let viewportHeight = window.innerHeight;
    let ticking = false;

    const render = () => {
      ticking = false;
      const progress = computeProgress(window.scrollY, bounds.top, bounds.height, viewportHeight);
      fill.style.setProperty('--p', progress / 100);
      el.setAttribute('aria-valuenow', String(Math.round(progress)));
    };

    const schedule = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(render);
    };

    const recomputeBounds = () => {
      bounds = measure(target);
      viewportHeight = window.innerHeight;
      schedule();
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', recomputeBounds, { passive: true });

    // Stop tracking once the bar is removed from the DOM (e.g. block
    // teardown in an SPA-style re-render), so we don't leak listeners.
    const cleanupObserver = new MutationObserver(() => {
      if (el.isConnected) return;
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', recomputeBounds);
      cleanupObserver.disconnect();
    });
    cleanupObserver.observe(document.body, { childList: true, subtree: true });

    render();
  } catch (e) {
    window.lana?.log(`blog-progress-bar: failed to init: ${e?.message}`, { severity: 'warning', tags: 'blog-progress-bar' });
  }
}
