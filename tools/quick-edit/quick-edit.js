import { loadPage } from '../../blog/scripts/scripts.js';

// AEM ref/branch names are limited to alphanumerics and hyphens. Rejecting
// anything else stops the `quick-edit` param from smuggling a foreign host
// (or a path on a trusted host) into the module origin (VULN-36795).
const REF_PATTERN = /^[a-zA-Z0-9-]+$/;

export function resolveOrigin(ref) {
  if (!ref || ref === 'on') return 'https://da.live';
  if (ref === 'local') return 'http://localhost:6456';
  if (REF_PATTERN.test(ref)) return `https://${ref}--da-nx--adobe.aem.live`;
  return null;
}

async function loadModule(origin, payload) {
  const { default: loadQuickEdit } = await import(`${origin}/nx/public/plugins/quick-edit/quick-edit.js`);
  loadQuickEdit(payload, loadPage);
}

export default function init(payload) {
  const { search } = window.location;
  const ref = new URLSearchParams(search).get('quick-edit');
  const origin = resolveOrigin(ref);
  if (!origin) return;
  loadModule(origin, payload);
}
