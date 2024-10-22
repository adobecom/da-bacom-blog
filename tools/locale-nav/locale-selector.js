/* eslint-disable import/no-unresolved */
/* eslint-disable no-underscore-dangle */
import { LitElement, html, nothing } from 'https://da.live/nx/deps/lit/lit-core.min.js';
import getStyle from 'https://da.live/nx/utils/styles.js';
import { LIBS } from '../../blog/scripts/scripts.js';

const { getConfig, getLocale } = await import(`${LIBS}/utils/utils.js`);
const style = await getStyle(import.meta.url);
const ADMIN_STATUS = 'https://admin.hlx.page/status/';
const ADMIN_LIST = 'https://admin.da.live/list/';
const EDIT_URL = 'https://da.live/edit#/';

export default class DaLocaleSelector extends LitElement {
  static properties = {
    repo: { type: String },
    org: { type: String },
    path: { type: String },
    token: { type: String },
    _locale: { type: Object },
    _locales: { type: Object },
    _detailsMap: { type: Object },
  };

  constructor() {
    super();
    this._locale = {};
    this._locales = {};
    this.detailsMap = {};
  }

  connectedCallback() {
    super.connectedCallback();
    this.shadowRoot.adoptedStyleSheets = [style];
    const { locales } = getConfig();
    this._locale = getLocale(locales, this.path);
    this._locales = locales;
  }

  async fetchList(dir) {
    try {
      const opts = this.token ? { headers: { Authorization: `Bearer ${this.token}` } } : {};
      const url = `${ADMIN_LIST}${this.org}/${this.repo}${dir}`;
      const res = await fetch(url, opts);
      if (!res.ok) { throw new Error(res.status); }
      return res.json();
    } catch (e) {
      return { error: e.message };
    }
  }

  async fetchStatus(path) {
    try {
      const url = `${ADMIN_STATUS}${this.org}/${this.repo}/main${path}`;
      const res = await fetch(url);
      if (!res.ok) { throw new Error(res.status); }
      return res.json();
    } catch (e) {
      return { error: e.message };
    }
  }

  async fetchDetails(path) {
    try {
      const parentDir = path.split('/').slice(0, -1).join('/');
      const [details, list] = await Promise.all([
        this.fetchStatus(path),
        this.fetchList(parentDir),
      ]);
      const editURL = `${EDIT_URL}${this.org}/${this.repo}${path}`;
      const htmlPath = `/${this.org}/${this.repo}${path}.html`;
      const editStatus = list.find((item) => item.path === htmlPath) ? 200 : 404;

      this.detailsMap[path] = {
        loaded: true,
        edit: { status: editStatus, url: editURL },
        preview: { status: details.preview.status, url: details.preview.url },
        live: { status: details.live.status, url: details.live.url },
      };
    } catch (e) {
      this.detailsMap[path] = {
        loaded: true,
        edit: { status: 404 },
        preview: { status: 404 },
        live: { status: 404 },
      };
    } finally {
      this.requestUpdate();
    }
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

  localizePath(prefix) {
    const basePrefix = `${this._locale.prefix}/`;
    const currentPrefix = `/${prefix}/`.replaceAll('//', '/');
    let localePath = this.path;

    if (prefix === basePrefix) return localePath;

    localePath = localePath.replace(basePrefix, currentPrefix);

    if (localePath.startsWith('/langstore/')) {
      localePath = localePath.replace('/langstore/', currentPrefix);
    }
    return localePath;
  }

  decorateLocale(prefix) {
    const localePath = this.localizePath(prefix);

    let name = prefix.replace('/', '') || 'us';
    if (name === 'langstore') name = 'langstore/en';

    if (!this.detailsMap[localePath]) {
      this.detailsMap[localePath] = { loaded: false };
      this.fetchDetails(localePath);
    }

    const details = this.detailsMap[localePath];

    return html`
      <div class="detail">
        <span>${name}</span>
        ${details.loaded ? html`<div class="actions">
          <a class="edit action status-${details.edit?.status}" href="${details.edit?.url ? details.edit.url : '#'}" target="_blank" title="Edit">Edit</a>
          <a class="preview action status-${details.preview?.status}" href="${details.preview?.url ? details.preview.url : '#'}" target="_blank" title="Preview">Preview</a>
          <a class="live action status-${details.live?.status}" href="${details.live?.url ? details.live.url : '#'}" target="_blank" title="Live">Live</a>
        </div>` : nothing}
      </div>`;
  }

  decorateLocales() {
    const details = Object.keys(this._locales).map((prefix) => {
      if (prefix === this._locale.prefix) return nothing;
      const decoratedLocale = this.decorateLocale(prefix);
      return html`<li>${decoratedLocale}</li>`;
    });

    return html`<ul class="locales">${details}</ul>`;
  }

  render() {
    if (!this._locales) return nothing;

    return html`
      <div class="locale-selector">
        <div class="locale-header">
          <span>Current</span>
          <div class="actions">
            <span>Edit</span>
            <span>Preview</span>
            <span>Live</span>
          </div>
        </div>
        <div class="current">
          ${this.decorateLocale(this._locale.prefix)}
        </div>
        <div class="locale-search-wrapper">
          <input class="locale-search" @keyup="${(e) => this.handleSearch(e)}"  placeholder="Locales" />
          <div class="locale-search-icon"></div>
        </div>
        <div class="locales">
          ${this.decorateLocales()}
        </div>
      </div>
    `;
  }
}

customElements.define('da-locale-selector', DaLocaleSelector);
