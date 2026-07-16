import { LIBS } from '../../scripts/scripts.js';

// English fallbacks used when Milo/placeholders are unavailable (e.g.
// offline unit tests) or a key hasn't been authored yet in the placeholders
// sheet. Keys follow the same naming convention as blog-side-nav's
// 'jump-to-section'.
const PLACEHOLDER_FALLBACKS = {
  published: 'Published',
  updated: 'Updated',
  'min-read': 'min read',
  share: 'Share',
  'related-content': 'Related content',
};

async function getPlaceholderModules() {
  const [placeholdersMod, utilsMod] = await Promise.all([
    import(`${LIBS}/features/placeholders.js`).catch(() => null),
    import(`${LIBS}/utils/utils.js`).catch(() => null),
  ]);
  return { replaceKey: placeholdersMod?.replaceKey, getConfig: utilsMod?.getConfig };
}

// Resolves one or more Milo placeholder keys, falling back to the English
// literal (PLACEHOLDER_FALLBACKS) when Milo/placeholders are unavailable or
// a key is unresolved. Milo resolves an unmatched key to a humanized version
// of the key itself (e.g. "min read" from "min-read") rather than throwing,
// so that sentinel is treated as "not found" too (mirrors the pattern
// already used by blog-side-nav.js's getLabel()).
async function getPlaceholders(keys) {
  const fallbackResult = () => (
    Object.fromEntries(keys.map((key) => [key, PLACEHOLDER_FALLBACKS[key]]))
  );
  try {
    const { replaceKey, getConfig } = await getPlaceholderModules();
    if (!replaceKey || !getConfig) return fallbackResult();
    const config = getConfig();
    const entries = await Promise.all(keys.map(async (key) => {
      const fallback = PLACEHOLDER_FALLBACKS[key];
      const value = await replaceKey(key, config).catch(() => null);
      const notFoundSentinel = key.replace(/-/g, ' ');
      const isUnresolved = !value || value === key || value === notFoundSentinel;
      return [key, isUnresolved ? fallback : value];
    }));
    return Object.fromEntries(entries);
  } catch {
    return fallbackResult();
  }
}

// Rail sub-blocks (blog-side-nav, blog-meta-tags, blog-progress-bar) are
// mounted programmatically below rather than through Milo's loadBlock, which
// is what normally injects a block's stylesheet. mountModule stands in for
// that missing piece so the sub-block's CSS actually reaches the page.
const loadedStyleHrefs = new Set();

async function loadModuleStyle(name) {
  const href = `/blog/blocks/${name}/${name}.css`;
  if (loadedStyleHrefs.has(href) || document.querySelector(`link[href="${href}"]`)) return;
  loadedStyleHrefs.add(href);

  try {
    const utilsModule = await import(`${LIBS}/utils/utils.js`).catch(() => null);
    const loadStyle = utilsModule?.loadStyle;
    if (typeof loadStyle === 'function') {
      loadStyle(href);
      return;
    }

    // Milo unavailable (e.g. offline unit tests, or loaded outside Milo) —
    // fall back to a plain <link>, still guarding against a double-inject.
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.append(link);
  } catch (e) {
    window.lana?.log(`blog-layout: failed to load styles for ${name}: ${e?.message}`, { severity: 'warning', tags: 'blog-layout' });
  }
}

async function mountModule(name, el) {
  if (!el) return;
  const [mod] = await Promise.all([
    import(`../${name}/${name}.js`).catch(() => null),
    loadModuleStyle(name),
  ]);
  const modInit = mod?.default;
  if (!modInit) return;
  try {
    await modInit(el);
  } catch {
    window.lana?.log(`blog-layout: failed to mount ${name}`, { severity: 'warning', tags: 'blog-layout' });
  }
}

async function buildRelatedPlaceholder() {
  const { 'related-content': label } = await getPlaceholders(['related-content']);
  const placeholder = document.createElement('div');
  placeholder.className = 'blog-related-placeholder';
  placeholder.setAttribute('aria-label', label);
  return placeholder;
}

// Pure: word-count based read-time estimate, rounded up so a partial minute
// always counts as a full minute; floored at 1 so short articles never
// read "0 min read".
export function computeReadTime(text, wpm = 200) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wpm));
}

async function getMiloMetadata() {
  const utilsModule = await import(`${LIBS}/utils/utils.js`).catch(() => null);
  return utilsModule?.getMetadata ?? (() => null);
}

async function injectEyebrow(articleHeader, bodyText) {
  if (articleHeader.querySelector('.article-eyebrow')) return;

  const [getMetadata, labels] = await Promise.all([
    getMiloMetadata(),
    getPlaceholders(['published', 'updated', 'min-read']),
  ]);

  const publicationDate = articleHeader.querySelector('.article-date')?.textContent?.trim()
    || getMetadata('publication-date') || '';
  const updateDate = getMetadata('update-date') || '';
  const minutes = computeReadTime(bodyText);

  const parts = [];
  if (publicationDate) parts.push(`${labels.published} ${publicationDate}`);
  if (updateDate) parts.push(`${labels.updated} ${updateDate}`);
  parts.push(`${minutes} ${labels['min-read']}`);

  const eyebrow = document.createElement('div');
  eyebrow.className = 'article-eyebrow';
  eyebrow.textContent = parts.join(' · ');

  articleHeader.prepend(eyebrow);
}

