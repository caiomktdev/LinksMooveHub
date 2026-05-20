const fs = require('fs');
const path = require('path');

/** @type {{ username: string, password: string } | null} */
let fileCredentials = null;
/** @type {string | null} */
let fileCredentialsPath = null;

function projectRoot() {
  return path.join(__dirname, '../..');
}

function getSecretsFilePaths() {
  const root = projectRoot();
  return [
    path.join(process.cwd(), 'admin.secrets.json'),
    path.join(root, 'admin.secrets.json'),
    path.join(process.cwd(), 'data', 'admin.secrets.json'),
    path.join(root, 'data', 'admin.secrets.json'),
  ];
}

function getEnvFilePaths() {
  const root = projectRoot();
  return [
    path.join(process.cwd(), '.env'),
    path.join(root, '.env'),
  ];
}

/**
 * Carrega admin.secrets.json e .env do disco (Hostinger muitas vezes não injeta env do hPanel).
 */
function loadAdminFromFiles() {
  for (const envPath of getEnvFilePaths()) {
    if (fs.existsSync(envPath)) {
      // eslint-disable-next-line global-require
      require('dotenv').config({ path: envPath, override: true });
      console.log('[admin] .env carregado:', envPath);
    }
  }

  for (const filePath of getSecretsFilePaths()) {
    if (!fs.existsSync(filePath)) continue;

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const username = data.username || data.ADMIN_USERNAME;
      const password = data.password || data.ADMIN_PASSWORD;

      if (username && password) {
        fileCredentials = {
          username: String(username).trim(),
          password: String(password),
        };
        fileCredentialsPath = filePath;
        console.log('[admin] credenciais carregadas de:', filePath);
        return;
      }
    } catch (err) {
      console.warn('[admin] falha ao ler', filePath, err.message);
    }
  }
}

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
  if (fileCredentials?.username) return fileCredentials.username;
  return readEnv('ADMIN_USERNAME') || 'admin';
}

function getAdminPassword() {
  if (fileCredentials?.password) return fileCredentials.password;
  return (
    readEnv('ADMIN_PASSWORD') ||
    readEnv('ADMIN_PASS') ||
    readEnv('ADMIN_SECRET')
  );
}

function isAdminConfigured() {
  return getAdminPassword().length > 0;
}

function getConfigSource() {
  if (fileCredentials) return 'file';
  if (readEnv('ADMIN_PASSWORD')) return 'env';
  return 'none';
}

/** Diagnóstico seguro para /api/health */
function getAdminDiagnostics() {
  const raw = process.env.ADMIN_PASSWORD;
  const paths = getSecretsFilePaths();

  return {
    admin_configured: isAdminConfigured(),
    admin_config_source: getConfigSource(),
    admin_secrets_file_loaded: Boolean(fileCredentialsPath),
    admin_username_set: Boolean(getAdminUsername() && getAdminUsername() !== 'admin') || Boolean(fileCredentials),
    admin_password_key_exists: Object.prototype.hasOwnProperty.call(
      process.env,
      'ADMIN_PASSWORD'
    ),
    admin_password_raw_length: raw == null ? 0 : String(raw).length,
    cwd: process.cwd(),
    secrets_paths: paths.map((p) => ({
      path: p,
      exists: fs.existsSync(p),
    })),
  };
}

module.exports = {
  loadAdminFromFiles,
  getAdminUsername,
  getAdminPassword,
  isAdminConfigured,
  getAdminDiagnostics,
  getSecretsFilePaths,
};
