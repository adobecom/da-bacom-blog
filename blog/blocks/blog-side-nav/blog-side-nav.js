import { LIBS } from '../../scripts/scripts.js';

const COLLAPSE_THRESHOLD = 6;
const LABEL_KEY = 'jump-to-section';
const LABEL_FALLBACK = 'JUMP TO SECTION';
const NAV_ARIA_LABEL = 'Jump to section';
const LINK_SELECTOR = '.blog-side-nav-list a';
// The -96px here must stay in sync with --blog-rail-sticky-top
// (blog/styles/styles.css, under .blog-2026) — it's the same sticky offset
// expressed as a scroll-spy root margin instead of a CSS `top`.
const SCROLL_SPY_ROOT_MARGIN = '-96px 0px -70% 0px';
// Matches blog-side-nav.css's `min-width: 1200px` breakpoint, above which
// the list is always visible (a rail, not an accordion).
const DESKTOP_MEDIA_QUERY = '(min-width: 1200px)';

// Group the article's headings into top-level sections (h2) each with their
// nested subsections (the h3s that follow, until the next h2). Sections with
// subs get a "+" expander in the nav.
function getSections() {
  const scope = document.querySelector('.blog-content') || document.querySelector('main');
  if (!scope) return [];
  const sections = [];
  scope.querySelectorAll('h2, h3').forEach((node) => {
    if (node.tagName === 'H2') sections.push({ heading: node, subs: [] });
    else if (sections.length) sections[sections.length - 1].subs.push(node);
  });
  return sections;
}

function flattenHeadings(sections) {
  return sections.flatMap((section) => [section.heading, ...section.subs]);
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

function setExpanded(item, button, open) {
  item.classList.toggle('is-open', open);
  button.setAttribute('aria-expanded', String(open));
  button.textContent = open ? '−' : '+'; // − / +
}

function buildSection(section, sectionNum) {
  const li = document.createElement('li');
  li.className = 'blog-side-nav-item';

  const row = document.createElement('div');
  row.className = 'blog-side-nav-row';

  const a = document.createElement('a');
  a.href = `#${section.heading.id}`;
  const num = document.createElement('span');
  num.className = 'blog-side-nav-num';
  num.textContent = `Section ${sectionNum}: `;
  const title = document.createElement('span');
  title.className = 'blog-side-nav-title';
  title.textContent = section.heading.textContent;
  a.append(num, title);
  row.append(a);

  let sublist = null;
  if (section.subs.length) {
    const expandBtn = document.createElement('button');
    expandBtn.type = 'button';
    expandBtn.className = 'blog-side-nav-expand';
    expandBtn.setAttribute('aria-expanded', 'false');
    expandBtn.setAttribute('aria-label', `Show ${section.heading.textContent} subsections`);
    expandBtn.textContent = '+';

    sublist = document.createElement('ul');
    sublist.className = 'blog-side-nav-sublist';
    section.subs.forEach((sub) => {
      const subLi = document.createElement('li');
      const subA = document.createElement('a');
      subA.href = `#${sub.id}`;
      subA.textContent = sub.textContent;
      subLi.append(subA);
      sublist.append(subLi);
    });

    expandBtn.addEventListener('click', () => {
      setExpanded(li, expandBtn, expandBtn.getAttribute('aria-expanded') !== 'true');
    });
    row.append(expandBtn);
  }

  li.append(row);
  if (sublist) li.append(sublist);
  return li;
}

function buildNav(el, sections, label) {
  el.classList.add('blog-side-nav');
  el.setAttribute('aria-label', NAV_ARIA_LABEL);
  // The real mount path (blog-layout.js) hands us a plain <div>, not a <nav>,
  // so aria-label alone would not be exposed as a landmark to AT. When the
  // host element isn't already a <nav>, explicitly expose the navigation
  // landmark role. Avoid the redundant role when it already is a <nav>.
  if (el.tagName !== 'NAV') el.setAttribute('role', 'navigation');
  el.replaceChildren();

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'blog-side-nav-toggle';
  toggle.setAttribute('aria-expanded', 'true');
  toggle.textContent = label;

  // At >= 1200px the list is always visible (rail, not an accordion — see
  // DESKTOP_MEDIA_QUERY / blog-side-nav.css's matching breakpoint), so the
  // toggle has nothing to do there. Without this guard, a click recorded
  // while accordion-collapsed on mobile and then resized up to desktop
  // would leave aria-expanded="false" while the list is actually visible —
  // an a11y desync. Keep the toggle a no-op above the breakpoint and pin
  // aria-expanded back to "true" whenever the viewport crosses into it.
  const desktopQuery = window.matchMedia?.(DESKTOP_MEDIA_QUERY);
  toggle.addEventListener('click', () => {
    if (desktopQuery?.matches) return;
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
  });
  desktopQuery?.addEventListener?.('change', (e) => {
    if (e.matches) toggle.setAttribute('aria-expanded', 'true');
  });

  const list = document.createElement('ol');
  list.className = 'blog-side-nav-list';

  sections.forEach((section, index) => {
    const item = buildSection(section, index + 1);
    if (index >= COLLAPSE_THRESHOLD) item.classList.add('blog-side-nav-item-extra');
    list.append(item);
  });

  el.append(toggle, list);

  if (sections.length > COLLAPSE_THRESHOLD) {
    el.classList.add('has-overflow');
    const moreToggle = document.createElement('button');
    moreToggle.type = 'button';
    moreToggle.className = 'blog-side-nav-more-toggle';
    moreToggle.setAttribute('aria-expanded', 'false');
    moreToggle.textContent = 'Show more';
    moreToggle.addEventListener('click', () => {
      const expanded = moreToggle.getAttribute('aria-expanded') === 'true';
      moreToggle.setAttribute('aria-expanded', String(!expanded));
      moreToggle.textContent = expanded ? 'Show more' : 'Show less';
      el.classList.toggle('is-expanded', !expanded);
    });
    el.append(moreToggle);
  }

  return list;
}

// When a subsection becomes the active heading while its parent section is
// collapsed, open the parent so the highlighted sublink is actually visible.
function revealActive(el) {
  const activeLink = el.querySelector(`${LINK_SELECTOR}.is-active`);
  const item = activeLink?.closest('.blog-side-nav-item');
  const inSublist = activeLink?.closest('.blog-side-nav-sublist');
  if (!item || !inSublist || item.classList.contains('is-open')) return;
  const button = item.querySelector('.blog-side-nav-expand');
  if (button) setExpanded(item, button, true);
}

function wireLinkClicks(list) {
  list.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;
    const id = link.getAttribute('href')?.slice(1);
    const target = id && document.getElementById(id);
    if (!target) return;
    event.preventDefault();

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
}

function wireScrollSpy(el, headings) {
  if (typeof IntersectionObserver === 'undefined') return null;

  const ids = headings.map((heading) => heading.id);
  const intersecting = new Set();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) intersecting.add(entry.target.id);
      else intersecting.delete(entry.target.id);
    });
    const activeId = pickActiveId(ids, intersecting);
    if (activeId) {
      setActiveLink(el, activeId);
      revealActive(el);
    }
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
  const sections = getSections();

  if (!sections.length) {
    el.remove();
    return;
  }

  try {
    const headings = flattenHeadings(sections);
    assignIds(headings);
    const label = await getLabel();
    const list = buildNav(el, sections, label);
    wireLinkClicks(list);
    wireScrollSpy(el, headings);
    wireStickyToggle(el);
  } catch (e) {
    window.lana?.log(`blog-side-nav: failed to build nav: ${e?.message}`, { severity: 'warning', tags: 'blog-side-nav' });
  }
}
