/**
 * Extrai o IP real do cliente considerando proxy reverso (Hostinger, Cloudflare, etc.).
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = String(forwarded).split(',')[0].trim();
    if (first) return first;
  }

  return req.ip || req.socket?.remoteAddress || 'unknown';
}

module.exports = { getClientIp };
