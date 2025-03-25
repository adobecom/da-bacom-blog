// eslint-disable-next-line import/no-unresolved
import DA_SDK from 'https://da.live/nx/utils/sdk.js';

(async () => {
  try {
    const { context, token } = await DA_SDK;
    const { repo, path } = context;
    const redirectPath = path.split('/').pop();
    window.location.replace(
      `https://milostudio--milo--adobecom.aem.page/tools/da-apps/ms-apps.html?path=${redirectPath}&tenant=${repo}&token=${token}`
    );
  } catch (error) {
    console.error('Error initializing DA_SDK:', error);
  }
})();
