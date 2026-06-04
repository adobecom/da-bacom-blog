import { LIBS } from '../../scripts/scripts.js';

const { getConfig } = await import(`${LIBS}/utils/utils.js`);
const { replaceKey } = await import(`${LIBS}/features/placeholders.js`);
const iconsModule = await import(`${LIBS}/features/icons/icons.js`).catch(() => null);
const loadIcons = iconsModule?.default ?? (() => {});

const SOCIAL_PLATFORMS = {
  'linkedin.com': { name: 'LinkedIn', icon: 'linkedin' },
  'twitter.com': { name: 'X', icon: 'twitter' },
  'x.com': { name: 'X', icon: 'twitter' },
  'facebook.com': { name: 'Facebook', icon: 'facebook' },
  'instagram.com': { name: 'Instagram', icon: 'instagram' },
};

function resolvePlatform(href) {
  return Object.keys(SOCIAL_PLATFORMS).find((domain) => href?.includes(domain));
}

function decorateSocial(row) {
  const links = [...row.querySelectorAll('a')];
  row.replaceChildren(...links);
  row.className = 'blog-author-social';
  links.forEach((a) => {
    const domain = resolvePlatform(a.href);
    if (!domain) { a.hidden = true; return; }
    const { name, icon } = SOCIAL_PLATFORMS[domain];
    a.setAttribute('aria-label', name);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    const span = document.createElement('span');
    span.className = `icon icon-${icon}`;
    a.replaceChildren(span);
  });
  loadIcons(row.querySelectorAll('span.icon'));
}

async function decorateSubscribe(row) {
  row.className = 'blog-author-subscribe';
  const cfg = getConfig();
  const resolve = async (key) => {
    const val = await replaceKey(key, cfg).catch(() => '');
    return val && val.toLowerCase().replace(/[\s-]+/g, '-') !== key ? val : '';
  };
  const body = await resolve('get-the-latest-articles') || 'Get the latest articles sent to your inbox.';
  const btn = await resolve('subscribe') || 'Subscribe';

  const a = row.querySelector('a');
  const p = row.querySelector('p') ?? document.createElement('p');

  p.textContent = body;
  if (a) {
    a.textContent = btn;
    a.className = 'blog-author-subscribe-btn';
  }

  row.replaceChildren(...[p, a].filter(Boolean));
}

function injectSchema(el) {
  const name = el.querySelector('.blog-author-name')?.textContent;
  if (!name) return;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url: window.location.href,
    worksFor: {
      '@type': 'Organization',
      name: 'Adobe',
      url: 'https://www.adobe.com/',
    },
  };

  const title = el.querySelector('.blog-author-title')?.textContent;
  if (title) schema.jobTitle = title;

  const desc = [...el.querySelectorAll('.blog-author-description')]
    .map((p) => p.textContent).join(' ');
  if (desc) schema.description = desc;

  const img = el.querySelector('picture img')?.src;
  if (img) schema.image = img;

  const sameAs = [...el.querySelectorAll('.blog-author-social a:not([hidden])')]
    .map((a) => a.getAttribute('aria-label') && a.href).filter(Boolean);
  if (sameAs.length) schema.sameAs = sameAs;

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.append(script);
}

export default async function init(el) {
  let socialContainer = null;
  let textIdx = 0;
  const subscribeDecorations = [];
  const TEXT_CLASSES = ['blog-author-name', 'blog-author-title', 'blog-author-description'];

  el.querySelectorAll(':scope > div > div').forEach((row) => {
    if (row.querySelector('picture')) {
      row.className = 'blog-author-image';
    } else if ([...row.querySelectorAll('a')].some((a) => resolvePlatform(a.href))) {
      if (!socialContainer) {
        socialContainer = row;
      } else {
        [...row.querySelectorAll('a')].forEach((a) => socialContainer.append(a));
        row.parentElement.remove();
      }
    } else if (row.querySelector('a')) {
      subscribeDecorations.push(decorateSubscribe(row));
    } else {
      row.className = TEXT_CLASSES[Math.min(textIdx, 2)];
      textIdx += 1;
    }
  });

  if (socialContainer) decorateSocial(socialContainer);

  await Promise.all(subscribeDecorations);
  injectSchema(el);
}
