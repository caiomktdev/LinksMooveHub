/**
 * Cliente leve para enviar eventos ao backend próprio.
 * Uso: trackEvent('visita_pagina') ou trackEvent('clique_botao', 'instagram')
 */
async function trackEvent(eventType, buttonName) {
  const body = { event_type: eventType };
  if (buttonName) body.button_name = buttonName;

  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch (err) {
    console.warn('[analytics]', err);
  }
}

// Registra visita automaticamente ao carregar a página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => trackEvent('visita_pagina'));
} else {
  trackEvent('visita_pagina');
}
