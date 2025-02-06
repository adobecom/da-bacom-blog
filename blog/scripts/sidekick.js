const TEMP_PROJ_CONFIG = {
  host: 'business.adobe.com',
  project: 'BACOM-BLOG',
  ref: 'stage',
  repo: 'da-bacom-blog',
  owner: 'adobecom',
};

export default function init({ loadScript, loadStyle }) {
  // manifest v3
  const sendToCaasListener = async (e) => {
    const { host, project, ref: branch, repo, owner } = e.detail?.data.config || TEMP_PROJ_CONFIG;
    // eslint-disable-next-line import/no-unresolved
    const { sendToCaaS } = await import('https://milo.adobe.com/tools/send-to-caas/send-to-caas.js');

    sendToCaaS({ host, project, branch, repo, owner }, loadScript, loadStyle);
  };

  const sk = document.querySelector('aem-sidekick, helix-sidekick');

  // Add plugin listeners here
  sk.addEventListener('custom:dx-send-to-caas', sendToCaasListener);
}
