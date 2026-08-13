/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

export function setLibs(location) {
  const { hostname, search } = location;
  if (!['.aem.', '.hlx.', '.stage.', 'local'].some((i) => hostname.includes(i))) return '/libs';
  const branch = new URLSearchParams(search).get('milolibs') || 'main';
  if (!/^[a-zA-Z0-9_-]+$/.test(branch)) throw new Error('Invalid branch name.');
  if (branch === 'local') return 'http://localhost:6456/libs';
  return branch.includes('--') ? `https://${branch}.aem.live/libs` : `https://${branch}--milo--adobecom.aem.live/libs`;
}

export const LIBS = setLibs(window.location);

/**
 * Builds a block DOM Element from a two dimensional array
 * @param {string} blockName name of the block
 * @param {any} content two dimensional array or string or object of content
 */
function buildBlock(blockName, content) {
  const table = Array.isArray(content) ? content : [[content]];
  const blockEl = document.createElement('div');

  blockEl.classList.add(blockName);
  table.forEach((row) => {
    const rowEl = document.createElement('div');
    row.forEach((col) => {
      const colEl = document.createElement('div');
      if (typeof col === 'string') {
        colEl.innerHTML = col;
      } else {
        colEl.appendChild(col);
      }
      rowEl.appendChild(colEl);
    });
    blockEl.appendChild(rowEl);
  });
  return (blockEl);
}

function getImageCaption(picture) {
  // Check if the parent element has a caption
  const parentEl = picture.parentNode;
  const caption = parentEl.querySelector('em');
  if (caption) return caption;

  // If the parent element doesn't have a caption, check if the next sibling does
  const parentSiblingEl = parentEl.nextElementSibling;
  if (!parentSiblingEl || !parentSiblingEl.querySelector('picture')) return '';
  const firstChildEl = parentSiblingEl.firstChild;
  if (firstChildEl?.tagName === 'EM') return firstChildEl;
  return '';
}

async function buildArticleHeader(el) {
  const { getMetadata, getConfig } = await import(`${LIBS}/utils/utils.js`);
  const div = document.createElement('div');
  const h1 = el.querySelector('h1');
  const media = h1.nextElementSibling?.querySelector('picture, a') || el.querySelector('picture');
  const caption = getImageCaption(media);
  const mediaContainer = document.createElement('div');
  mediaContainer.append(media);
  if (caption) { mediaContainer.append(caption); }
  const author = getMetadata('author') || 'Adobe Communications Team';
  const { locale } = getConfig();
  const authorURL = getMetadata('author-url') || (author ? `${locale.contentRoot}/authors/${author.replace(/[^0-9a-z]/gi, '-').toLowerCase()}` : null);
  const publicationDate = getMetadata('publication-date');
  const articleHeaderBlockEl = buildBlock('article-header', [
    ['<p></p>'],
    [h1],
    [`<p><span ${authorURL ? `data-author-page="${authorURL}"` : ''}>${author}</span></p>
      <p>${publicationDate}</p>`],
    [mediaContainer],
  ]);
  div.append(articleHeaderBlockEl);
  el.prepend(div);
}

export async function buildAutoBlocks() {
  const { getMetadata } = await import(`${LIBS}/utils/utils.js`);
  const mainEl = document.querySelector('main');
  try {
    if (getMetadata('publication-date') && !mainEl.querySelector('.article-header')) {
      await buildArticleHeader(mainEl);
    }
  } catch (error) {
    window.lana?.log(`Auto Blocking failed: ${error}`, { tags: 'autoBlock', severity: 'error' });
  }
}

// Add project-wide style path here.
const STYLES = '/blog/styles/styles.css';

