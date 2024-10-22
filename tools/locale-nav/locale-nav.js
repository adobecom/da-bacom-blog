/* eslint-disable import/no-unresolved */
import DA_SDK from 'https://da.live/nx/utils/sdk.js';
import './locale-selector.js';

(async function init() {
  const { context, token } = await DA_SDK;
  const { org, repo } = context;
  const path = '/de/blog/drafts/cmillar';

  const opts = { headers: { Authorization: `Bearer ${token}` } };
  const langConfigUrl = `https://admin.da.live/source/${org}/bacom-sandbox/.da/translate.json`;
  const resp = await fetch(langConfigUrl, opts);
  if (!resp.ok) return;
  const { languages } = await resp.json();

  // Merge languages and locales together
  const locales = languages.data.reduce((acc, lang) => {
    // Do not add any langstore paths
    if (!lang.location.startsWith('/langstore') && lang.location !== '/') {
      acc.push(lang.location);
    }

    if (lang.locales) {
      acc.push(...lang.locales.split(', '));
    }
    return acc;
  }, []);

  // Push the root lang to the end for the match
  const langs = [...locales, '/', '/langstore/en'];

  const currLang = langs.find((lang) => path.startsWith(lang));

  const langPathList = langs.map((lang) => {
    const code = lang === '/' ? 'en' : lang.replace('/', '');
    const currLocation = lang === '/' ? '' : lang;
    const locPath = path.replace(currLang, currLocation);
    return {
      code,
      path: locPath,
      edit: `https://da.live/edit#/${org}/${repo}${locPath}`,
      preview: `https://main--${repo}--${org}.hlx.page${path}`,
      live: `https://main--${repo}--${org}.hlx.live${path}`,
    };
  });

  console.log(langPathList);

  // const tagBrowser = document.createElement('da-locale-selector');

  // tagBrowser.repo = context.repo;
  // tagBrowser.org = context.org;
  // tagBrowser.path = context.path;
  // tagBrowser.token = token;

  // document.body.append(tagBrowser);
}());
