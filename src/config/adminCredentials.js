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
  return (
    readEnv('ADMIN_PASSWORD') ||
    readEnv('ADMIN_PASS') ||
    readEnv('ADMIN_SECRET')
  );
}

function isAdminConfigured() {
  return getAdminPassword().length > 0;
}

/** Diagnóstico seguro (sem expor a senha) para /api/health */
function getAdminDiagnostics() {
  const raw = process.env.ADMIN_PASSWORD;
  return {
    admin_configured: isAdminConfigured(),
    admin_username_set: Boolean(readEnv('ADMIN_USERNAME')),
    admin_password_key_exists: Object.prototype.hasOwnProperty.call(
      process.env,
      'ADMIN_PASSWORD'
    ),
    admin_password_raw_length: raw == null ? 0 : String(raw).length,
  };
}

module.exports = {
  getAdminUsername,
  getAdminPassword,
  isAdminConfigured,
  getAdminDiagnostics,
};
