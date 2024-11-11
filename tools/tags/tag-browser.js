/* eslint-disable no-underscore-dangle */
/* eslint-disable import/no-unresolved */
import { LitElement, html, nothing } from 'https://da.live/nx/deps/lit/lit-core.min.js';
import getStyle from 'https://da.live/nx/utils/styles.js';

const style = await getStyle(import.meta.url);

class DaTagBrowser extends LitElement {
  static properties = {
    rootTags: { type: Array },
    actions: { type: Object },
    getTags: { type: Function },
    _tags: { state: true },
    _activeTag: { state: true },
  };

  constructor() {
    super();
    this._tags = [];
    this._activeTag = '';
  }

  connectedCallback() {
    super.connectedCallback();
    this.shadowRoot.adoptedStyleSheets = [style];
  }

  updated(changedProperties) {
    if (changedProperties.has('rootTags')) {
      this._tags = [this.rootTags];
      this._activeTag = '';
    }

    setTimeout(() => {
      const groups = this.renderRoot.querySelector('.da-tag-groups');
      const firstTag = groups?.lastElementChild?.querySelector('.da-tag-title');
      if (firstTag) firstTag.focus();
      if (groups) groups.scrollTo({ left: groups.scrollWidth, behavior: 'smooth' });
    }, 100);
  }

  async handleTagClick(tag, idx) {
    this._activeTag = tag.activeTag ? `${tag.activeTag}/${tag.name}` : tag.name;
    if (!this.getTags) return;
    const newTags = await this.getTags(tag);
    if (!newTags || newTags.length === 0) return;
    this._tags = [...this._tags.toSpliced(idx + 1), newTags];
  }

  handleTagInsert(tag, idx) {
    const tagRoot = this._activeTag.split('/')[0];
    const tagPath = this._activeTag.split('/').slice(1, idx).join('/');
    this.actions.sendText(`${tagRoot}:${tagPath}/${tag.name}`);
  }

  handleBackClick() {
    if (this._tags.length > 0) {
      this._tags = this._tags.slice(0, -1);
      this._activeTag = this._activeTag.split('/').slice(0, this._tags.length - 1).join('/');
    }
  }

  renderTagPath() {
    return html`
      <section class="da-tag-path">
        <div class="da-path-details">
          <span class="da-tag-title">Path: ${this._activeTag}</span>
          ${this._activeTag ? html`<button @click=${this.handleBackClick}>←</button>` : nothing}
        </div>
      </section>
    `;
  }

  renderTag(tag, idx) {
    const active = this._activeTag.split('/')[idx] === tag.name;
    return html`
      <li class="da-tag-group">
        <div class="da-tag-details">
          <button 
            class="da-tag-title ${active ? 'active' : ''}" 
            @click=${() => this.handleTagClick(tag, idx)}>
            ${tag.title}
          </button>
          <button 
            class="da-tag-insert"
            @click=${() => this.handleTagInsert(tag, idx)} 
            aria-label="Insert tag ${tag.title}">
            →
          </button>
        </div>
      </li>
    `;
  }

  renderTagGroup(group, idx) {
    return html`
      <ul class="da-tag-group-list">
        ${group.map((tag) => this.renderTag(tag, idx))}
      </ul>
    `;
  }

  render() {
    if (this._tags.length === 0) return nothing;
    return html`
      <div class="da-tag-browser">
        ${this.renderTagPath()}
        <ul class="da-tag-groups">
          ${this._tags.map((group, idx) => html`
            <li class="da-tag-group-column">
              ${this.renderTagGroup(group, idx)}
            </li>
          `)}
        </ul>
      </div>
    `;
  }
}

customElements.define('da-tag-browser', DaTagBrowser);
