// DA Related
const DA_ORIGIN = 'https://admin.da.live';
const LOC_CONFIG = '/.da/translate.json';

// eslint-disable-next-line import/prefer-default-export
export async function getConfig(token, org, repo) {
  const opts = { headers: { Authorization: `Bearer ${token}` } };
  const resp = await fetch(`${DA_ORIGIN}/source/${org}/${repo}${LOC_CONFIG}`, opts);
  const json = await resp.json();

  return json.config.data.reduce((acc, row) => {
    if (row.key === 'translation.stage.origin') acc.origin = row.value;
    if (row.key === 'translation.stage.clientid') acc.clientid = row.value;
    return acc;
  }, {});
}
