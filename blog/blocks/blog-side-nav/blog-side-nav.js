import { LIBS } from '../../scripts/scripts.js';

const COLLAPSE_THRESHOLD = 6;
const LABEL_KEY = 'jump-to-section';
const LABEL_FALLBACK = 'JUMP TO SECTION';
const NAV_ARIA_LABEL = 'Jump to section';
const LINK_SELECTOR = '.blog-side-nav-list a';
const SCROLL_SPY_ROOT_MARGIN = '-96px 0px -70% 0px';

function getHeadings() {
  return document.querySelector('.blog-content')?.querySelectorAll('h2')
    ?? document.querySelectorAll('main h2');
}

function slugify(text) {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'section';
}

function assignIds(headings) {
  const used = new Set();
  headings.forEach((heading) => { if (heading.id) used.add(heading.id); });

  headings.forEach((heading) => {
    if (heading.id) return;
    const base = slugify(heading.textContent);
    let id = base;
    let suffix = 2;
    while (used.has(id) || document.getElementById(id)) {
      id = `${base}-${suffix}`;
      suffix += 1;
    }
    heading.id = id;
    used.add(id);
  });
}

async function getLabel() {
  try {
    const [placeholdersMod, utilsMod] = await Promise.all([
      import(`${LIBS}/features/placeholders.js`).catch(() => null),
      import(`${LIBS}/utils/utils.js`).catch(() => null),
    ]);
    const { replaceKey } = placeholdersMod ?? {};
    const { getConfig } = utilsMod ?? {};
    if (!replaceKey || !getConfig) return LABEL_FALLBACK;
    const label = await replaceKey(LABEL_KEY, getConfig());
    // Milo resolves an unmatched key to a humanized version of the key itself
    // (e.g. "jump to section") rather than throwing, so treat that sentinel
    // as "not found" too and use our literal fallback instead.
    const notFoundSentinel = LABEL_KEY.replace(/-/g, ' ');
    const isUnresolved = !label || label === LABEL_KEY || label === notFoundSentinel;
    return isUnresolved ? LABEL_FALLBACK : label;
  } catch {
    return LABEL_FALLBACK;
  }
}

// Pure helper: given the section ids (document order) and the set of ids
// currently reported as intersecting by the IntersectionObserver, decide
// which one should be treated as "active". Kept separate from the IO wiring
// itself so it (and setActiveLink below) can be unit tested without a real
// IntersectionObserver/scroll environment.
export function pickActiveId(ids, intersectingIds) {
  return ids.find((id) => intersectingIds.has(id)) ?? null;
}

// Pure DOM helper: set aria-current/.is-active on the link matching `id`,
// clear it from every other link. Unit tested directly.
export function setActiveLink(nav, id) {
  nav.querySelectorAll(LINK_SELECTOR).forEach((a) => {
    const isActive = a.getAttribute('href') === `#${id}`;
    a.classList.toggle('is-active', isActive);
    if (isActive) a.setAttribute('aria-current', 'location');
    else a.removeAttribute('aria-current');
  });
}

function buildNav(el, headings, label) {
  el.classList.add('blog-side-nav');
  el.setAttribute('aria-label', NAV_ARIA_LABEL);
  el.replaceChildren();

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'blog-side-nav-toggle';
  toggle.setAttribute('aria-expanded', 'true');
  toggle.textContent = label;
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
  });

  const list = document.createElement('ol');
  list.className = 'blog-side-nav-list';

  headings.forEach((heading, index) => {
    const li = document.createElement('li');
    if (index >= COLLAPSE_THRESHOLD) li.classList.add('blog-side-nav-item-extra');
    const a = document.createElement('a');
    a.href = `#${heading.id}`;
    a.textContent = heading.textContent;
    li.append(a);
    list.append(li);
  });

  el.append(toggle, list);

  if (headings.length > COLLAPSE_THRESHOLD) {
    el.classList.add('has-overflow');
    const moreToggle = document.createElement('button');
    moreToggle.type = 'button';
    moreToggle.className = 'blog-side-nav-more-toggle';
    moreToggle.setAttribute('aria-expanded', 'false');
    moreToggle.setAttribute('aria-label', 'Show more sections');
    moreToggle.textContent = '+';
    moreToggle.addEventListener('click', () => {
      const expanded = moreToggle.getAttribute('aria-expanded') === 'true';
      moreToggle.setAttribute('aria-expanded', String(!expanded));
      moreToggle.setAttribute('aria-label', expanded ? 'Show more sections' : 'Show fewer sections');
      moreToggle.textContent = expanded ? '+' : '−';
      el.classList.toggle('is-expanded', !expanded);
    });
    el.append(moreToggle);
  }

  return list;
}

function wireLinkClicks(list) {
  list.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;
    const id = link.getAttribute('href')?.slice(1);
    const target = id && document.getElementById(id);
    if (!target) return;
    event.preventDefault();

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
}

function wireScrollSpy(el, headings) {
  if (typeof IntersectionObserver === 'undefined') return null;

  const ids = [...headings].map((heading) => heading.id);
  const intersecting = new Set();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) intersecting.add(entry.target.id);
      else intersecting.delete(entry.target.id);
    });
    const activeId = pickActiveId(ids, intersecting);
    if (activeId) setActiveLink(el, activeId);
  }, { rootMargin: SCROLL_SPY_ROOT_MARGIN, threshold: 0 });

  headings.forEach((heading) => observer.observe(heading));
  return observer;
}

function wireStickyToggle(el) {
  const update = () => {
    const content = document.querySelector('.blog-content') || document.body;
    const disableSticky = content.scrollHeight <= window.innerHeight;
    el.classList.toggle('blog-side-nav-no-sticky', disableSticky);
  };
  update();
  window.addEventListener('resize', update);
}

export default async function init(el) {
  const headings = [...getHeadings()];

  if (!headings.length) {
    el.remove();
    return;
  }

  try {
    assignIds(headings);
    const label = await getLabel();
    const list = buildNav(el, headings, label);
    wireLinkClicks(list);
    wireScrollSpy(el, headings);
    wireStickyToggle(el);
  } catch (e) {
    window.lana?.log(`blog-side-nav: failed to build nav: ${e?.message}`, { severity: 'warning', tags: 'blog-side-nav' });
  }
}
