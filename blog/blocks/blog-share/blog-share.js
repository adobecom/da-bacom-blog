import { LIBS } from '../../scripts/scripts.js';

const iconsModule = await import(`${LIBS}/features/icons/icons.js`).catch(() => null);
const loadIcons = iconsModule?.default ?? (() => {});

const CSS_HREF = '/blog/blocks/blog-share/blog-share.css';

// English fallbacks used when Milo/placeholders are unavailable (e.g.
// offline unit tests) or a key hasn't been authored yet in the placeholders
// sheet. 'copied-to-clipboard' reuses the key name mandated by spec 05 so it
// stays in sync with any other surface using the same wording.
const PLACEHOLDER_FALLBACKS = {
  'share-on-x': 'Share on X',
  'share-via-email': 'Share via email',
  'share-on-linkedin': 'Share on LinkedIn',
  'copy-link': 'Copy link',
  'copied-to-clipboard': 'Link copied',
  share: 'Share',
};

// Resolves one or more Milo placeholder keys, falling back to the English
// literal (PLACEHOLDER_FALLBACKS) when Milo/placeholders are unavailable or
// a key is unresolved. Mirrors the pattern already used by
// blog-side-nav.js's getLabel() / blog-layout.js's getPlaceholders().
async function getPlaceholders(keys) {
  const fallbackResult = () => (
    Object.fromEntries(keys.map((key) => [key, PLACEHOLDER_FALLBACKS[key]]))
  );
  try {
    const [placeholdersMod, utilsMod] = await Promise.all([
      import(`${LIBS}/features/placeholders.js`).catch(() => null),
      import(`${LIBS}/utils/utils.js`).catch(() => null),
    ]);
    const { replaceKey } = placeholdersMod ?? {};
    const { getConfig } = utilsMod ?? {};
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

// Rail/modal content built by blog-layout.js's share pill bypasses Milo's
// loadBlock, so nothing else injects this block's stylesheet. Load it here,
// guarding against a double-inject if the modal is opened more than once.
async function loadShareStyle() {
  if (document.querySelector(`link[href="${CSS_HREF}"]`)) return;

  try {
    const utilsModule = await import(`${LIBS}/utils/utils.js`).catch(() => null);
    const loadStyle = utilsModule?.loadStyle;
    if (typeof loadStyle === 'function') {
      loadStyle(CSS_HREF);
      return;
    }

    if (document.querySelector(`link[href="${CSS_HREF}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CSS_HREF;
    document.head.append(link);
  } catch (e) {
    window.lana?.log(`blog-share: failed to load styles: ${e?.message}`, { severity: 'warning', tags: 'blog-share' });
  }
}

// Above this many characters the headline alone is expected to fill both
// available clamp lines, so the subhead is dropped to give the headline
// display priority (per spec: "headline takes priority and is truncated
// if it would exceed two lines").
const TITLE_LONG_THRESHOLD = 60;

// How long the "Link copied" status stays visible before auto-hiding.
const COPIED_VISIBLE_MS = 2000;

function makeIcon(name) {
  const span = document.createElement('span');
  span.className = `icon icon-${name}`;
  return span;
}

function makeLabel(text) {
  const span = document.createElement('span');
  span.className = 'blog-share-channel-label';
  span.textContent = text;
  return span;
}

function buildCard({ title, description, image }) {
  const card = document.createElement('div');
  card.className = 'blog-share-card';

  if (image) {
    const img = document.createElement('img');
    img.className = 'blog-share-card-img';
    img.src = image;
    img.alt = '';
    card.append(img);
  }

  const body = document.createElement('div');
  body.className = 'blog-share-card-body';

  const titleEl = document.createElement('h3');
  titleEl.className = 'blog-share-card-title';
  titleEl.textContent = title || '';
  // Headline always takes truncation priority over the subhead (see
  // TITLE_LONG_THRESHOLD above and the CSS 2-line clamp on this class).
  titleEl.setAttribute('data-priority', 'headline');
  body.append(titleEl);

  const isTitleLong = (title || '').length > TITLE_LONG_THRESHOLD;
  if (description && !isTitleLong) {
    const descEl = document.createElement('p');
    descEl.className = 'blog-share-card-desc';
    descEl.textContent = description;
    body.append(descEl);
  }

  card.append(body);
  return card;
}

function buildChannelLink({ className, href, ariaLabel, icon, label }) {
  const a = document.createElement('a');
  a.className = className;
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener';
  a.setAttribute('aria-label', ariaLabel);
  a.append(makeIcon(icon), makeLabel(label));
  return a;
}

// Fallback for contexts where navigator.clipboard is unavailable (insecure
// HTTP origins, older browsers): use the legacy execCommand copy path.
function legacyCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  let succeeded = false;
  try {
    succeeded = document.execCommand('copy');
  } catch (e) {
    succeeded = false;
  }
  textarea.remove();
  return succeeded;
}

// Timer ids are scoped per-element (rather than hung off this function) so
// concurrent copy targets don't clobber each other's auto-hide timeout.
const hideTimers = new WeakMap();

// Exported so the copy handler can be unit tested independently of a real
// click event / navigator.clipboard implementation (see spec 05 test plan).
export async function copyShareLink(url, copiedEl) {
  let succeeded = true;
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
    } catch (e) {
      // The browser attempted the write and it was rejected (e.g. denied
      // permission) — still surface the status as before; only the
      // API-absent case below must suppress it.
      window.lana?.log(`blog-share: clipboard write failed: ${e.message}`, { severity: 'warning', tags: 'blog-share' });
    }
  } else {
    // navigator.clipboard is absent entirely (e.g. insecure context) —
    // never silently claim success; fall back to execCommand, and only
    // show the "Link copied" status if that actually worked.
    succeeded = legacyCopy(url);
  }

  if (!succeeded) return;

  copiedEl.hidden = false;
  clearTimeout(hideTimers.get(copiedEl));
  hideTimers.set(copiedEl, setTimeout(() => { copiedEl.hidden = true; }, COPIED_VISIBLE_MS));
}

function buildChannels(url, title, labels) {
  const list = document.createElement('ul');
  list.className = 'blog-share-channels';

  const encodedUrl = encodeURIComponent(url || '');
  const encodedTitle = encodeURIComponent(title || '');

  const xLink = buildChannelLink({
    className: 'blog-share-x',
    href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    ariaLabel: labels['share-on-x'],
    icon: 'twitter',
    label: 'X',
  });

  const emailLink = document.createElement('a');
  emailLink.className = 'blog-share-email';
  emailLink.href = `mailto:?subject=${encodedTitle}&body=${encodedUrl}`;
  emailLink.setAttribute('aria-label', labels['share-via-email']);
  emailLink.append(makeIcon('email'), makeLabel('Email'));

  const linkedinLink = buildChannelLink({
    className: 'blog-share-linkedin',
    href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    ariaLabel: labels['share-on-linkedin'],
    icon: 'linkedin',
    label: 'LinkedIn',
  });

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'blog-share-copy';
  copyBtn.setAttribute('aria-label', labels['copy-link']);
  copyBtn.append(makeIcon('link'), makeLabel(labels['copy-link']));

  const copiedEl = document.createElement('span');
  copiedEl.className = 'blog-share-copied';
  copiedEl.setAttribute('role', 'status');
  copiedEl.hidden = true;
  copiedEl.textContent = labels['copied-to-clipboard'];

  copyBtn.addEventListener('click', () => { copyShareLink(url, copiedEl); });

  [xLink, emailLink, linkedinLink, copyBtn].forEach((channelEl) => {
    const li = document.createElement('li');
    li.append(channelEl);
    list.append(li);
  });

  return { list, copiedEl };
}

// Pure(ish) builder: given plain data, returns the modal content element.
// No metadata reads, no getModal calls — keeps this unit-testable offline.
// `labels` is optional and defaults to the English fallbacks so existing
// callers/tests that don't pass it still see the exact same strings; the
// real openShareModal() below resolves localized labels first.
export function buildShareContent({
  title = '',
  description = '',
  image = '',
  url = '',
  labels = {},
} = {}) {
  const resolvedLabels = { ...PLACEHOLDER_FALLBACKS, ...labels };

  const wrapper = document.createElement('div');
  wrapper.className = 'blog-share';

  wrapper.append(buildCard({ title, description, image }));

  const { list, copiedEl } = buildChannels(url, title, resolvedLabels);
  wrapper.append(list, copiedEl);

  loadIcons(wrapper.querySelectorAll('span.icon'));

  return wrapper;
}

export async function openShareModal() {
  const [utilsModule, labels] = await Promise.all([
    import(`${LIBS}/utils/utils.js`).catch(() => null),
    getPlaceholders(['share-on-x', 'share-via-email', 'share-on-linkedin', 'copy-link', 'copied-to-clipboard', 'share']),
    loadShareStyle(),
  ]);
  const getMetadata = utilsModule?.getMetadata ?? (() => null);

  // Card Metadata first (Title/CardTitle, CardDescription, cardImage),
  // falling back to OG tags per spec 05.
  const title = getMetadata('title') || getMetadata('card-title') || getMetadata('og:title') || document.title || '';
  const description = getMetadata('card-description') || getMetadata('og:description') || '';
  const image = getMetadata('card-image') || getMetadata('og:image') || '';
  const url = window.location.href;

  const content = buildShareContent({ title, description, image, url, labels });

  const modalModule = await import(`${LIBS}/blocks/modal/modal.js`).catch(() => ({}));
  const getModal = modalModule?.getModal;

  if (typeof getModal !== 'function') {
    window.lana?.log('blog-share: Milo modal unavailable, skipping openShareModal', { severity: 'debug', tags: 'blog-share' });
    return;
  }

  getModal(null, { id: 'share', class: 'share-modal', content, title: labels.share });
}

// Decorates a standalone authored trigger, if this block is authored on a
// page directly (rare — normally the marquee Share pill calls
// openShareModal() itself). Harmless / idempotent when there's nothing to
// wire beyond the block root.
export default async function init(el) {
  if (!el) return;
  const fallbackTrigger = el.querySelector('a, button');
  const trigger = fallbackTrigger || el;
  trigger.setAttribute('aria-haspopup', 'dialog');

  if (!fallbackTrigger) {
    // Falling back to a non-button/non-anchor root — make it keyboard
    // operable so it matches the a11y expectations of a real trigger.
    trigger.setAttribute('tabindex', '0');
    trigger.setAttribute('role', 'button');
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openShareModal();
      }
    });
  }

  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    openShareModal();
  });
}
