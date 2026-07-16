import { expect } from '@esm-bundle/chai';
import init, { pickActiveId, setActiveLink } from '../../../blog/blocks/blog-side-nav/blog-side-nav.js';

const HTML = `<div class="blog-content">
  <h2>First section</h2><p>x</p><h2>Second section</h2><p>y</p>
  <nav class="blog-side-nav"></nav></div>`;

describe('blog-side-nav', () => {
  beforeEach(() => { document.body.innerHTML = HTML; });

  it('builds one link per h2', async () => {
    await init(document.querySelector('.blog-side-nav'));
    expect(document.querySelectorAll('.blog-side-nav-list a')).to.have.length(2);
  });

  it('assigns slug ids to headings and links to them', async () => {
    await init(document.querySelector('.blog-side-nav'));
    expect(document.getElementById('first-section')).to.exist;
    expect(document.querySelector('.blog-side-nav-list a').getAttribute('href')).to.equal('#first-section');
  });

  it('removes itself when there are no h2s', async () => {
    document.body.innerHTML = '<div class="blog-content"><nav class="blog-side-nav"></nav></div>';
    await init(document.querySelector('.blog-side-nav'));
    expect(document.querySelector('.blog-side-nav')).to.be.null;
  });

  it('reuses an existing id on a heading instead of overwriting it', async () => {
    document.body.innerHTML = `<div class="blog-content">
      <h2 id="custom-id">First section</h2><p>x</p>
      <nav class="blog-side-nav"></nav></div>`;
    await init(document.querySelector('.blog-side-nav'));
    expect(document.getElementById('custom-id')).to.exist;
    expect(document.querySelector('.blog-side-nav-list a').getAttribute('href')).to.equal('#custom-id');
  });

  it('dedupes slug ids when heading text collides', async () => {
    document.body.innerHTML = `<div class="blog-content">
      <h2>Section</h2><p>x</p><h2>Section</h2><p>y</p>
      <nav class="blog-side-nav"></nav></div>`;
    await init(document.querySelector('.blog-side-nav'));
    const links = [...document.querySelectorAll('.blog-side-nav-list a')];
    expect(links[0].getAttribute('href')).to.equal('#section');
    expect(links[1].getAttribute('href')).to.equal('#section-2');
    expect(document.getElementById('section')).to.exist;
    expect(document.getElementById('section-2')).to.exist;
  });

  it('collapses extra links beyond the threshold behind a toggle', async () => {
    document.body.innerHTML = `<div class="blog-content">
      ${Array.from({ length: 8 }, (_, i) => `<h2>Section ${i + 1}</h2>`).join('')}
      <nav class="blog-side-nav"></nav></div>`;
    await init(document.querySelector('.blog-side-nav'));
    const nav = document.querySelector('.blog-side-nav');
    expect(nav.querySelectorAll('.blog-side-nav-list a')).to.have.length(8);
    const extraItems = nav.querySelectorAll('.blog-side-nav-item-extra');
    expect(extraItems).to.have.length(2);
    const moreToggle = nav.querySelector('.blog-side-nav-more-toggle');
    expect(moreToggle).to.exist;
    expect(moreToggle.getAttribute('aria-expanded')).to.equal('false');
    moreToggle.click();
    expect(moreToggle.getAttribute('aria-expanded')).to.equal('true');
    expect(nav.classList.contains('is-expanded')).to.be.true;
  });

  it('does not render a more-toggle when at or below the threshold', async () => {
    document.body.innerHTML = `<div class="blog-content">
      ${Array.from({ length: 6 }, (_, i) => `<h2>Section ${i + 1}</h2>`).join('')}
      <nav class="blog-side-nav"></nav></div>`;
    await init(document.querySelector('.blog-side-nav'));
    const nav = document.querySelector('.blog-side-nav');
    expect(nav.querySelector('.blog-side-nav-more-toggle')).to.be.null;
    expect(nav.querySelectorAll('.blog-side-nav-item-extra')).to.have.length(0);
  });

  it('falls back to main h2 when there is no .blog-content', async () => {
    document.body.innerHTML = `<main>
      <h2>Only section</h2>
      <nav class="blog-side-nav"></nav></main>`;
    await init(document.querySelector('.blog-side-nav'));
    expect(document.querySelectorAll('.blog-side-nav-list a')).to.have.length(1);
  });

  it('renders the label/toggle button with fallback text offline', async () => {
    await init(document.querySelector('.blog-side-nav'));
    const toggle = document.querySelector('.blog-side-nav-toggle');
    expect(toggle).to.exist;
    expect(toggle.getAttribute('aria-expanded')).to.equal('true');
    expect(toggle.textContent).to.equal('JUMP TO SECTION');
  });

  it('sets aria-label on the nav landmark', async () => {
    await init(document.querySelector('.blog-side-nav'));
    expect(document.querySelector('.blog-side-nav').getAttribute('aria-label')).to.equal('Jump to section');
  });

  describe('pickActiveId (pure scroll-spy helper)', () => {
    it('returns the topmost id that is currently intersecting', () => {
      const ids = ['a', 'b', 'c'];
      const intersecting = new Set(['b', 'c']);
      expect(pickActiveId(ids, intersecting)).to.equal('b');
    });

    it('returns null when nothing is intersecting', () => {
      expect(pickActiveId(['a', 'b'], new Set())).to.be.null;
    });
  });

  describe('setActiveLink (pure DOM helper)', () => {
    it('sets aria-current and is-active on the matching link and clears others', async () => {
      await init(document.querySelector('.blog-side-nav'));
      const nav = document.querySelector('.blog-side-nav');
      setActiveLink(nav, 'second-section');
      const links = [...nav.querySelectorAll('.blog-side-nav-list a')];
      const active = links.find((a) => a.getAttribute('href') === '#second-section');
      const inactive = links.find((a) => a.getAttribute('href') === '#first-section');
      expect(active.getAttribute('aria-current')).to.equal('location');
      expect(active.classList.contains('is-active')).to.be.true;
      expect(inactive.hasAttribute('aria-current')).to.be.false;
      expect(inactive.classList.contains('is-active')).to.be.false;
    });
  });
});
