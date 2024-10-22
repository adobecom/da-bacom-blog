import sinon from 'sinon';

const ogFetch = window.fetch;

// https://admin.hlx.page/status/adobecom/da-bacom-blog/main/blog/index
const getStatus = (path) => {
  const resource = path.split('/').slice(5, -1).join('/');
  return {
    live: { status: 200, url: `https://main--da-bacom-blog--adobecom.hlx.live/${resource}/` },
    preview: { status: 200, url: `https://main--da-bacom-blog--adobecom.hlx.page/${resource}/` },
  };
};

// https://admin.da.live/list/adobecom/da-bacom-blog/blog
const getList = (path) => {
  const resource = path.split('/').slice(2).join('/');
  return [{
    path: `/${resource}/index.html`,
    name: 'index',
    ext: 'html',
    lastModified: 1728330007018,
  }];
};

export function mockFetch() {
  sinon.stub(window, 'fetch');
  fetch.callsFake((fetchUrl) => {
    const url = new URL(fetchUrl);
    if (url.pathname.includes('invalid')) {
      return Promise.resolve({ ok: false, json: () => { } });
    }
    if (url.pathname.includes('status')) {
      return Promise.resolve({ ok: true, json: () => getStatus(url.pathname) });
    }
    if (url.pathname.includes('list')) {
      return Promise.resolve({ ok: true, json: () => getList(url.pathname) });
    }
    if (url.hostname === 'localhost') {
      return ogFetch(fetchUrl);
    }
    return Promise.resolve({ ok: false, json: () => { } });
  });
}

export function restoreFetch() {
  window.fetch = ogFetch;
}
