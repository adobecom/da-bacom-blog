/* eslint-disable import/no-unresolved */
import { LitElement, html, nothing } from 'https://da.live/nx/deps/lit/lit-core.min.js';
import getStyle from 'https://da.live/nx/utils/styles.js';

const style = await getStyle(import.meta.url);

class DaTagBrowser extends LitElement {
  static properties = {
    caasPath: { type: String },
    tags: { type: Array },
    actions: { type: Object },
  };

  constructor() {
    super();
    this.tags = [];
  }

  connectedCallback() {
    super.connectedCallback();
    this.shadowRoot.adoptedStyleSheets = [style];
  }

  handleTagClick(tag, idx) {
    this.tags = this.tags.toSpliced(idx + 1);
    this.getTags(tag.path);
  }

  handleTagInsert(e, title) {
    this.actions.sendText(`${this.caasPath}/${title}`);
  }

  renderTagGroup(group, idx) {
    return html`
      <ul class="da-tag-group-list">
        ${group.map((tag) => html`
          <li class="da-tag-group">
            <span @click=${() => this.handleTagClick(tag, idx)}>${tag.title}</span>
            <button @click=${(e) => { this.handleTagInsert(e, tag.title); }}>→</button>
          </li>
        `)}
      </ul>
    `;
  }

  render() {
    if (this.tags.length === 0) return nothing;
    return html`
      <ul class="da-tag-groups">
        ${this.tags.map((group, idx) => html`
          <li class="da-tag-group-column">
            ${this.renderTagGroup(group, idx)}
          </li>
        `)}
      </ul>
    `;
  }
}

customElements.define('da-tag-browser', DaTagBrowser);
