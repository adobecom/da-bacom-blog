import { LIBS } from '../../scripts/scripts.js';

const iconsModule = await import(`${LIBS}/features/icons/icons.js`).catch(() => null);
const loadIcons = iconsModule?.default ?? (() => {});

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

function buildChannels(url, title) {
  const list = document.createElement('ul');
  list.className = 'blog-share-channels';

  const encodedUrl = encodeURIComponent(url || '');
  const encodedTitle = encodeURIComponent(title || '');

  const xLink = buildChannelLink({
    className: 'blog-share-x',
    href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    ariaLabel: 'Share on X',
    icon: 'twitter',
    label: 'X',
  });

  const emailLink = document.createElement('a');
  emailLink.className = 'blog-share-email';
  emailLink.href = `mailto:?subject=${encodedTitle}&body=${encodedUrl}`;
  emailLink.setAttribute('aria-label', 'Share via email');
  emailLink.append(makeIcon('email'), makeLabel('Email'));

  const linkedinLink = buildChannelLink({
    className: 'blog-share-linkedin',
    href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    ariaLabel: 'Share on LinkedIn',
    icon: 'linkedin',
    label: 'LinkedIn',
  });

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'blog-share-copy';
  copyBtn.setAttribute('aria-label', 'Copy link');
  copyBtn.append(makeIcon('link'), makeLabel('Copy link'));

  const copiedEl = document.createElement('span');
  copiedEl.className = 'blog-share-copied';
  copiedEl.setAttribute('role', 'status');
  copiedEl.hidden = true;
  copiedEl.textContent = 'Link copied';

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
export function buildShareContent({ title = '', description = '', image = '', url = '' } = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'blog-share';

  wrapper.append(buildCard({ title, description, image }));

  const { list, copiedEl } = buildChannels(url, title);
  wrapper.append(list, copiedEl);

  loadIcons(wrapper.querySelectorAll('span.icon'));

  return wrapper;
}

export async function openShareModal() {
  const utilsModule = await import(`${LIBS}/utils/utils.js`).catch(() => null);
  const getMetadata = utilsModule?.getMetadata ?? (() => null);

  // Card Metadata first (Title/CardTitle, CardDescription, cardImage),
  // falling back to OG tags per spec 05.
  const title = getMetadata('title') || getMetadata('card-title') || getMetadata('og:title') || document.title || '';
  const description = getMetadata('card-description') || getMetadata('og:description') || '';
  const image = getMetadata('card-image') || getMetadata('og:image') || '';
  const url = window.location.href;

  const content = buildShareContent({ title, description, image, url });

  const modalModule = await import(`${LIBS}/blocks/modal/modal.js`).catch(() => ({}));
  const getModal = modalModule?.getModal;

  if (typeof getModal !== 'function') {
    window.lana?.log('blog-share: Milo modal unavailable, skipping openShareModal', { severity: 'debug', tags: 'blog-share' });
    return;
  }

  getModal(null, { id: 'share', class: 'share-modal', content, title: 'Share' });
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
