import { expect } from '@esm-bundle/chai';
import init, { buildShareContent, copyShareLink } from '../../../blog/blocks/blog-share/blog-share.js';

describe('blog-share', () => {
  describe('buildShareContent', () => {
    it('builds a card and four channels with correct hrefs', () => {
      const el = buildShareContent({ title: 'T', description: 'D', image: 'i.jpg', url: 'https://x/y' });
      expect(el.querySelector('.blog-share-card-title').textContent).to.equal('T');
      expect(el.querySelectorAll('.blog-share-channels > li')).to.have.length(4);
      expect(el.querySelector('.blog-share-linkedin').href).to.include('linkedin.com/sharing');
      expect(el.querySelector('.blog-share-x').href).to.include('twitter.com/intent');
      expect(el.querySelector('.blog-share-email').href).to.include('mailto:');
      expect(el.querySelector('.blog-share-copy').tagName).to.equal('BUTTON');
    });

    it('encodes the url and title into channel hrefs', () => {
      const el = buildShareContent({ title: 'Hello World', description: '', image: '', url: 'https://example.com/a b' });
      const x = el.querySelector('.blog-share-x').getAttribute('href');
      expect(x).to.include(encodeURIComponent('https://example.com/a b'));
      expect(x).to.include(encodeURIComponent('Hello World'));
      const linkedin = el.querySelector('.blog-share-linkedin').getAttribute('href');
      expect(linkedin).to.include(encodeURIComponent('https://example.com/a b'));
      const email = el.querySelector('.blog-share-email').getAttribute('href');
      expect(email).to.include(encodeURIComponent('Hello World'));
    });

    it('sets target=_blank and rel=noopener on channel anchors, but not on the copy button', () => {
      const el = buildShareContent({ title: 'T', description: 'D', image: '', url: 'https://x/y' });
      ['.blog-share-x', '.blog-share-linkedin'].forEach((sel) => {
        const a = el.querySelector(sel);
        expect(a.target).to.equal('_blank');
        expect(a.rel).to.equal('noopener');
      });
      expect(el.querySelector('.blog-share-copy').tagName).to.equal('BUTTON');
    });

    it('marks the headline with a priority attribute so it can take precedence over the subhead', () => {
      const el = buildShareContent({ title: 'T', description: 'D', image: '', url: 'https://x/y' });
      expect(el.querySelector('.blog-share-card-title').getAttribute('data-priority')).to.equal('headline');
    });

    it('drops the subhead when the headline alone is expected to fill both clamp lines', () => {
      const longTitle = 'A very long headline that would consume both available clamp lines on its own';
      const el = buildShareContent({ title: longTitle, description: 'D', image: '', url: 'https://x/y' });
      expect(el.querySelector('.blog-share-card-desc')).to.be.null;
    });

    it('keeps the subhead when the headline is short', () => {
      const el = buildShareContent({ title: 'T', description: 'D', image: '', url: 'https://x/y' });
      expect(el.querySelector('.blog-share-card-desc').textContent).to.equal('D');
    });

    it('includes a hidden role=status live region for the copy confirmation', () => {
      const el = buildShareContent({ title: 'T', description: 'D', image: '', url: 'https://x/y' });
      const status = el.querySelector('.blog-share-copied');
      expect(status.getAttribute('role')).to.equal('status');
      expect(status.hidden).to.be.true;
    });

    it('renders the card image when provided', () => {
      const el = buildShareContent({ title: 'T', description: 'D', image: 'i.jpg', url: 'https://x/y' });
      expect(el.querySelector('.blog-share-card-img').src).to.include('i.jpg');
    });

    it('omits the card image when not provided', () => {
      const el = buildShareContent({ title: 'T', description: 'D', image: '', url: 'https://x/y' });
      expect(el.querySelector('.blog-share-card-img')).to.be.null;
    });
  });

  describe('copyShareLink', () => {
    let originalClipboard;

    beforeEach(() => {
      originalClipboard = navigator.clipboard;
    });

    afterEach(() => {
      Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true });
    });

    it('writes the url to the clipboard and reveals the copied status', async () => {
      const written = [];
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: (text) => { written.push(text); return Promise.resolve(); } },
        configurable: true,
      });
      const status = document.createElement('span');
      status.hidden = true;
      await copyShareLink('https://x/y', status);
      expect(written).to.deep.equal(['https://x/y']);
      expect(status.hidden).to.be.false;
    });

    it('still reveals the copied status if the clipboard write rejects', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: () => Promise.reject(new Error('denied')) },
        configurable: true,
      });
      const status = document.createElement('span');
      status.hidden = true;
      await copyShareLink('https://x/y', status);
      expect(status.hidden).to.be.false;
    });

    it('does not show the copied status when navigator.clipboard is absent and the legacy fallback fails', async () => {
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
      const originalExecCommand = document.execCommand;
      document.execCommand = () => false;
      try {
        const status = document.createElement('span');
        status.hidden = true;
        await copyShareLink('https://x/y', status);
        expect(status.hidden).to.be.true;
      } finally {
        document.execCommand = originalExecCommand;
      }
    });
  });

  describe('init', () => {
    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('wires an authored trigger element with aria-haspopup=dialog', async () => {
      document.body.innerHTML = '<div class="blog-share"><a href="#">Share</a></div>';
      await init(document.querySelector('.blog-share'));
      const trigger = document.querySelector('.blog-share a');
      expect(trigger.getAttribute('aria-haspopup')).to.equal('dialog');
    });

    it('does not throw when called with no children', async () => {
      document.body.innerHTML = '<div class="blog-share"></div>';
      await init(document.querySelector('.blog-share'));
      expect(document.querySelector('.blog-share').getAttribute('aria-haspopup')).to.equal('dialog');
    });
  });
});
