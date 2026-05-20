/**
 * Autenticação do painel admin (Basic Auth no sessionStorage).
 */
(function (global) {
  const STORAGE_KEY = 'mh_admin_auth';

  function encodeBasicAuth(username, password) {
    const raw = `${username}:${password}`;
    const bytes = new TextEncoder().encode(raw);
    let binary = '';
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary);
  }

  function getAuthHeader() {
    const token = sessionStorage.getItem(STORAGE_KEY);
    return token ? `Basic ${token}` : null;
  }

  function setCredentials(username, password) {
    sessionStorage.setItem(STORAGE_KEY, encodeBasicAuth(username, password));
  }

  function clearCredentials() {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  function isLoggedIn() {
    return Boolean(sessionStorage.getItem(STORAGE_KEY));
  }

  function requireLogin(loginPath) {
    if (!isLoggedIn()) {
      const next = encodeURIComponent(global.location.pathname + global.location.search);
      global.location.replace(`${loginPath}?next=${next}`);
      return false;
    }
    return true;
  }

  global.MooveAdminAuth = {
    STORAGE_KEY,
    encodeBasicAuth,
    getAuthHeader,
    setCredentials,
    clearCredentials,
    isLoggedIn,
    requireLogin,
  };
})(window);