function buildSharePill(label) {
  const pill = document.createElement('button');
  pill.type = 'button';
  pill.className = 'blog-share-pill';
  pill.setAttribute('aria-haspopup', 'dialog');
  pill.textContent = label ?? PLACEHOLDER_FALLBACKS.share;
  return pill;
}

async function openShare() {
  const shareModule = await import('../blog-share/blog-share.js').catch(() => null);
  const openShareModal = shareModule?.openShareModal;
  if (typeof openShareModal !== 'function') {
    window.lana?.log('blog-layout: openShareModal unavailable', { severity: 'warning', tags: 'blog-layout' });
    return;
  }
  await openShareModal();
}

function wireSharePill(articleHeader, label) {
  // Guard against a second decorate pass (e.g. a re-render) appending a
  // second pill alongside the one already wired.
  if (articleHeader.querySelector('.blog-share-pill')) return;

  const pill = buildSharePill(label);
  pill.addEventListener('click', () => {
    openShare().catch((e) => {
      window.lana?.log(`blog-layout: failed to open share modal: ${e?.message}`, { severity: 'warning', tags: 'blog-layout' });
    });
  });

  const sharingRow = articleHeader.querySelector('.article-byline-sharing');
  if (sharingRow) {
    sharingRow.replaceChildren(pill);
    return;
  }

  const byline = articleHeader.querySelector('.article-byline');
  (byline || articleHeader).append(pill);
}

// Additive marquee enhancement: injects the eyebrow (published/updated/read
// time) and swaps Milo's per-network sharing row for a single share pill.
// Does not touch Milo markup/JS — only decorates the auto-blocked
// `.article-header` that already exists on the page.
export async function decorateMarquee(articleHeader, { bodyText } = {}) {
  if (!articleHeader) return;

  const text = bodyText ?? (document.querySelector('.blog-content')?.textContent || document.body.textContent || '');

  const [, labels] = await Promise.all([
    injectEyebrow(articleHeader, text),
    getPlaceholders(['share']),
  ]);
  wireSharePill(articleHeader, labels.share);
}

// Moves the article body into `content` without destroying anything.
//
// A typical blog article has NO `---` section breaks, so Milo wraps the
// marquee, the blog-layout marker, and the entire body into a SINGLE
// `.section`. Removing that section (as an earlier version did) deleted the
// whole article. Instead we operate at the node level: keep the marquee where
// it is, move every other body node out of the marker's section, absorb any
// following sections (multi-section articles), and remove ONLY the marker.
function relocateBody({ section, marker, content, articleHeader }) {
  const holdsMarquee = (node) => !!articleHeader
    && (node === articleHeader || node.contains?.(articleHeader));

  // Move every child of the marker's section except the marquee and the
  // marker itself into the content column.
  [...section.children].forEach((child) => {
    if (child === marker || holdsMarquee(child)) return;
    content.append(child);
  });

  // Absorb any sections that follow (author-used `---` breaks), skipping any
  // that hold the marquee so it always stays above the grid.
  let sibling = section.nextElementSibling;
  while (sibling) {
    const next = sibling.nextElementSibling;
    if (sibling.classList?.contains('section') && !holdsMarquee(sibling)) {
      content.append(sibling);
    }
    sibling = next;
  }

  // Remove only the marker — never the section, which may still hold the
  // marquee.
  marker.remove();

  // If the section is now empty (marquee lived in its own earlier section),
  // drop the husk; otherwise keep it (it still holds the marquee).
  if (!holdsMarquee(section) && !section.children.length) {
    const anchor = section.previousElementSibling;
    section.remove();
    return anchor;
  }
  return section;
}

export default async function init(el) {
  document.body.classList.add('blog-2026');

  const main = el.closest('main') || document.querySelector('main');
  const articleHeader = document.querySelector('.article-header');

  const grid = document.createElement('div');
  grid.className = 'blog-article-grid';

  const rail = document.createElement('aside');
  rail.className = 'blog-rail';

  const content = document.createElement('div');
  content.className = 'blog-content';

  // Walk up to the block's top-level ancestor inside `main` (its section) and
  // to the section child that directly contains the block (the marker to
  // remove). In Milo, blocks always live inside a section.
  let section = el;
  while (section.parentElement && section.parentElement !== main) {
    section = section.parentElement;
  }
  let marker = el;
  while (marker.parentElement && marker.parentElement !== section) {
    marker = marker.parentElement;
  }

  if (main && section.parentElement === main && section !== el) {
    const anchor = relocateBody({ section, marker, content, articleHeader });
    // Place the grid right after the marquee (or wherever the block was).
    if (anchor?.parentElement === main) anchor.after(grid);
    else main.append(grid);
  } else {
    // Degenerate markup (block not inside a section). Don't move anything —
    // just append the grid so nothing is destroyed.
    (main || document.body).append(grid);
  }

  const sideNavContainer = document.createElement('div');
  sideNavContainer.className = 'blog-side-nav';
  const metaTagsContainer = document.createElement('div');
  metaTagsContainer.className = 'blog-meta-tags';

  rail.append(sideNavContainer, metaTagsContainer, await buildRelatedPlaceholder());

  grid.append(rail, content);

  const progressBarContainer = document.createElement('div');
  progressBarContainer.className = 'blog-progress-bar';
  content.prepend(progressBarContainer);

  await Promise.all([
    mountModule('blog-side-nav', sideNavContainer),
    mountModule('blog-meta-tags', metaTagsContainer),
    mountModule('blog-progress-bar', progressBarContainer),
    decorateMarquee(articleHeader, { bodyText: content.textContent }),
  ]);
}
