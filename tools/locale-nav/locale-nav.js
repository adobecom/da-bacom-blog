/* eslint-disable import/no-unresolved */
import DA_SDK from 'https://da.live/nx/utils/sdk.js';
import './locale-selector.js';

(async function init() {
  const { context, token } = await DA_SDK;

  const tagBrowser = document.createElement('da-locale-selector');

  tagBrowser.repo = context.repo;
  tagBrowser.org = context.org;
  tagBrowser.path = context.path;
  tagBrowser.token = token;

  document.body.append(tagBrowser);
}());
