/* eslint-disable import/no-unresolved */
import { LitElement, html, nothing } from 'https://da.live/nx/deps/lit/lit-core.min.js';
import getStyle from 'https://da.live/nx/utils/styles.js';

const style = await getStyle(import.meta.url);

export default class DaLocaleSelector extends LitElement {
  static properties = {
    currLocale: { type: Object },
    altLocales: { type: Array },
    status: { type: Object },
  };

  connectedCallback() {
    super.connectedCallback();
    this.shadowRoot.adoptedStyleSheets = [style];
  }

  handleSearch = (event) => {
    const localeElements = this.shadowRoot.querySelectorAll('.locales li');
    const search = event.target.value.toLowerCase().trim();
    localeElements.forEach((subject) => {
      if (subject.textContent.includes(search)) {
        subject.style.display = '';
      } else {
        subject.style.display = 'none';
      }
    });
  };

  decorateLocale(locale) {
    const { edit = '#', preview = '#', live = '#' } = locale;
    const status = this.status[locale.path] || {};

    return html`
      <div class="detail">
        <span>${locale.code}</span>
        <div class="actions">
          <a class="edit action" href="${edit}" target="_blank" title="Edit">Edit</a>
          <a class="preview action status-${status?.preview}" href="${preview}" target="_blank" title="Preview">Preview</a>
          <a class="live action status-${status?.live}" href="${live}" target="_blank" title="Live">Live</a>
        </div>
      </div>`;
  }

  decorateLocales(locales) {
    const details = locales.map((locale) => {
      const decoratedLocale = this.decorateLocale(locale);
      return html`<li>${decoratedLocale}</li>`;
    });

    return html`<ul class="locales">${details}</ul>`;
  }

  render() {
    return html`
      <div class="locale-selector" role="region" aria-label="Locale Selector">
        <div class="locale-header">
          <span>Current</span>
          <div class="actions">
            <span>Edit</span>
            <span>Preview</span>
            <span>Live</span>
          </div>
        </div>
        <div class="current">
          ${this.currLocale ? this.decorateLocale(this.currLocale) : nothing}
        </div>
        <div class="locale-search-wrapper">
          <input class="locale-search" @keyup="${(e) => this.handleSearch(e)}" placeholder="Locales" aria-label="Search Locales" />
          <div class="locale-search-icon"></div>
        </div>
        <div class="locales">
          ${this.altLocales ? this.decorateLocales(this.altLocales) : nothing}
        </div>
      </div>
    `;
  }
}

customElements.define('da-locale-selector', DaLocaleSelector);
