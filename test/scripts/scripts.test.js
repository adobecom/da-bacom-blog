import { expect } from '@esm-bundle/chai';
import { readFile } from '@web/test-runner-commands';
import sinon from 'sinon';
import { setLibs, buildAutoBlocks, transformExlLinks } from '../../blog/scripts/scripts.js';

describe('Libs', () => {
  it('Default Libs', () => {
    const libs = setLibs(window.location);
    expect(libs).to.equal('https://main--milo--adobecom.aem.live/libs');
  });

  it('Does not support milolibs query param on prod', () => {
    const location = {
      hostname: 'business.adobe.com',
      search: '?milolibs=foo',
    };
    const libs = setLibs(location);
    expect(libs).to.equal('/libs');
  });

  it('Supports milolibs query param', () => {
    const location = {
      hostname: 'localhost',
      search: '?milolibs=foo',
    };
    const libs = setLibs(location);
    expect(libs).to.equal('https://foo--milo--adobecom.aem.live/libs');
  });

  it('Supports local milolibs query param', () => {
    const location = {
      hostname: 'localhost',
      search: '?milolibs=local',
    };
    const libs = setLibs(location);
    expect(libs).to.equal('http://localhost:6456/libs');
  });

  it('Supports forked milolibs query param', () => {
    const location = {
      hostname: 'localhost',
      search: '?milolibs=awesome--milo--forkedowner',
    };
    const libs = setLibs(location);
    expect(libs).to.equal('https://awesome--milo--forkedowner.aem.live/libs');
  });
});

describe('Transform Experience League Links', () => {
  it('does nothing for en-US locale', () => {
    const locale = { ietf: 'en-US' };
    const root = document.createElement('div');
    root.innerHTML = '<a href="https://experienceleague.adobe.com/en/docs/thing">Link</a>';
    transformExlLinks(locale, root);
    expect(root.querySelector('a').href).to.equal('https://experienceleague.adobe.com/en/docs/thing');
  });

  it('does nothing for locale without exl mapping', () => {
    const locale = { ietf: 'en-AU' };
    const root = document.createElement('div');
    root.innerHTML = '<a href="https://experienceleague.adobe.com/en/docs/thing">Link</a>';
    transformExlLinks(locale, root);
    expect(root.querySelector('a').href).to.equal('https://experienceleague.adobe.com/en/docs/thing');
  });

  it('transforms /en/ path segment to locale exl value', () => {
    const locale = { ietf: 'fr-FR', exl: 'fr' };
    const root = document.createElement('div');
    root.innerHTML = '<a href="https://experienceleague.adobe.com/en/docs/experience-manager">Link</a>';
    transformExlLinks(locale, root);
    expect(root.querySelector('a').href).to.equal('https://experienceleague.adobe.com/fr/docs/experience-manager');
  });

  it('transforms .html?lang=en links', () => {
    const locale = { ietf: 'de-DE', exl: 'de' };
    const root = document.createElement('div');
    root.innerHTML = '<a href="https://experienceleague.adobe.com/docs/thing.html?lang=en">Link</a>';
    transformExlLinks(locale, root);
    expect(root.querySelector('a').href).to.equal('https://experienceleague.adobe.com/de/docs/thing');
  });

  it('skips links with #_dnt', () => {
    const locale = { ietf: 'fr-FR', exl: 'fr' };
    const root = document.createElement('div');
    root.innerHTML = '<a href="https://experienceleague.adobe.com/en/docs/thing#_dnt">Link</a>';
    transformExlLinks(locale, root);
    expect(root.querySelector('a').href).to.equal('https://experienceleague.adobe.com/en/docs/thing#_dnt');
  });

  it('transforms links in a custom root element (e.g. fragment content)', () => {
    const locale = { ietf: 'fr-FR', exl: 'fr' };
    const root = document.createElement('div');
    root.innerHTML = '<a href="https://experienceleague.adobe.com/en/docs/experience-manager">Link</a>';
    transformExlLinks(locale, root);
    expect(root.querySelector('a').href).to.equal('https://experienceleague.adobe.com/fr/docs/experience-manager');
  });
});

const metadata = await readFile({ path: './mocks/head.html' });
const body = await readFile({ path: './mocks/body.html' });

window.lana = { log: () => {} };

describe('Auto Blocks', () => {
  before(() => {
    setLibs({ hostname: 'none', search: '' });
    document.head.innerHTML = metadata;
  });

  beforeEach(async () => {
    sinon.stub(window.lana, 'log');
    document.body.innerHTML = body;
  });

  afterEach(() => {
    window.lana.log.restore();
  });

  it('catches errors', async () => {
    document.body.innerHTML = '';
    await buildAutoBlocks();
    expect(window.lana.log.called).to.be.true;
  });

  it('builds the article header block', async () => {
    await buildAutoBlocks();
    expect(document.querySelector('.article-header')).to.exist;
  });

  it('does not show the category', async () => {
    await buildAutoBlocks();
    const category = document.head.querySelector('meta[name=category]').content;
    expect(document.querySelector('.article-header').innerText.includes(category)).to.be.false;
  });

  it('allows video link', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body-video.html' });
    await buildAutoBlocks();
    expect(document.querySelector('.article-header > div:nth-child(4) a')).to.exist;
  });
});
