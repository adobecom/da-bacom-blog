/* eslint-disable import/no-unresolved */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../../../tools/tags/tag-browser.js';

const tags = [
  [
    {
      path: 'some/path/to/tag1',
      title: 'Tag 1 Title',
    },
    {
      path: 'some/path/to/tag2',
      title: 'Tag 2 Title',
    },
  ],
  [
    {
      path: 'some/path/to/tag3',
      title: 'Tag 3 Title',
    },
    {
      path: 'some/path/to/tag4',
      title: 'Tag 4 Title',
    },
  ],
];

const ogLana = window.lana;

const delay = (milliseconds) => new Promise((resolve) => { setTimeout(resolve, milliseconds); });

const init = () => {
  const daTagBrowser = document.createElement('da-tag-browser');
  document.body.append(daTagBrowser);
  daTagBrowser.tags = tags;
  daTagBrowser.actions = { sendText: sinon.spy() };

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
