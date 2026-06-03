import { expect } from '@esm-bundle/chai';
import init from '../../../blog/blocks/blog-author/blog-author.js';

const BLOCK_HTML = `
<div class="blog-author">
  <div><div><picture><img src="https://example.com/author.jpg" alt="Jane Doe"></picture></div></div>
  <div><div>
    <p>Jane Doe</p>
    <p>Senior Director, Marketing</p>
    <p>Jane has 15 years of experience in B2B marketing.</p>
  </div></div>
  <div><div>
    <a href="https://linkedin.com/in/janedoe">LinkedIn</a>
    <a href="https://twitter.com/janedoe">Twitter</a>
  </div></div>
  <div><div>
    <a href="https://example.com/subscribe">Subscribe</a>
  </div></div>
</div>`;

function getPersonSchema() {
  const scripts = [...document.head.querySelectorAll('script[type="application/ld+json"]')];
  const script = scripts.find((s) => {
    try { return JSON.parse(s.textContent)['@type'] === 'Person'; } catch { return false; }
  });
  return script ? JSON.parse(script.textContent) : null;
}

describe('Blog Author', () => {
  beforeEach(() => {
    document.body.innerHTML = BLOCK_HTML;
  });

  afterEach(() => {
    document.head.querySelectorAll('script[type="application/ld+json"]').forEach((s) => s.remove());
  });

  it('adds class to image row', async () => {
    await init(document.querySelector('.blog-author'));
    expect(document.querySelector('.blog-author-image')).to.exist;
    expect(document.querySelector('.blog-author-image picture')).to.exist;
  });

  it('adds name and title classes to text paragraphs', async () => {
    await init(document.querySelector('.blog-author'));
    expect(document.querySelector('.blog-author-name').textContent).to.equal('Jane Doe');
    expect(document.querySelector('.blog-author-title').textContent).to.equal('Senior Director, Marketing');
  });

  it('adds description class to remaining paragraphs', async () => {
    await init(document.querySelector('.blog-author'));
    expect(document.querySelector('.blog-author-description').textContent).to.include('15 years');
  });

  it('adds blog-author-info class to text row', async () => {
    await init(document.querySelector('.blog-author'));
    expect(document.querySelector('.blog-author-info')).to.exist;
  });

  it('adds blog-author-social class to links row', async () => {
    await init(document.querySelector('.blog-author'));
    expect(document.querySelector('.blog-author-social')).to.exist;
  });

  it('adds aria-labels to known social links', async () => {
    await init(document.querySelector('.blog-author'));
    const links = document.querySelectorAll('.blog-author-social a');
    expect(links[0].getAttribute('aria-label')).to.equal('LinkedIn');
    expect(links[1].getAttribute('aria-label')).to.equal('X');
  });

  it('sets target and rel on social links', async () => {
    await init(document.querySelector('.blog-author'));
    const link = document.querySelector('.blog-author-social a');
    expect(link.target).to.equal('_blank');
    expect(link.rel).to.equal('noopener noreferrer');
  });

  it('adds icon spans to social links', async () => {
    await init(document.querySelector('.blog-author'));
    const links = document.querySelectorAll('.blog-author-social a');
    expect(links[0].querySelector('.icon-linkedin')).to.exist;
    expect(links[1].querySelector('.icon-twitter')).to.exist;
  });

  it('decorates subscribe CTA row', async () => {
    await init(document.querySelector('.blog-author'));
    const sub = document.querySelector('.blog-author-subscribe');
    expect(sub).to.exist;
    expect(sub.querySelector('.blog-author-subscribe-btn')).to.exist;
    expect(sub.querySelector('.blog-author-subscribe-btn').href).to.include('subscribe');
  });

  it('injects Person JSON-LD schema', async () => {
    await init(document.querySelector('.blog-author'));
    const schema = getPersonSchema();
    expect(schema).to.exist;
    expect(schema['@type']).to.equal('Person');
    expect(schema.name).to.equal('Jane Doe');
    expect(schema.jobTitle).to.equal('Senior Director, Marketing');
    expect(schema.url).to.be.a('string');
    expect(schema.worksFor.name).to.equal('Adobe');
  });

  it('includes image and sameAs in schema', async () => {
    await init(document.querySelector('.blog-author'));
    const schema = getPersonSchema();
    expect(schema.image).to.include('example.com/author.jpg');
    expect(schema.sameAs).to.include('https://linkedin.com/in/janedoe');
    expect(schema.sameAs).to.include('https://twitter.com/janedoe');
  });

  it('omits schema fields when content is absent', async () => {
    document.body.innerHTML = `
      <div class="blog-author">
        <div><div><p>Jane Doe</p></div></div>
      </div>`;
    await init(document.querySelector('.blog-author'));
    const schema = getPersonSchema();
    expect(schema.image).to.be.undefined;
    expect(schema.sameAs).to.be.undefined;
    expect(schema.jobTitle).to.be.undefined;
  });

  it('merges social links from multiple authored rows into one container', async () => {
    document.body.innerHTML = `
      <div class="blog-author">
        <div><div>
          <a href="https://linkedin.com/in/jane">LinkedIn</a>
          <a href="https://instagram.com/jane">Instagram</a>
        </div></div>
        <div><div>
          <a href="https://twitter.com/jane">Twitter</a>
        </div></div>
      </div>`;
    await init(document.querySelector('.blog-author'));
    const socialContainers = document.querySelectorAll('.blog-author-social');
    expect(socialContainers).to.have.length(1);
    expect(socialContainers[0].querySelectorAll('a')).to.have.length(3);
  });

  it('treats a bio row with a non-social link as subscribe, not social', async () => {
    document.body.innerHTML = `
      <div class="blog-author">
        <div><div>
          <p>Jane Doe</p>
        </div></div>
        <div><div>
          <a href="https://example.com/subscribe">Subscribe</a>
        </div></div>
      </div>`;
    await init(document.querySelector('.blog-author'));
    expect(document.querySelector('.blog-author-subscribe')).to.exist;
    expect(document.querySelector('.blog-author-social')).to.not.exist;
  });

  it('hides unrecognized links in the social row', async () => {
    document.body.innerHTML = `
      <div class="blog-author">
        <div><div>
          <a href="https://linkedin.com/in/jane">LinkedIn</a>
          <a href="https://example.com/jane">Website</a>
        </div></div>
      </div>`;
    await init(document.querySelector('.blog-author'));
    const links = document.querySelectorAll('.blog-author-social a');
    expect(links[0].hidden).to.be.false;
    expect(links[1].hidden).to.be.true;
  });

  it('handles <br>-separated text content instead of <p> tags', async () => {
    document.body.innerHTML = `
      <div class="blog-author">
        <div><div>Shelly Chiang<br>Senior Manager, Adobe for Business<br>Shelly is a senior manager.</div></div>
      </div>`;
    await init(document.querySelector('.blog-author'));
    expect(document.querySelector('.blog-author-name').textContent).to.equal('Shelly Chiang');
    expect(document.querySelector('.blog-author-title').textContent).to.equal('Senior Manager, Adobe for Business');
    expect(document.querySelector('.blog-author-description').textContent).to.include('senior manager');
  });

  it('does not inject schema when name is missing', async () => {
    document.body.innerHTML = '<div class="blog-author"><div><div><picture><img src="x.jpg"></picture></div></div></div>';
    await init(document.querySelector('.blog-author'));
    expect(getPersonSchema()).to.be.null;
  });
});
