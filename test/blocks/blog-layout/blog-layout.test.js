import { expect } from '@esm-bundle/chai';
import init from '../../../blog/blocks/blog-layout/blog-layout.js';

const HTML = `
<main>
  <div class="section article-header-section"><div class="article-header"></div></div>
  <div class="section"><div class="blog-layout"></div></div>
  <div class="section"><h2>One</h2><p>a</p></div>
  <div class="section"><h2>Two</h2><p>b</p></div>
</main>`;

describe('blog-layout', () => {
  beforeEach(() => { document.body.className = ''; document.body.innerHTML = HTML; });

  it('adds the blog-2026 scope class to body', async () => {
    await init(document.querySelector('.blog-layout'));
    expect(document.body.classList.contains('blog-2026')).to.be.true;
  });

  it('builds a rail and a content wrapper', async () => {
    await init(document.querySelector('.blog-layout'));
    expect(document.querySelector('aside.blog-rail')).to.exist;
    expect(document.querySelector('div.blog-content')).to.exist;
  });

  it('moves body sections (after the layout block) into blog-content', async () => {
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

  it('renders a related-content placeholder in the rail', async () => {
    await init(document.querySelector('.blog-layout'));
    expect(document.querySelector('.blog-rail .blog-related-placeholder')).to.exist;
  });
});
