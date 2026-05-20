const geoip = require('geoip-lite');

const LOCAL_FALLBACK = process.env.GEOIP_LOCAL_FALLBACK || 'Região de Teste';

function isPrivateOrLocalIp(ip) {
  if (!ip || ip === 'unknown') return true;

  const normalized = ip.replace(/^::ffff:/, '');

  return (
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized.startsWith('10.') ||
    normalized.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)
  );
}

/**
 * Formata cidade e estado/região a partir do lookup do geoip-lite.
 * @param {import('geoip-lite').Lookup | null} lookup
 * @returns {string}
 */
function formatRegionFromLookup(lookup) {
  if (!lookup) return 'Desconhecido';

  const city = lookup.city?.trim();
  const state = lookup.region?.trim();
  const country = lookup.country?.trim();

  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  if (country) return country;

  return 'Desconhecido';
}

/**
 * Resolve região (Cidade/Estado) a partir do IP via geoip-lite.
 * IPs locais ou privados retornam fallback de desenvolvimento.
 *
 * @param {string} ip
 * @returns {string}
 */
function resolveRegion(ip) {
  if (isPrivateOrLocalIp(ip)) {
    return LOCAL_FALLBACK;
  }

  const lookup = geoip.lookup(ip);
  return formatRegionFromLookup(lookup);
}

/**
 * Retorna lat/lng do IP via geoip-lite, ou null se não disponível.
 * @param {string} ip
 * @returns {{ lat: number, lng: number } | null}
 */
function resolveCoords(ip) {
  if (isPrivateOrLocalIp(ip)) return null;
  const lookup = geoip.lookup(ip);
  if (!lookup || !lookup.ll) return null;
  return { lat: lookup.ll[0], lng: lookup.ll[1] };
}

module.exports = { resolveRegion, resolveCoords, isPrivateOrLocalIp, LOCAL_FALLBACK };
