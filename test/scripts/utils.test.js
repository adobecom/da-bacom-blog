import { expect } from '@esm-bundle/chai';
import { readFile } from '@web/test-runner-commands';
import sinon from 'sinon';
import { setLibs, buildAutoBlocks } from '../../blog/scripts/utils.js';

describe('Libs', () => {
  it('Default Libs', () => {
    const libs = setLibs('/libs');
    expect(libs).to.equal('https://main--milo--adobecom.hlx.live/libs');
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
const body = await readFile({ path: './mocks/body.html' });

window.lana = { log: () => {} };

describe('Auto Blocks', () => {
  before(() => {
    setLibs('/test/scripts/mocks', { hostname: 'none', search: '' });
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
});
