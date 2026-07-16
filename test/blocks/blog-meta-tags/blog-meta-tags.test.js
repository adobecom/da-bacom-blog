import { expect } from '@esm-bundle/chai';
import init from '../../../blog/blocks/blog-meta-tags/blog-meta-tags.js';

describe('blog-meta-tags', () => {
  afterEach(() => {
    document.querySelector('meta[name="tags"]')?.remove();
  });

  it('decorates authored links as pills', async () => {
    document.body.innerHTML = `<div class="blog-meta-tags"><div><div>
      <a href="/r?t=blog">Blog</a><a href="/r?t=cx">CX</a></div></div></div>`;
    await init(document.querySelector('.blog-meta-tags'));
    const pills = document.querySelectorAll('a.blog-meta-tag');
    expect(pills).to.have.length(2);
    expect(pills[0].textContent).to.equal('Blog');
  });

  it('wraps pills in a ul.blog-meta-tags-list of li items', async () => {
    document.body.innerHTML = `<div class="blog-meta-tags"><div><div>
      <a href="/r?t=blog">Blog</a><a href="/r?t=cx">CX</a></div></div></div>`;
    await init(document.querySelector('.blog-meta-tags'));
    const list = document.querySelector('ul.blog-meta-tags-list');
    expect(list).to.exist;
    expect(list.querySelectorAll(':scope > li')).to.have.length(2);
    expect(list.querySelector('li a.blog-meta-tag')).to.exist;
  });

  it('preserves href on decorated pills', async () => {
    document.body.innerHTML = `<div class="blog-meta-tags"><div><div>
      <a href="/r?t=blog">Blog</a></div></div></div>`;
    await init(document.querySelector('.blog-meta-tags'));
    const pill = document.querySelector('a.blog-meta-tag');
    expect(pill.getAttribute('href')).to.equal('/r?t=blog');
  });

  it('removes itself when no authored links and stub yields nothing', async () => {
    document.body.innerHTML = '<div class="blog-meta-tags"><div><div></div></div></div>';
    await init(document.querySelector('.blog-meta-tags'));
    expect(document.querySelector('.blog-meta-tags')).to.be.null;
  });

  it('removes itself when no authored links even if page tags metadata exists (path B stub is a no-op)', async () => {
    const meta = document.createElement('meta');
    meta.name = 'tags';
    meta.content = 'caas:content-type/blog, caas:topic/thought-leadership';
    document.head.append(meta);
    document.body.innerHTML = '<div class="blog-meta-tags"><div><div></div></div></div>';
    await init(document.querySelector('.blog-meta-tags'));
    expect(document.querySelector('.blog-meta-tags')).to.be.null;
  });

  it('handles a block with no nested wrapper divs (programmatic mount)', async () => {
    document.body.innerHTML = '<div class="blog-meta-tags"></div>';
    await init(document.querySelector('.blog-meta-tags'));
    expect(document.querySelector('.blog-meta-tags')).to.be.null;
  });

  it('clamps overflow beyond two rows and removes those pills from the tab order', async () => {
    const links = Array.from({ length: 5 }, (_, i) => `<a href="/r?t=${i}">Tag ${i}</a>`).join('');
    document.body.innerHTML = `<div class="blog-meta-tags"><div><div>${links}</div></div></div>`;
    await init(document.querySelector('.blog-meta-tags'));
    const items = [...document.querySelectorAll('.blog-meta-tags-list > li')];
    expect(items).to.have.length(5);
    // Without the block's flex-wrap CSS loaded, each <li> renders on its own row,
    // so only the first two rows (first two items) remain visible/focusable.
    const visible = items.filter((li) => !li.hidden);
    const overflow = items.filter((li) => li.hidden);
    expect(visible).to.have.length(2);
    expect(overflow).to.have.length(3);
    overflow.forEach((li) => {
      // display: none (from the `hidden` attribute) removes the pill and its
      // link from layout entirely, so it cannot receive focus via Tab.
      expect(li.hidden).to.be.true;
      expect(li.offsetParent).to.be.null;
      expect(getComputedStyle(li).display).to.equal('none');
    });
  });
});
