import { expect } from '@esm-bundle/chai';
import { readFile } from '@web/test-runner-commands';
import sinon from 'sinon';
import { setLibs, buildAutoBlocks } from '../../blog/scripts/utils.js';

describe('Libs', () => {
  it('Default Libs', () => {
    const libs = setLibs('/libs');
    expect(libs).to.equal('https://da-patch--milo--adobecom.hlx.live/libs');
  });

  it('Does not support milolibs query param on prod', () => {
    const location = {
      hostname: 'business.adobe.com',
      search: '?milolibs=foo',
    };
    const libs = setLibs('/libs', location);
    expect(libs).to.equal('/libs');
  });

  it('Supports milolibs query param', () => {
    const location = {
      hostname: 'localhost',
      search: '?milolibs=foo',
    };
    const libs = setLibs('/libs', location);
    expect(libs).to.equal('https://foo--milo--adobecom.hlx.live/libs');
  });

  it('Supports local milolibs query param', () => {
    const location = {
      hostname: 'localhost',
      search: '?milolibs=local',
    };
    const libs = setLibs('/libs', location);
    expect(libs).to.equal('http://localhost:6456/libs');
  });

  it('Supports forked milolibs query param', () => {
    const location = {
      hostname: 'localhost',
      search: '?milolibs=awesome--milo--forkedowner',
    };
    const libs = setLibs('/libs', location);
    expect(libs).to.equal('https://awesome--milo--forkedowner.hlx.live/libs');
  });
});

const metadata = await readFile({ path: './mocks/head.html' });

window.lana = { log: () => {} };

describe('Auto Blocks', () => {
  before(() => {
    setLibs('/test/scripts/mocks', { hostname: 'none', search: '' });
    document.head.innerHTML = metadata;
  });

  beforeEach(() => {
    sinon.stub(window.lana, 'log');
  });

  afterEach(() => {
    window.lana.log.restore();
  });

  it('catches errors', async () => {
    document.body.innerHTML = '';
    await buildAutoBlocks();
    expect(window.lana.log.called).to.be.true;
  });

  it('builds the tags block', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    await buildAutoBlocks();
    expect(document.querySelector('.tags')).to.exist;
  });

  it('inserts the tags block before recommended articles if present', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/tagsWithRecBody.html' });
    await buildAutoBlocks();
    expect(document.querySelector('.tags + .recommended-articles')).to.exist;
  });

  it('inserts the tags block in section before recommended articles if present', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/tagsWithRecSectionBody.html' });
    await buildAutoBlocks();
    expect(document.querySelector('.before-rec .tags')).to.exist;
  });

  it('builds the article header block', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    await buildAutoBlocks();
    expect(document.querySelector('.article-header')).to.exist;
  });
});
