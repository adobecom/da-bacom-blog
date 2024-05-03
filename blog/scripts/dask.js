function getSk() { return document.querySelector('helix-sidekick'); }

const DA_LIVE = 'https://da.live';
const AEM_ADMIN = 'https://admin.hlx.page';

const PATH = (() => {
  const { pathname } = window.location;
  return pathname.endsWith('/') ? `${pathname}index` : pathname;
})();

const details = {};

function handleEdit() {
  window.open(`${DA_LIVE}/edit#/${details.org}/${details.repo}${PATH}`, PATH);
}

async function handleAemAction(type) {
  const resp = await fetch(details[type], { method: 'POST' });
  if (!resp.ok) return;
  window.location.href = `https://main--${details.repo}--${details.org}.hlx.${type}${window.location.pathname}`;
}

const getBtn = (() => {
  const div = document.createElement('div');
  div.className = 'plugin';
  const btn = document.createElement('button');
  return (name, label, fn) => {
    const newDiv = div.cloneNode();
    const newBtn = btn.cloneNode();
    newDiv.classList.add(name);
    newBtn.title = label;
    newBtn.innerText = label;
    newBtn.addEventListener('click', fn);
    newDiv.append(newBtn);
    return newDiv;
  };
})();

function setVisibility(sk) {
  const container = sk.shadowRoot.querySelector('.plugin-container');

  const editBtn = getBtn('da-edit', 'Edit', handleEdit);
  container.insertAdjacentElement('afterbegin', editBtn);

  // const prevBtn = getBtn('da-preview', 'Preview', () => { handleAemAction('page') });
  // editBtn.insertAdjacentElement('afterend', prevBtn);

  // const pubBtn = getBtn('da-publish', 'Publish', () => { handleAemAction('live') });
  // prevBtn.insertAdjacentElement('afterend', pubBtn);

  sk.classList.add('da-show');
}

async function setStyles(sk) {
  const resp = await fetch('/blog/styles/dask.css');
  if (!resp.ok) return;
  const text = await resp.text();
  const style = new CSSStyleSheet();
  style.replaceSync(text);
  sk.shadowRoot.adoptedStyleSheets = [style];
}

async function init(sk) {
  sk.addEventListener('statusfetched', ({ detail }) => {
    const [org, repo] = new URL(detail.data.links.live).pathname.split('/').slice(2, 4);
    details.org = org;
    details.repo = repo;
    details.page = detail.data.links.preview;
    details.live = detail.data.links.live;
  });
  await setStyles(sk);
  setTimeout(() => { setVisibility(sk); }, 1500);
}

(async function sidekick() {
  let sk = getSk();
  if (sk) {
    init(sk);
    return;
  }
  document.addEventListener('sidekick-ready', (e) => {
    sk = getSk();
    init(sk);
  });
}());
