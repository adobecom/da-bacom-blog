/* eslint-disable import/no-unresolved */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../../../tools/tags/tag-browser.js';

const tags = [
  {
    path: '/content/cq:tags/audience.1.json',
    activeTag: '',
    name: 'audience',
    title: 'User Guide Audience',
  },
  {
    path: '/content/cq:tags/authoring.1.json',
    activeTag: '',
    name: 'authoring',
    title: 'Authoring',
  },
  {
    path: '/content/cq:tags/caas.1.json',
    activeTag: '',
    name: 'caas',
    title: 'CaaS',
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

    expect(tagBrowser.shadowRoot.querySelector('.da-tag-browser')).to.exist;
    const groups = tagBrowser.shadowRoot.querySelector('.da-tag-groups');
    expect(groups).to.exist;
    expect(groups.children).to.have.lengthOf(1);

    const firstTitle = groups.firstElementChild.querySelector('.da-tag-title');
    expect(firstTitle).to.exist;
    expect(firstTitle.textContent.trim()).to.equal('User Guide Audience');

    const firstInsert = groups.firstElementChild.querySelector('.da-tag-insert');
    expect(firstInsert).to.exist;
  });

  it('expand tag group', async () => {
    const tagBrowser = init();
    await delay(100);

    const groups = tagBrowser.shadowRoot.querySelector('.da-tag-groups');
    const firstTitle = groups.firstElementChild.querySelector('.da-tag-title');
    firstTitle.click();
    await delay(100);

    expect(firstTitle.classList.contains('active')).to.be.true;
    expect(groups.children).to.have.lengthOf(2);
  });

  it('send tag text', async () => {
    const tagBrowser = init();
    await delay(100);

    const groups = tagBrowser.shadowRoot.querySelector('.da-tag-groups');
    const firstInsert = groups.firstElementChild.querySelector('.da-tag-insert');

    firstInsert.click();
    expect(tagBrowser.actions.sendText.calledOnce).to.be.true;
    expect(tagBrowser.actions.sendText.getCall(0).args[0]).to.equal(':/audience');
  });
});
