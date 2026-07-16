import { expect } from '@esm-bundle/chai';
import init, { computeReadTime, decorateMarquee } from '../../../blog/blocks/blog-layout/blog-layout.js';

// Real Milo output for a typical blog article: NO `---` section breaks, so the
// marquee, the blog-layout marker, and the entire body are all children of ONE
// `.section`. The block must move the body into `.blog-content` WITHOUT removing
// the section (which would delete the marquee and body).
const SINGLE_SECTION_HTML = `
<main>
  <div class="section">
    <div class="article-header">MARQUEE</div>
    <div class="blog-layout"></div>
    <div class="default-content-wrapper"><h2>One</h2><p>a</p><h2>Two</h2><p>b</p></div>
  </div>
</main>`;

// Multi-section article (author used `---` breaks): marquee, block, and body
// live in separate sections. Must keep working too.
const MULTI_SECTION_HTML = `
<main>
  <div class="section"><div class="article-header">MARQUEE</div></div>
  <div class="section"><div class="blog-layout"></div></div>
  <div class="section"><div class="default-content-wrapper"><h2>One</h2><p>a</p></div></div>
  <div class="section"><div class="default-content-wrapper"><h2>Two</h2><p>b</p></div></div>
</main>`;

describe('blog-layout', () => {
  beforeEach(() => { document.body.className = ''; document.body.innerHTML = SINGLE_SECTION_HTML; });

  it('adds the blog-2026 scope class to body', async () => {
    await init(document.querySelector('.blog-layout'));
    expect(document.body.classList.contains('blog-2026')).to.be.true;
  });

  it('builds a rail and a content wrapper', async () => {
    await init(document.querySelector('.blog-layout'));
    expect(document.querySelector('aside.blog-rail')).to.exist;
    expect(document.querySelector('div.blog-content')).to.exist;
  });

  it('does NOT delete the article body when everything is in one section (regression)', async () => {
    await init(document.querySelector('.blog-layout'));
    // The body headings must still exist somewhere in the document.
    expect(document.querySelectorAll('h2')).to.have.length(2);
    expect(document.body.textContent).to.include('One');
  });

  it('does NOT delete the marquee when it shares the section with the block (regression)', async () => {
    await init(document.querySelector('.blog-layout'));
    expect(document.querySelector('.article-header')).to.exist;
    expect(document.body.textContent).to.include('MARQUEE');
  });

  it('moves the body into blog-content', async () => {
    await init(document.querySelector('.blog-layout'));
    const content = document.querySelector('.blog-content');
    expect(content.querySelectorAll('h2')).to.have.length(2);
    expect(content.textContent).to.include('One');
  });

  it('leaves the marquee (article-header) outside blog-content', async () => {
    await init(document.querySelector('.blog-layout'));
    const content = document.querySelector('.blog-content');
    expect(content.querySelector('.article-header')).to.be.null;
  });

  it('removes the blog-layout marker element', async () => {
    await init(document.querySelector('.blog-layout'));
    expect(document.querySelector('.blog-layout')).to.be.null;
  });

  it('renders a related-content placeholder in the rail', async () => {
    await init(document.querySelector('.blog-layout'));
    expect(document.querySelector('.blog-rail .blog-related-placeholder')).to.exist;
  });

  it('decorates the marquee (eyebrow + share pill) when an article-header exists', async () => {
    await init(document.querySelector('.blog-layout'));
    const header = document.querySelector('.article-header');
    expect(header.querySelector('.article-eyebrow')).to.exist;
    expect(header.querySelector('.blog-share-pill')).to.exist;
  });

  it('loads each rail sub-block stylesheet when mounting it (rail blocks bypass Milo loadBlock)', async () => {
    await init(document.querySelector('.blog-layout'));
    ['blog-side-nav', 'blog-meta-tags', 'blog-progress-bar'].forEach((name) => {
      const href = `/blog/blocks/${name}/${name}.css`;
      expect(document.querySelector(`link[href="${href}"]`), `${href} should be loaded`).to.exist;
    });
  });

  it('handles a multi-section article without deleting content', async () => {
    document.body.innerHTML = MULTI_SECTION_HTML;
    await init(document.querySelector('.blog-layout'));
    expect(document.querySelector('.article-header')).to.exist;
    const content = document.querySelector('.blog-content');
    expect(content.querySelectorAll('h2')).to.have.length(2);
    expect(content.querySelector('.article-header')).to.be.null;
  });

  it('does not throw and preserves body when there is no marquee', async () => {
    document.body.innerHTML = `
      <main>
        <div class="section">
          <div class="blog-layout"></div>
          <div class="default-content-wrapper"><h2>One</h2><p>a</p></div>
        </div>
      </main>`;
    await init(document.querySelector('.blog-layout'));
    expect(document.querySelectorAll('h2')).to.have.length(1);
    expect(document.querySelector('.blog-content').querySelectorAll('h2')).to.have.length(1);
  });
});

