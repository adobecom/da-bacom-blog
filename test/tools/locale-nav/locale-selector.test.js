/* eslint-disable import/no-unresolved */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../../../tools/locale-nav/locale-selector.js';

const locales = [
  {
    code: 'uk',
    path: '/uk/blog/index',
    edit: 'https://da.live/edit#/adobecom/da-bacom-blog/uk/blog/index',
    preview: 'https://main--da-bacom-blog--adobecom.hlx.page/uk/blog/index',
    live: 'https://main--da-bacom-blog--adobecom.hlx.live/uk/blog/index',
  },
  {
    code: 'au',
    path: '/au/blog/index',
    edit: 'https://da.live/edit#/adobecom/da-bacom-blog/au/blog/index',
    preview: 'https://main--da-bacom-blog--adobecom.hlx.page/au/blog/index',
    live: 'https://main--da-bacom-blog--adobecom.hlx.live/au/blog/index',
  },
  {
    code: 'de',
    path: '/de/blog/index',
    edit: 'https://da.live/edit#/adobecom/da-bacom-blog/de/blog/index',
    preview: 'https://main--da-bacom-blog--adobecom.hlx.page/de/blog/index',
    live: 'https://main--da-bacom-blog--adobecom.hlx.live/de/blog/index',
  },
  {
    code: 'fr',
    path: '/fr/blog/index',
    edit: 'https://da.live/edit#/adobecom/da-bacom-blog/fr/blog/index',
    preview: 'https://main--da-bacom-blog--adobecom.hlx.page/fr/blog/index',
    live: 'https://main--da-bacom-blog--adobecom.hlx.live/fr/blog/index',
  },
  {
    code: 'kr',
    path: '/kr/blog/index',
    edit: 'https://da.live/edit#/adobecom/da-bacom-blog/kr/blog/index',
    preview: 'https://main--da-bacom-blog--adobecom.hlx.page/kr/blog/index',
    live: 'https://main--da-bacom-blog--adobecom.hlx.live/kr/blog/index',
  },
  {
    code: 'ja',
    path: '/ja/blog/index',
    edit: 'https://da.live/edit#/adobecom/da-bacom-blog/ja/blog/index',
    preview: 'https://main--da-bacom-blog--adobecom.hlx.page/ja/blog/index',
    live: 'https://main--da-bacom-blog--adobecom.hlx.live/ja/blog/index',
  },
  {
    code: 'en',
    path: '/blog/index',
    edit: 'https://da.live/edit#/adobecom/da-bacom-blog/blog/index',
    preview: 'https://main--da-bacom-blog--adobecom.hlx.page/blog/index',
    live: 'https://main--da-bacom-blog--adobecom.hlx.live/blog/index',
  },
  {
    code: 'langstore/en',
    path: '/langstore/en/blog/index',
    edit: 'https://da.live/edit#/adobecom/da-bacom-blog/langstore/en/blog/index',
    preview: 'https://main--da-bacom-blog--adobecom.hlx.page/langstore/en/blog/index',
    live: 'https://main--da-bacom-blog--adobecom.hlx.live/langstore/en/blog/index',
  },
];

const status = {
  uk: { preview: 200, live: 200 },
  au: { preview: 200, live: 404 },
  de: { preview: 200, live: 404 },
  fr: { preview: 200, live: 404 },
  kr: { preview: 200, live: 404 },
  ja: { preview: 200, live: 404 },
  en: { preview: 200, live: 200 },
  'langstore/en': { preview: 404, live: 404 },
};

const ogLana = window.lana;

const delay = (milliseconds) => new Promise((resolve) => { setTimeout(resolve, milliseconds); });

const init = (localeCode = '') => {
  const localeNav = document.createElement('da-locale-selector');

  const altLocales = locales.filter((locale) => locale.code !== localeCode);
  const currLocale = locales.find((locale) => locale.code === localeCode);

  localeNav.altLocales = altLocales;
  localeNav.currLocale = currLocale;
  localeNav.status = status;
  document.body.append(localeNav);

  return localeNav;
};

describe('Locale Selector', () => {
  beforeEach(async () => {
    document.body.innerHTML = '';
    window.lana = { log: sinon.spy() };
  });

  afterEach(() => {
    window.lana = ogLana;
  });

  it('render the locale selector', async () => {
    const localeSelector = init('en');
    await delay(100);

    expect(localeSelector).to.exist;
    expect(localeSelector.shadowRoot).to.exist;

    const localeSelectorEl = localeSelector.shadowRoot.querySelector('.locale-selector');
    expect(localeSelectorEl).to.exist;

    const currentLocale = localeSelectorEl.querySelector('.current .detail');
    expect(currentLocale).to.exist;
    expect(currentLocale.querySelector('span').textContent).to.equal('en');
    expect(currentLocale.querySelector('.edit').href).to.equal('https://da.live/edit#/adobecom/da-bacom-blog/blog/index');
    expect(currentLocale.querySelector('.preview').href).to.equal('https://main--da-bacom-blog--adobecom.hlx.page/blog/index');
    expect(currentLocale.querySelector('.live').href).to.equal('https://main--da-bacom-blog--adobecom.hlx.live/blog/index');
  });

  it('handle search', async () => {
    const localeSelector = init('uk');
    await delay(100);

    const localeSelectorEl = localeSelector.shadowRoot.querySelector('.locale-selector');
    expect(localeSelectorEl).to.exist;

    const searchInput = localeSelectorEl.querySelector('.locale-search');
    searchInput.value = 'en';
    searchInput.dispatchEvent(new Event('keyup'));

    const localeElements = localeSelectorEl.querySelectorAll('.locales li');
    localeElements.forEach((element) => {
      if (element.textContent.includes('en')) {
        expect(element.style.display).to.equal('');
      } else {
        expect(element.style.display).to.equal('none');
      }
    });
  });
});
