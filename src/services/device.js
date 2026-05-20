const MOBILE_UA_PATTERN =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i;

/**
 * Classifica o dispositivo a partir do User-Agent.
 * @param {string} userAgent
 * @returns {'mobile' | 'desktop'}
 */
function detectDeviceType(userAgent = '') {
  return MOBILE_UA_PATTERN.test(userAgent) ? 'mobile' : 'desktop';
}

module.exports = { detectDeviceType };
