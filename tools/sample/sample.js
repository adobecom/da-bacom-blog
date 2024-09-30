// Import SDK
import DA_SDK from 'https://da.live/nx/utils/sdk.js';
import { crawl } from 'https://da.live/nx/public/utils/tree.js';

(async function init() {
  const { context, token, actions } = await DA_SDK;
  console.log(context, token, actions);
  const getCrawled = crawl('/adobecom/da-bacom-blog');
  const report = setInterval(() => {
    const { files, complete } = getCrawled();
    if (files.length > 0) {
      files.forEach((file) => {
        document.body.insertAdjacentHTML('afterbegin', `<p>${file.path}</p>`);
      });
    }
    if (complete) clearInterval(report);
  }, 200);
}());
