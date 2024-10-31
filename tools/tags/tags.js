/* eslint-disable import/no-unresolved */
import DA_SDK from 'https://da.live/nx/utils/sdk.js';
import './tag-browser.js';

const ROOT_TAG_PATH = '/content/cq:tags';
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
  const caasPath = path.split('cq:tags').pop().replace('.1.json', '').slice(1);
  if (caasPath) console.log(caasPath);
  const resp = await fetch(path, opts);
  if (!resp.ok) return null;
  const json = await resp.json();
  const tags = Object.keys(json).reduce((acc, key) => {
    if (json[key]['jcr:primaryType'] === 'cq:Tag') {
      acc.push({
        path: `${path.replace(TAG_EXT, '')}/${key}${TAG_EXT}`,
        name: key,
        title: json[key]['jcr:title'] || key,
        details: json[key],
      });
    }
    return acc;
  }, []);
  setTimeout(() => {
    window.scrollTo(document.body.scrollWidth, 0);
  }, 100);

  return { caasPath, tags };
}

(async function init() {
  const { context, actions, token } = await DA_SDK;
  if (!context || !token) return;
  const opts = { headers: { Authorization: `Bearer ${token}` } };
  const daTagBrowser = document.createElement('da-tag-browser');
  daTagBrowser.actions = actions;
  document.body.querySelector('main').append(daTagBrowser);

  const aemRepo = await getAemRepo(context, opts);
  if (!aemRepo) return;

  const { caasPath, tags } = await getTags(`https://${aemRepo}${ROOT_TAG_PATH}${TAG_EXT}`, opts);
  daTagBrowser.caasPath = caasPath;
  daTagBrowser.tags = tags;
}());
