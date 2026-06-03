import { LIBS } from '../../scripts/scripts.js';

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
  row.className = 'blog-author-social';
  row.querySelectorAll('a').forEach((a) => {
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

// Expects each field (name, title, description) as a separate <p> in the authored doc.
function decorateText(row) {
  row.className = 'blog-author-info';
  const paras = row.querySelectorAll('p');
  if (paras[0]) paras[0].className = 'blog-author-name';
  if (paras[1]) paras[1].className = 'blog-author-title';
  paras.forEach((p, i) => {
    if (i >= 2) p.className = 'blog-author-description';
  });
}

function injectSchema(el) {
  const name = el.querySelector('.blog-author-name')?.textContent?.trim();
  if (!name) return;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url: window.location.href,
    worksFor: { '@type': 'Organization', name: 'Adobe', url: 'https://www.adobe.com/' }, // TODO: support author-company row when porting to Milo
  };

  const title = el.querySelector('.blog-author-title')?.textContent?.trim();
  if (title) schema.jobTitle = title;

  const desc = [...el.querySelectorAll('.blog-author-description')]
    .map((p) => p.textContent.trim()).join(' ');
  if (desc) schema.description = desc;

  const img = el.querySelector('picture img')?.src;
  if (img) schema.image = img;

  const sameAs = [...el.querySelectorAll('.blog-author-social a')]
    .map((a) => a.href).filter(Boolean);
  if (sameAs.length) schema.sameAs = sameAs;

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.append(script);
}

export default function init(el) {
  [...el.children].forEach((row) => {
    const inner = row.querySelector(':scope > div') ?? row;
    if (inner.querySelector('picture')) {
      inner.className = 'blog-author-image';
    } else if ([...inner.querySelectorAll('a')].some((a) => resolvePlatform(a.href))) {
      decorateSocial(inner);
    } else {
      decorateText(inner);
    }
  });

  injectSchema(el);
}