describe('computeReadTime', () => {
  it('floors at 1 minute for zero words', () => {
    expect(computeReadTime('')).to.equal(1);
  });

  it('returns 1 minute for exactly 200 words at 200wpm', () => {
    const text = new Array(200).fill('word').join(' ');
    expect(computeReadTime(text)).to.equal(1);
  });

  it('rounds up (ceil) for partial minutes — 450 words @ 200wpm = 3', () => {
    const text = new Array(450).fill('word').join(' ');
    expect(computeReadTime(text)).to.equal(3);
  });

  it('honors a custom words-per-minute rate', () => {
    const text = new Array(100).fill('word').join(' ');
    expect(computeReadTime(text, 100)).to.equal(1);
    expect(computeReadTime(text, 50)).to.equal(2);
  });
});

describe('decorateMarquee', () => {
  beforeEach(() => { document.body.className = ''; document.body.innerHTML = ''; });

  it('does nothing when there is no article-header', async () => {
    await decorateMarquee(null);
  });

  it('injects an .article-eyebrow with a read-time into the article-header', async () => {
    document.body.innerHTML = '<main><div class="article-header"></div></main>';
    const header = document.querySelector('.article-header');
    await decorateMarquee(header, { bodyText: new Array(200).fill('word').join(' ') });
    const eyebrow = header.querySelector('.article-eyebrow');
    expect(eyebrow).to.exist;
    expect(eyebrow.textContent).to.include('1 min read');
  });

  it('does not duplicate the eyebrow if one already exists', async () => {
    document.body.innerHTML = '<main><div class="article-header"><div class="article-eyebrow">existing</div></div></main>';
    const header = document.querySelector('.article-header');
    await decorateMarquee(header);
    expect(header.querySelectorAll('.article-eyebrow')).to.have.length(1);
    expect(header.querySelector('.article-eyebrow').textContent).to.equal('existing');
  });

  it('replaces .article-byline-sharing contents with a blog-share-pill button', async () => {
    document.body.innerHTML = `
      <main>
        <div class="article-header">
          <div class="article-byline">
            <div class="article-byline-sharing"><a href="#">old link</a></div>
          </div>
        </div>
      </main>`;
    const header = document.querySelector('.article-header');
    await decorateMarquee(header);
    const sharing = header.querySelector('.article-byline-sharing');
    const pill = sharing.querySelector('.blog-share-pill');
    expect(pill).to.exist;
    expect(pill.tagName).to.equal('BUTTON');
    expect(pill.getAttribute('aria-haspopup')).to.equal('dialog');
    expect(sharing.querySelector('a')).to.be.null;
  });

  it('creates the pill in the byline when .article-byline-sharing is absent', async () => {
    document.body.innerHTML = '<main><div class="article-header"><div class="article-byline"></div></div></main>';
    const header = document.querySelector('.article-header');
    await decorateMarquee(header);
    expect(header.querySelector('.article-byline .blog-share-pill')).to.exist;
  });

  it('creates the pill directly on the header when no byline exists either', async () => {
    document.body.innerHTML = '<main><div class="article-header"></div></main>';
    const header = document.querySelector('.article-header');
    await decorateMarquee(header);
    expect(header.querySelector('.blog-share-pill')).to.exist;
  });

  it('does not duplicate the share pill on a second decorate pass', async () => {
    document.body.innerHTML = '<main><div class="article-header"><div class="article-byline"></div></div></main>';
    const header = document.querySelector('.article-header');
    await decorateMarquee(header);
    await decorateMarquee(header);
    expect(header.querySelectorAll('.blog-share-pill')).to.have.length(1);
  });
});
