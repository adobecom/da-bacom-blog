function getOpts(clientid, token, body, method = 'GET') {
  return {
    body,
    method,
    headers: {
      // 'Content-Type': contentType,
      'X-Glaas-Authtoken': token,
      'X-Glaas-Clientid': clientid,
    },
  };
}

export async function checkSession({ origin, clientid, token }) {
  const opts = getOpts(clientid, token, 'POST');
  try {
    const resp = await fetch(`${origin}/api/common/v1.0/checkSession`, opts);
    return resp.json();
  } catch {
    return { error: 'Error checking session.' };
  }
}

export async function createTask({ origin, clientid, token, name, targetLocales }) {
  const body = {
    name,
    targetLocales,
    workflowName: 'Human Translation',
    contentSource: 'Adhoc',
    config: [
      {
        value: 'https://translate.da.live',
        key: 'preview-server',
      },
    ],
  };

  const opts = getOpts(clientid, token, body, 'POST');

  try {
    const resp = await fetch(`${origin}/api/l10n/v1.1/tasks/WCMS/WCMS/create`, opts);
    return resp.json();
  } catch {
    return { error: 'Error creating task.' };
  }
}

export async function getTask({ origin, clientid, token }, path) {
  const opts = getOpts(clientid, token);
  try {
    const resp = await fetch(`${origin}/api/l10n/v1.1/tasks/WCMS_FASTLANE/FASTLANE${path}`, opts);
    return resp.json();
  } catch {
    return { error: 'Error getting task.' };
  }
}

export async function addAssets({
  origin, clientid, token, name, targetLocales, file,
}) {
  const body = new FormData();
  body.append('file', file.data, 'test-page.html');
  body.append('asset', new Blob([
    JSON.stringify({
      assetName: 'test-page.html',
      metadata: { 'source-preview-url': `${'test-page.html'}?taskName=${name}&locale=${targetLocales[0]}` },
    })], { type: 'application/json; charset=utf-8' }), '_asset_metadata_');

  const opts = getOpts(clientid, token, body, 'multipart/form-data', 'POST');
  const lang = targetLocales[0];
  const url = `${origin}/api/l10n/v1.1/tasks/WCMS/WCMS/${name}/assets?targetLanguages=${lang}`;
  try {
    const resp = await fetch(url, opts);
    return resp.json();
  } catch {
    return { error: 'Error adding asset.' };
  }
}

export async function updateStatus({ origin, clientid, token, name, targetLocales }) {
  const body = new FormData();
  body.append('newStatus', 'CREATED');

  const opts = getOpts(clientid, token, body, 'POST');

  const lang = targetLocales[0];
  const url = `${origin}/api/l10n/v1.1/tasks/WCMS/WCMS/${name}/${lang}/updateStatus`;
  try {
    const resp = await fetch(url, opts);
    return resp.json();
  } catch {
    return { error: 'Error updating status.' };
  }
}
