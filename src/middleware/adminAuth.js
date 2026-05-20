const crypto = require('crypto');

/**
 * HTTP Basic Auth para dashboard e API de analytics.
 * Credenciais: ADMIN_USERNAME + ADMIN_PASSWORD (.env)
 */
function adminAuth(req, res, next) {
  const expectedUser = process.env.ADMIN_USERNAME || 'admin';
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (!expectedPass) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        error: 'Painel administrativo não configurado. Defina ADMIN_PASSWORD no servidor.',
      });
    }
    console.warn('[admin] ADMIN_PASSWORD ausente — dashboard aberto em desenvolvimento.');
    return next();
  }

  const header = req.headers.authorization;

  if (!header || !header.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="Moove Hub Admin", charset="UTF-8"');
    return res.status(401).send('Autenticação necessária para acessar o painel.');
  }

  let decoded;
  try {
    decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  } catch {
    return res.status(401).send('Credenciais inválidas.');
  }

  const separator = decoded.indexOf(':');
  if (separator === -1) {
    return res.status(401).send('Credenciais inválidas.');
  }

  const user = decoded.slice(0, separator);
  const pass = decoded.slice(separator + 1);

  const userOk = safeEqual(user, expectedUser);
  const passOk = safeEqual(pass, expectedPass);

  if (!userOk || !passOk) {
    res.set('WWW-Authenticate', 'Basic realm="Moove Hub Admin", charset="UTF-8"');
    return res.status(401).send('Usuário ou senha incorretos.');
  }

  return next();
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = { adminAuth };