// Add any config options.
const CONFIG = {
  imsClientId: 'bacom',
  imsScope: 'AdobeID,openid,gnav,pps.read,firefly_api,additional_info.roles,read_organizations,account_cluster.read',
  stage: { edgeConfigId: '7d1ba912-10b6-4384-a8ff-4bfb1178e869' },
  prod: { edgeConfigId: '65acfd54-d9fe-405c-ba04-8342d6782ab0' },
  locales: {
    '': { ietf: 'en-US', tk: 'hah7vzn.css' },
    ae_ar: { ietf: 'ar', tk: 'qxw8hzm.css', dir: 'rtl' },
    ae_en: { ietf: 'en', tk: 'hah7vzn.css' },
    africa: { ietf: 'en', tk: 'hah7vzn.css' },
    ar: { ietf: 'es-AR', tk: 'hah7vzn.css', exl: 'es' },
    ara: { ietf: 'ara', tk: 'qxw8hzm.css', dir: 'rtl' },
    at: { ietf: 'de-AT', tk: 'hah7vzn.css', exl: 'de' },
    au: { ietf: 'en-AU', tk: 'hah7vzn.css' },
    be_en: { ietf: 'en-BE', tk: 'hah7vzn.css' },
    be_fr: { ietf: 'fr-BE', tk: 'hah7vzn.css', exl: 'fr' },
    be_nl: { ietf: 'nl-BE', tk: 'qxw8hzm.css', exl: 'nl' },
    bg: { ietf: 'bg-BG', tk: 'qxw8hzm.css' },
    br: { ietf: 'pt-BR', tk: 'hah7vzn.css', exl: 'pt-br' },
    ca_fr: { ietf: 'fr-CA', tk: 'hah7vzn.css', exl: 'fr' },
    ca: { ietf: 'en-CA', tk: 'hah7vzn.css' },
    ch_de: { ietf: 'de-CH', tk: 'hah7vzn.css', exl: 'de' },
    ch_fr: { ietf: 'fr-CH', tk: 'hah7vzn.css', exl: 'fr' },
    ch_it: { ietf: 'it-CH', tk: 'hah7vzn.css', exl: 'it' },
    cl: { ietf: 'es-CL', tk: 'hah7vzn.css', exl: 'es' },
    cn: { ietf: 'zh-CN', tk: 'qxw8hzm', exl: 'zh-hans' },
    co: { ietf: 'es-CO', tk: 'hah7vzn.css', exl: 'es' },
    cr: { ietf: 'es-419', tk: 'hah7vzn.css' },
    cy_en: { ietf: 'en-CY', tk: 'hah7vzn.css' },
    cz: { ietf: 'cs-CZ', tk: 'qxw8hzm.css' },
    de: { ietf: 'de-DE', tk: 'hah7vzn.css', exl: 'de' },
    dk: { ietf: 'da-DK', tk: 'qxw8hzm.css' },
    ec: { ietf: 'es-419', tk: 'hah7vzn.css' },
    ee: { ietf: 'et-EE', tk: 'qxw8hzm.css' },
    eg_ar: { ietf: 'ar', tk: 'qxw8hzm.css', dir: 'rtl' },
    eg_en: { ietf: 'en-GB', tk: 'hah7vzn.css' },
    el: { ietf: 'el', tk: 'qxw8hzm.css' },
    es: { ietf: 'es-ES', tk: 'hah7vzn.css', exl: 'es' },
    fi: { ietf: 'fi-FI', tk: 'qxw8hzm.css' },
    fr: { ietf: 'fr-FR', tk: 'hah7vzn.css', exl: 'fr' },
    gr_el: { ietf: 'el', tk: 'qxw8hzm.css' },
    gr_en: { ietf: 'en-GR', tk: 'hah7vzn.css' },
    gt: { ietf: 'es-419', tk: 'hah7vzn.css' },
    hk_en: { ietf: 'en-HK', tk: 'hah7vzn.css' },
    hk_zh: { ietf: 'zh-HK', tk: 'jay0ecd', exl: 'zh-hant' },
    hu: { ietf: 'hu-HU', tk: 'qxw8hzm.css' },
    id_en: { ietf: 'en', tk: 'hah7vzn.css' },
    id_id: { ietf: 'id', tk: 'qxw8hzm.css' },
    ie: { ietf: 'en-GB', tk: 'hah7vzn.css' },
    il_en: { ietf: 'en-IL', tk: 'hah7vzn.css' },
    il_he: { ietf: 'he', tk: 'qxw8hzm.css', dir: 'rtl' },
    in_hi: { ietf: 'hi', tk: 'qxw8hzm.css' },
    in: { ietf: 'en-IN', tk: 'hah7vzn.css' },
    it: { ietf: 'it-IT', tk: 'hah7vzn.css', exl: 'it' },
    jp: { ietf: 'ja-JP', tk: 'dvg6awq', exl: 'ja' },
    kr: { ietf: 'ko-KR', tk: 'qjs5sfm', exl: 'ko' },
    kw_ar: { ietf: 'ar', tk: 'qxw8hzm.css', dir: 'rtl' },
    kw_en: { ietf: 'en-GB', tk: 'hah7vzn.css' },
    la: { ietf: 'es-LA', tk: 'hah7vzn.css', exl: 'es' },
    langstore: { ietf: 'en-US', tk: 'hah7vzn.css' },
    lt: { ietf: 'lt-LT', tk: 'qxw8hzm.css' },
    lu_de: { ietf: 'de-LU', tk: 'hah7vzn.css', exl: 'de' },
    lu_en: { ietf: 'en-LU', tk: 'hah7vzn.css' },
    lu_fr: { ietf: 'fr-LU', tk: 'hah7vzn.css', exl: 'fr' },
    lv: { ietf: 'lv-LV', tk: 'qxw8hzm.css' },
    mena_ar: { ietf: 'ar', tk: 'qxw8hzm.css', dir: 'rtl' },
    mena_en: { ietf: 'en', tk: 'hah7vzn.css' },
    mt: { ietf: 'en-MT', tk: 'hah7vzn.css' },
    mx: { ietf: 'es-MX', tk: 'hah7vzn.css', exl: 'es' },
    my_en: { ietf: 'en-GB', tk: 'hah7vzn.css' },
    my_ms: { ietf: 'ms', tk: 'qxw8hzm.css' },
    ng: { ietf: 'en-GB', tk: 'hah7vzn.css' },
    nl: { ietf: 'nl-NL', tk: 'qxw8hzm.css', exl: 'nl' },
    no: { ietf: 'no-NO', tk: 'qxw8hzm.css' },
    nz: { ietf: 'en-GB', tk: 'hah7vzn.css' },
    pe: { ietf: 'es-PE', tk: 'hah7vzn.css', exl: 'es' },
    ph_en: { ietf: 'en', tk: 'hah7vzn.css' },
    ph_fil: { ietf: 'fil-PH', tk: 'qxw8hzm.css' },
    pl: { ietf: 'pl-PL', tk: 'qxw8hzm.css' },
    pr: { ietf: 'es-419', tk: 'hah7vzn.css' },
    pt: { ietf: 'pt-PT', tk: 'hah7vzn.css', exl: 'pt-br' },
    qa_ar: { ietf: 'ar', tk: 'qxw8hzm.css', dir: 'rtl' },
    qa_en: { ietf: 'en-GB', tk: 'hah7vzn.css' },
    ro: { ietf: 'ro-RO', tk: 'qxw8hzm.css' },
    ru: { ietf: 'ru-RU', tk: 'qxw8hzm.css' },
    sa_ar: { ietf: 'ar', tk: 'qxw8hzm.css', dir: 'rtl' },
    sa_en: { ietf: 'en', tk: 'hah7vzn.css' },
    se: { ietf: 'sv-SE', tk: 'qxw8hzm.css', exl: 'sv' },
    sg: { ietf: 'en-SG', tk: 'hah7vzn.css' },
    si: { ietf: 'sl-SI', tk: 'qxw8hzm.css' },
    sk: { ietf: 'sk-SK', tk: 'qxw8hzm.css' },
    th_en: { ietf: 'en', tk: 'hah7vzn.css' },
    th_th: { ietf: 'th', tk: 'qxw8hzm.css' },
    tr: { ietf: 'tr-TR', tk: 'qxw8hzm.css' },
    tw: { ietf: 'zh-TW', tk: 'jay0ecd', exl: 'zh-hant' },
    ua: { ietf: 'uk-UA', tk: 'qxw8hzm.css' },
    uk: { ietf: 'en-GB', tk: 'hah7vzn.css' },
    vn_en: { ietf: 'en-GB', tk: 'hah7vzn.css' },
    vn_vi: { ietf: 'vi', tk: 'qxw8hzm.css' },
    za: { ietf: 'en-GB', tk: 'hah7vzn.css' },
  },
  // geoRouting: 'on',
  productionDomain: 'business.adobe.com',
  prodDomains: ['business.adobe.com', 'www.adobe.com'],
  contentRoot: '/blog',
  codeRoot: '/blog',
  taxonomyRoot: '/tags',
  links: 'on',
  dynamicNavKey: 'bacom',
  stageDomainsMap: { 'business.stage.adobe.com': { 'business.adobe.com': 'origin' } },
  onlybanner: true,
};

