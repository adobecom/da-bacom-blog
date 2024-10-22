// eslint-disable-next-line import/no-unresolved
import DA_SDK from 'https://da.live/nx/utils/sdk.js';

import { getConfig } from './da.js';
import { handleGlaasPopup, getGlaasToken } from './glaas/auth.js';
import { addAssets, checkSession, createTask, getTask, updateStatus } from './glaas/api.js';

const MOCK_PAGE = `
  <body>
    <header></header>
    <main><div><h1>Hello World</h1></div></main>
    <footer></footer>
  </body>`;

(async function init() {
  // Handle the popup callback
  handleGlaasPopup();

  const { context, token: imstoken } = await DA_SDK;
  const { org, repo } = context;

  const { clientid, origin } = await getConfig(imstoken, org, repo);
  if (!(clientid || origin)) return;

  const glaasConf = { origin, clientid };
  glaasConf.token = await getGlaasToken(clientid, origin);

  const check = checkSession(glaasConf);
  if (check.error) return;

  const taskConf = { ...glaasConf, name: 'da-test-de-1234', targetLocales: ['de'] };
  getTask(taskConf);

  createTask(taskConf);

  const data = new Blob([MOCK_PAGE], { type: 'text/html' });
  const file = { data, name: 'demo-page.html' };

  const assetConf = { ...taskConf, file };
  addAssets(assetConf);

  const statusConf = { ...glaasConf, name: 'da-test-de-123456', targetLocales: ['de'] };
  updateStatus(statusConf);
}());
