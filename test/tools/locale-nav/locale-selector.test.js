/* eslint-disable import/no-unresolved */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { mockFetch, restoreFetch } from './mocks/fetch.js';
import '../../../tools/locale-nav/locale-selector.js';

const ogLana = window.lana;

const delay = (milliseconds) => new Promise((resolve) => { setTimeout(resolve, milliseconds); });

const init = (path) => {
  const localeNav = document.createElement('da-locale-selector');
  Object.assign(localeNav, {
    repo: 'da-bacom-blog',
    org: 'adobecom',
    path,
    token: '',
  });
  document.body.append(localeNav);

  return localeNav;
};

describe('Locale Selector', () => {
  beforeEach(async () => {
    document.body.innerHTML = '';
    window.lana = { log: sinon.spy() };
    mockFetch();
  });

  afterEach(() => {
    restoreFetch();
    window.lana = ogLana;
  });

  it('render the locale selector', async () => {
    const localeSelector = init('/blog/index');
    await delay(500);

    expect(localeSelector).to.exist;
    expect(localeSelector.shadowRoot).to.exist;

    const localeSelectorEl = localeSelector.shadowRoot.querySelector('.locale-selector');
    expect(localeSelectorEl).to.exist;

    const currentLocale = localeSelectorEl.querySelector('.current .detail');
    expect(currentLocale).to.exist;
    expect(currentLocale.querySelector('span').textContent).to.equal('us');
    expect(currentLocale.querySelector('.edit').href).to.equal('https://da.live/edit#/adobecom/da-bacom-blog/blog/index');
    expect(currentLocale.querySelector('.preview').href).to.equal('https://main--da-bacom-blog--adobecom.hlx.page/blog/');
    expect(currentLocale.querySelector('.live').href).to.equal('https://main--da-bacom-blog--adobecom.hlx.live/blog/');
  });

  it('handle search', async () => {
    const localeSelector = init('/ae_ar/blog/index');
    await delay(500);

    const localeSelectorEl = localeSelector.shadowRoot.querySelector('.locale-selector');
    expect(localeSelectorEl).to.exist;

    const searchInput = localeSelectorEl.querySelector('.locale-search');
    searchInput.value = 'us';
    searchInput.dispatchEvent(new Event('keyup'));

    const localeElements = localeSelectorEl.querySelectorAll('.locales li');
    localeElements.forEach((element) => {
      if (element.textContent.includes('us')) {
        expect(element.style.display).to.equal('');
      } else {
        expect(element.style.display).to.equal('none');
      }
    });
  });

  it('invalid path', async () => {
    const localeSelector = init('/invalid/blog/index');
    await delay(500);

    const localeSelectorEl = localeSelector.shadowRoot.querySelector('.locale-selector');
    expect(localeSelectorEl).to.exist;

    const currentLocale = localeSelectorEl.querySelector('.current .detail');
    expect(currentLocale).to.exist;
    expect(currentLocale.querySelector('span').textContent).to.equal('us');
    expect(currentLocale.querySelector('.edit').classList.contains('status-404')).to.be.true;
    expect(currentLocale.querySelector('.preview').classList.contains('status-404')).to.be.true;
    expect(currentLocale.querySelector('.live').classList.contains('status-404')).to.be.true;
  });
});
