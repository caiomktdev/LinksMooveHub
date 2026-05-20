const express = require('express');
const { getClientIp } = require('../middleware/clientIp');
const { detectDeviceType } = require('../services/device');
const { resolveRegion } = require('../services/geo');
const { VALID_EVENT_TYPES } = require('../repositories/eventsRepository');

/**
 * POST /api/track
 * Registra visita à página ou clique em botão.
 *
 * Body JSON:
 * {
 *   "event_type": "visita_pagina" | "clique_botao",
 *   "button_name": "instagram"   // obrigatório se event_type === "clique_botao"
 * }
 */
function createTrackRouter(eventsRepo) {
  const router = express.Router();

  router.post('/', async (req, res, next) => {
    try {
      const { event_type, button_name } = req.body ?? {};

      if (!event_type || !VALID_EVENT_TYPES.includes(event_type)) {
        return res.status(400).json({
          error: 'event_type inválido. Use: visita_pagina ou clique_botao',
        });
      }

      if (event_type === 'clique_botao' && !button_name?.trim()) {
        return res.status(400).json({
          error: 'button_name é obrigatório para eventos do tipo clique_botao',
        });
      }

      const userAgent = req.get('user-agent') || 'unknown';
      const ipAddress = getClientIp(req);
      const deviceType = detectDeviceType(userAgent);
      const region = resolveRegion(ipAddress);

      const saved = await eventsRepo.insertEvent({
        event_type,
        button_name: event_type === 'clique_botao' ? String(button_name).trim() : null,
        user_agent: userAgent,
        ip_address: ipAddress,
        device_type: deviceType,
        region,
      });

      return res.status(201).json({
        ok: true,
        id: saved.id,
        created_at: saved.created_at,
      });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

module.exports = { createTrackRouter };
