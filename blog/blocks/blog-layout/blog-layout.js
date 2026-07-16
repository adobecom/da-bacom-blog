import { LIBS } from '../../scripts/scripts.js';

async function mountModule(name, el) {
  if (!el) return;
  const mod = await import(`../${name}/${name}.js`).catch(() => null);
  const modInit = mod?.default;
  if (!modInit) return;
  try {
    await modInit(el);
  } catch {
    window.lana?.log(`blog-layout: failed to mount ${name}`, { severity: 'warning', tags: 'blog-layout' });
  }
}

function buildRelatedPlaceholder() {
  const placeholder = document.createElement('div');
  placeholder.className = 'blog-related-placeholder';
  placeholder.setAttribute('aria-label', 'Related content');
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

  const getMetadata = await getMiloMetadata();

  const publicationDate = articleHeader.querySelector('.article-date')?.textContent?.trim()
    || getMetadata('publication-date') || '';
  const updateDate = getMetadata('update-date') || '';
  const minutes = computeReadTime(bodyText);

  const parts = [];
  if (publicationDate) parts.push(`Published ${publicationDate}`);
  if (updateDate) parts.push(`Updated ${updateDate}`);
  parts.push(`${minutes} min read`);

  const eyebrow = document.createElement('div');
  eyebrow.className = 'article-eyebrow';
  eyebrow.textContent = parts.join(' · ');

  articleHeader.prepend(eyebrow);
}

function buildSharePill() {
  const pill = document.createElement('button');
  pill.type = 'button';
  pill.className = 'blog-share-pill';
  pill.setAttribute('aria-haspopup', 'dialog');
  pill.textContent = 'Share';
  return pill;
}

async function openShare() {
  const shareModule = await import('../blog-share/blog-share.js').catch(() => null);
  const openShareModal = shareModule?.openShareModal;
  if (typeof openShareModal !== 'function') {
    window.lana?.log('blog-layout: openShareModal unavailable', { severity: 'warning', tags: 'blog-layout' });
    return;
  }
  openShareModal();
}

function wireSharePill(articleHeader) {
  const pill = buildSharePill();
  pill.addEventListener('click', () => { openShare(); });

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

  await injectEyebrow(articleHeader, text);
  wireSharePill(articleHeader);
}

export default async function init(el) {
  document.body.classList.add('blog-2026');

  const main = el.closest('main') || document.querySelector('main');
  const layoutSection = el.closest('.section');
  const articleHeader = document.querySelector('.article-header');

  const grid = document.createElement('div');
  grid.className = 'blog-article-grid';

  const rail = document.createElement('aside');
  rail.className = 'blog-rail';

  const content = document.createElement('div');
  content.className = 'blog-content';

  if (main && layoutSection) {
    const sections = [...main.children].filter((child) => child.classList?.contains('section'));
    const layoutIdx = sections.indexOf(layoutSection);
    const sectionsAfter = layoutIdx >= 0 ? sections.slice(layoutIdx + 1) : [];
    sectionsAfter.forEach((section) => {
      if (section.querySelector('.article-header')) return;
      content.append(section);
    });
  }

  layoutSection?.remove();

  const sideNavContainer = document.createElement('div');
  sideNavContainer.className = 'blog-side-nav';
  const metaTagsContainer = document.createElement('div');
  metaTagsContainer.className = 'blog-meta-tags';

  rail.append(sideNavContainer, metaTagsContainer, buildRelatedPlaceholder());

  grid.append(rail, content);

  if (main) {
    main.append(grid);
  } else {
    el.append(grid);
  }

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
