/* eslint-disable import/no-unresolved */
import DA_SDK from 'https://da.live/nx/utils/sdk.js';
import { DA_ORIGIN } from 'https://da.live/nx/public/utils/constants.js';
import './tag-browser.js';

const ROOT_TAG_PATH = '/content/cq:tags';
const UI_TAG_PATH = '/ui#/aem/aem/tags';
const TAG_EXT = '.1.json';

async function getAemRepo(project, opts) {
  const configUrl = `${DA_ORIGIN}/config/${project.org}/${project.repo}`;
  const resp = await fetch(configUrl, opts);
  if (!resp.ok) return null;
  const json = await resp.json();
  const { value: repoId } = json.data.find((entry) => entry.key === 'aem.repositoryId') || {};
  const { value: namespace } = json.data.find((entry) => entry.key === 'aem.tags.namespace') || {};
  return { aemRepo: repoId, namespace };
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

function showError(message, link = null) {
  const errorMessage = document.createElement(link ? 'a' : 'p');
  errorMessage.textContent = message;
  if (link) {
    errorMessage.href = link;
    errorMessage.target = '_blank';
  }
  const reloadButton = document.createElement('button');
  reloadButton.textContent = 'Reload';
  reloadButton.addEventListener('click', () => window.location.reload());
  document.body.querySelector('main').append(errorMessage, reloadButton);
}

(async function init() {
  const { context, actions, token } = await DA_SDK.catch(() => null);
  if (!context || !actions || !token) {
    showError('Please log in to view tags.');
    return;
  }

  const opts = { headers: { Authorization: `Bearer ${token}` } };
  const aemConfig = await getAemRepo(context, opts).catch(() => {});
  if (!aemConfig || !aemConfig.aemRepo) {
    showError('Failed to retrieve AEM repository.');
    return;
  }

  const tagUrl = aemConfig.namespace ? `https://${aemConfig.aemRepo}${ROOT_TAG_PATH}/${aemConfig.namespace}${TAG_EXT}` : `https://${aemConfig.aemRepo}${ROOT_TAG_PATH}${TAG_EXT}`;
  const rootTags = await getTags(tagUrl, opts).catch(() => null);
  if (!rootTags || rootTags.length === 0) {
    showError('Could not load AEM tags.', `https://${aemConfig.aemRepo}${UI_TAG_PATH}`);
    return;
  }

  const daTagBrowser = document.createElement('da-tag-browser');
  daTagBrowser.rootTags = rootTags;
  daTagBrowser.getTags = async (tag) => getTags(tag.path, opts);
  daTagBrowser.tagValue = aemConfig.namespace ? 'title' : 'path';
  daTagBrowser.actions = actions;
  document.body.querySelector('main').append(daTagBrowser);
}());
