/**
 * Lê credenciais do admin a partir das variáveis de ambiente.
 * Remove aspas extras e espaços (comum ao colar no hPanel).
 */
function readEnv(name) {
  const raw = process.env[name];
  if (raw == null || raw === '') return '';

  let value = String(raw).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return value;
}

function getAdminUsername() {
  return readEnv('ADMIN_USERNAME') || 'admin';
}

function getAdminPassword() {
  return readEnv('ADMIN_PASSWORD');
}

function isAdminConfigured() {
  return getAdminPassword().length > 0;
}

module.exports = {
  getAdminUsername,
  getAdminPassword,
  isAdminConfigured,
};
