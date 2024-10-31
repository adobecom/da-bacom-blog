/* eslint-disable import/no-unresolved */
import DA_SDK from 'https://da.live/nx/utils/sdk.js';
import './tag-browser.js';

const ROOT_TAG_PATH = '/content/cq:tags';
const UI_TAG_PATH = '/ui#/aem/aem/tags';
const TAG_EXT = '.1.json';

async function getAemRepo(project, opts) {
  const configUrl = `https://admin.da.live/config/${project.org}/${project.repo}`;
  const resp = await fetch(configUrl, opts);
  if (!resp.ok) return null;
  const json = await resp.json();
  const { value: repoId } = json.data.find((entry) => entry.key === 'aem.repositoryId');
  if (repoId) return repoId;
  return null;
}

async function getTags(path, opts) {
  const activeTag = path.split('cq:tags').pop().replace('.1.json', '').slice(1);
  const resp = await fetch(path, opts);
  if (!resp.ok) return null;
  const json = await resp.json();
  const tags = Object.keys(json).reduce((acc, key) => {
    if (json[key]['jcr:primaryType'] === 'cq:Tag') {
      acc.push({
        path: `${path.replace(TAG_EXT, '')}/${key}${TAG_EXT}`,
        activeTag,
        name: key,
        title: json[key]['jcr:title'] || key,
        details: json[key],
      });
    }
    return acc;
  }, []);

  return tags;
}

(async function init() {
  const { context, actions, token } = await DA_SDK;
  if (!context || !token) return;
  const opts = { headers: { Authorization: `Bearer ${token}` } };
  const aemRepo = await getAemRepo(context, opts);
  if (!aemRepo) return;

  const rootTags = await getTags(`https://${aemRepo}${ROOT_TAG_PATH}${TAG_EXT}`, opts);

  if (!rootTags || rootTags.length === 0) {
    const login = document.createElement('a');
    login.textContent = 'Please login to AEM to view tags';
    login.href = `https://${aemRepo}${UI_TAG_PATH}`;
    login.target = '_blank';
    document.body.querySelector('main').append(login);
    return;
  }

  const daTagBrowser = document.createElement('da-tag-browser');
  daTagBrowser.rootTags = rootTags;
  daTagBrowser.getTags = async (tag) => getTags(tag.path, opts);
  daTagBrowser.actions = actions;
  document.body.querySelector('main').append(daTagBrowser);
}());
