/* eslint-disable import/no-unresolved */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../../../tools/tags/tag-browser.js';

const tags = [
  {
    path: 'tag1',
    activeTag: '',
    name: 'tag1',
    title: 'Tag 1 Title',
  },
  {
    path: 'tag2',
    activeTag: '',
    name: 'tag2',
    title: 'Tag 2 Title',
  },
];

const ogLana = window.lana;

const delay = (milliseconds) => new Promise((resolve) => { setTimeout(resolve, milliseconds); });

const init = () => {
  const daTagBrowser = document.createElement('da-tag-browser');
  document.body.append(daTagBrowser);
  daTagBrowser.rootTags = tags;
  daTagBrowser.actions = { sendText: sinon.spy() };
  daTagBrowser.getTags = async (tag) => tags.map((t) => {
    t.activeTag = `${tag.activeTag}/${tag.name}`;
    return t;
  });
  return daTagBrowser;
};

describe('Locale Selector', () => {
  beforeEach(async () => {
    document.body.innerHTML = '';
    window.lana = { log: sinon.spy() };
  });

  afterEach(() => {
    window.lana = ogLana;
  });

  it('render the tag browser', async () => {
    const tagBrowser = init();
    await delay(100);
    expect(tagBrowser.shadowRoot.querySelector('.da-tag-groups')).to.exist;
  });
});
