import { expect } from '@esm-bundle/chai';
import init, { computeProgress } from '../../../blog/blocks/blog-progress-bar/blog-progress-bar.js';

describe('blog-progress-bar', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('computeProgress', () => {
    it('computes 0 at start, 100 at end, clamps', () => {
      expect(computeProgress(0, 0, 2000, 800)).to.equal(0);
      expect(computeProgress(1200, 0, 2000, 800)).to.equal(100);
      expect(computeProgress(9999, 0, 2000, 800)).to.equal(100);
      expect(computeProgress(-50, 0, 2000, 800)).to.equal(0);
    });

    it('is proportional in the middle of the range', () => {
      // range is height - vh = 1200; halfway scrolled (600) is 50%
      expect(computeProgress(600, 0, 2000, 800)).to.equal(50);
    });

    it('accounts for a non-zero top offset', () => {
      // top=100, height=2000, vh=800 -> range 1200; scrollY=top is start (0%),
      // scrollY=top+range is end (100%)
      expect(computeProgress(100, 100, 2000, 800)).to.equal(0);
      expect(computeProgress(1300, 100, 2000, 800)).to.equal(100);
    });

    it('returns 0 when content is shorter than the viewport', () => {
      expect(computeProgress(0, 0, 500, 800)).to.equal(0);
      expect(computeProgress(200, 0, 500, 800)).to.equal(0);
    });
  });

  describe('init', () => {
    it('renders a progressbar element', async () => {
      document.body.innerHTML = '<main><div class="blog-progress-bar"></div><p style="height:3000px"></p></main>';
      await init(document.querySelector('.blog-progress-bar'));
      const bar = document.querySelector('[role="progressbar"]');
      expect(bar).to.exist;
      expect(bar.querySelector('.blog-progress-bar-fill')).to.exist;
    });

    it('sets the expected aria attributes', async () => {
      document.body.innerHTML = '<main><div class="blog-progress-bar"></div><p style="height:3000px"></p></main>';
      await init(document.querySelector('.blog-progress-bar'));
      const bar = document.querySelector('[role="progressbar"]');
      expect(bar.getAttribute('aria-valuemin')).to.equal('0');
      expect(bar.getAttribute('aria-valuemax')).to.equal('100');
      expect(bar.getAttribute('aria-valuenow')).to.equal('0');
      expect(bar.getAttribute('aria-label')).to.equal('Reading progress');
    });

    it('keeps the blog-progress-bar class on the host element', async () => {
      document.body.innerHTML = '<main><div class="blog-progress-bar"></div><p style="height:3000px"></p></main>';
      await init(document.querySelector('.blog-progress-bar'));
      expect(document.querySelector('.blog-progress-bar')).to.exist;
    });

    it('does not throw when there is no .blog-content and falls back to main', async () => {
      document.body.innerHTML = '<main><div class="blog-progress-bar"></div><p style="height:3000px"></p></main>';
      let threw = false;
      try {
        await init(document.querySelector('.blog-progress-bar'));
      } catch {
        threw = true;
      }
      expect(threw).to.be.false;
    });
  });
});
