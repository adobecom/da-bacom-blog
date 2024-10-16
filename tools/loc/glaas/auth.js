function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function setCookie(name, value) {
  const expires = Date.now() + (1000 * 36000);
  document.cookie = `${name}=${value}; Path=/; Expires=${new Date(expires).toUTCString()}; SameSite=None; Secure`;
}

function getAuthUri(clientid, origin) {
  const redirectUri = encodeURI(`${window.location.origin}/tools/loc.html`);
  const endpoint = `${origin}/api/common/sweb/oauth/authorize`;
  const params = `?response_type=token&state=home&client_id=${clientid}&redirect_uri=${redirectUri}`;
  return `${endpoint}${params}`;
}

export function deleteCookie(name) {
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure`;
}

export function handleGlaasPopup() {
  const { hash } = window.location;
  if (hash) {
    const token = hash.slice(1).split('&')[0].split('access_token=')[1];
    if (token) {
      setCookie('glaastoken', token);
      window.close();
    }
  }
}

export async function getGlaasToken(clientid, origin) {
  return new Promise((resolve) => {
    let token = getCookie('glaastoken');
    if (token) {
      resolve(token);
      return;
    }

    const url = getAuthUri(clientid, origin);
    window.open(url, 'Connect to GLaaS', 'width=500,height=800');

    const interval = setInterval(() => {
      token = getCookie('glaastoken');
      if (token) {
        clearInterval(interval);
        resolve(token);
      }
    }, 500);
  });
}
