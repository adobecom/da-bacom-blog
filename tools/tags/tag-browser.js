/* eslint-disable no-underscore-dangle, import/no-unresolved */
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

    if (changedProperties.has('_tags')) {
      setTimeout(() => {
        const groups = this.renderRoot.querySelector('.tag-groups');
        if (!groups) return;
        const firstTag = groups.lastElementChild?.querySelector('.tag-title');
        firstTag?.focus();
        groups.scrollTo({ left: groups.scrollWidth, behavior: 'smooth' });
      }, 100);
    }
  }

  setTagPath(tag) {
    const tagSegments = [...(tag.activeTag ? tag.activeTag.split(/:|\//) : []), tag.name].filter(Boolean);
    this._activeTag = tagSegments.join(tagSegments.length > 2 ? '/' : ':').replace('/', ':');
  }

  async handleTagClick(tag, idx) {
    this.setTagPath(tag);
    if (!this.getTags) return;
    const newTags = await this.getTags(tag);
    if (!newTags || newTags.length === 0) return;
    this._tags = [...this._tags.toSpliced(idx + 1), newTags];
  }

  handleTagInsert(tag) {
    this.setTagPath(tag);
    this.actions.sendText(this._activeTag);
  }

  handleBackClick() {
    if (this._tags.length === 0) return;
    this._tags = this._tags.slice(0, -1);
    this._activeTag = this._activeTag.split(/:|\//).slice(0, this._tags.length - 1).join('/');
  }

  renderTagPath() {
    return html`
      <section class="tag-path">
        <div class="path-details">
          <span class="tag-title">Tag: ${this._activeTag}</span>
          ${(this._tags.length > 1) ? html`<button @click=${this.handleBackClick}>←</button>` : nothing}
        </div>
      </section>
    `;
  }

  renderTag(tag, idx) {
    const active = this._activeTag.split(/:|\//)[idx] === tag.name;
    return html`
      <li class="tag-group">
        <div class="tag-details">
          <button 
            class="tag-title ${active ? 'active' : ''}" 
            @click=${() => this.handleTagClick(tag, idx)}>
            ${tag.title}
          </button>
          <button 
            class="tag-insert"
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
      <ul class="tag-group-list">
        ${group.map((tag) => this.renderTag(tag, idx))}
      </ul>
    `;
  }

  render() {
    if (this._tags.length === 0) return nothing;
    return html`
      <div class="tag-browser">
        ${this.renderTagPath()}
        <ul class="tag-groups">
          ${this._tags.map((group, idx) => html`
            <li class="tag-group-column">
              ${this.renderTagGroup(group, idx)}
            </li>
          `)}
        </ul>
      </div>
    `;
  }
}

customElements.define('da-tag-browser', DaTagBrowser);