export function transformExlLinks(locale, root = document) {
  if (locale.ietf === 'en-US' || !locale.exl) return;
  const exLinks = root.querySelectorAll('a[href*="experienceleague.adobe.com"]');
  exLinks.forEach((link) => {
    if (link.href.includes('#_dnt')) return;
    if (link.href.includes('.html?lang=en')) {
      link.href = link.href.replace('.html?lang=en', '').replace('https://experienceleague.adobe.com/', `https://experienceleague.adobe.com/${locale.exl}/`);
    }
    link.href = link.href.replace('/en/', `/${locale.exl}/`);
  });
}

// Load LCP image immediately
(function loadLCPImage() {
  const lcpImg = document.querySelector('img');
  lcpImg?.removeAttribute('loading');
}());

async function detectSidekick({ loadScript, loadStyle }) {
  const initPlugins = async () => {
    const init = (await import('./sidekick.js')).default;
    init({ loadScript, loadStyle });
  };

  if (document.querySelector('aem-sidekick, helix-sidekick')) {
    initPlugins();
    return;
  }
  document.addEventListener('sidekick-ready', () => {
    initPlugins();
  });
}

/*
 * ------------------------------------------------------------
 * Edit below at your own risk
 * ------------------------------------------------------------
 */
(function loadStyles() {
  const paths = [`${LIBS}/styles/styles.css`];
  if (STYLES) { paths.push(STYLES); }
  paths.forEach((path) => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', path);
    document.head.appendChild(link);
  });
}());

export async function loadPage() {
  const {
    loadArea,
    setConfig,
    getLocale,
    loadLana,
    loadScript,
    loadStyle,
  } = await import(`${LIBS}/utils/utils.js`);

  detectSidekick({ loadScript, loadStyle });

  const locale = getLocale(CONFIG.locales);
  const decorateArea = (area) => { transformExlLinks(locale, area); };
  setConfig({ ...CONFIG, decorateArea, miloLibs: LIBS });
  loadLana({ clientId: 'bacom-blog', tags: 'default', endpoint: 'https://business.adobe.com/lana/ll', endpointStage: 'https://business.stage.adobe.com/lana/ll' });
  await buildAutoBlocks();
  transformExlLinks(locale);
  await loadArea();
}

loadPage();

// DA Live Preview
(async function loadDa() {
  if (!new URL(window.location.href).searchParams.get('dapreview')) return;
  // eslint-disable-next-line import/no-unresolved
  import('https://da.live/scripts/dapreview.js').then(({ default: daPreview }) => daPreview(loadPage));
}());
