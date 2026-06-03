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

  it('adds class to image row', () => {
    init(document.querySelector('.blog-author'));
    expect(document.querySelector('.blog-author-image')).to.exist;
    expect(document.querySelector('.blog-author-image picture')).to.exist;
  });

  it('adds name and title classes to text paragraphs', () => {
    init(document.querySelector('.blog-author'));
    expect(document.querySelector('.blog-author-name').textContent).to.equal('Jane Doe');
    expect(document.querySelector('.blog-author-title').textContent).to.equal('Senior Director, Marketing');
  });

  it('adds description class to remaining paragraphs', () => {
    init(document.querySelector('.blog-author'));
    expect(document.querySelector('.blog-author-description').textContent).to.include('15 years');
  });

  it('adds blog-author-info class to text row', () => {
    init(document.querySelector('.blog-author'));
    expect(document.querySelector('.blog-author-info')).to.exist;
  });

  it('adds blog-author-social class to links row', () => {
    init(document.querySelector('.blog-author'));
    expect(document.querySelector('.blog-author-social')).to.exist;
  });

  it('adds aria-labels to known social links', () => {
    init(document.querySelector('.blog-author'));
    const links = document.querySelectorAll('.blog-author-social a');
    expect(links[0].getAttribute('aria-label')).to.equal('LinkedIn');
    expect(links[1].getAttribute('aria-label')).to.equal('X');
  });

  it('sets target and rel on social links', () => {
    init(document.querySelector('.blog-author'));
    const link = document.querySelector('.blog-author-social a');
    expect(link.target).to.equal('_blank');
    expect(link.rel).to.equal('noopener noreferrer');
  });

  it('adds icon spans to social links', () => {
    init(document.querySelector('.blog-author'));
    const links = document.querySelectorAll('.blog-author-social a');
    expect(links[0].querySelector('.icon-linkedin')).to.exist;
    expect(links[1].querySelector('.icon-twitter')).to.exist;
  });

  it('injects Person JSON-LD schema', () => {
    init(document.querySelector('.blog-author'));
    const schema = getPersonSchema();
    expect(schema).to.exist;
    expect(schema['@type']).to.equal('Person');
    expect(schema.name).to.equal('Jane Doe');
    expect(schema.jobTitle).to.equal('Senior Director, Marketing');
    expect(schema.url).to.be.a('string');
    expect(schema.worksFor.name).to.equal('Adobe');
  });

  it('includes image and sameAs in schema', () => {
    init(document.querySelector('.blog-author'));
    const schema = getPersonSchema();
    expect(schema.image).to.include('example.com/author.jpg');
    expect(schema.sameAs).to.include('https://linkedin.com/in/janedoe');
    expect(schema.sameAs).to.include('https://twitter.com/janedoe');
  });

  it('omits schema fields when content is absent', () => {
    document.body.innerHTML = `
      <div class="blog-author">
        <div><div><p>Jane Doe</p></div></div>
      </div>`;
    init(document.querySelector('.blog-author'));
    const schema = getPersonSchema();
    expect(schema.image).to.be.undefined;
    expect(schema.sameAs).to.be.undefined;
    expect(schema.jobTitle).to.be.undefined;
  });

  it('treats a bio row with a non-social link as text, not social', () => {
    document.body.innerHTML = `
      <div class="blog-author">
        <div><div>
          <p>Jane Doe</p>
          <p>Director at <a href="https://example.com">Example Co</a></p>
        </div></div>
      </div>`;
    init(document.querySelector('.blog-author'));
    expect(document.querySelector('.blog-author-info')).to.exist;
    expect(document.querySelector('.blog-author-social')).to.not.exist;
  });

  it('hides unrecognized links in the social row', () => {
    document.body.innerHTML = `
      <div class="blog-author">
        <div><div>
          <a href="https://linkedin.com/in/jane">LinkedIn</a>
          <a href="https://example.com/jane">Website</a>
        </div></div>
      </div>`;
    init(document.querySelector('.blog-author'));
    const links = document.querySelectorAll('.blog-author-social a');
    expect(links[0].hidden).to.be.false;
    expect(links[1].hidden).to.be.true;
  });

  it('does not inject schema when name is missing', () => {
    document.body.innerHTML = '<div class="blog-author"><div><div><picture><img src="x.jpg"></picture></div></div></div>';
    init(document.querySelector('.blog-author'));
    expect(getPersonSchema()).to.be.null;
  });
});
