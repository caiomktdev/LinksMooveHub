const express = require('express');

/**
 * GET /api/analytics
 * Retorna métricas consolidadas dos últimos 12 meses.
 */
function createAnalyticsRouter(eventsRepo) {
  const router = express.Router();

  router.get('/', async (_req, res, next) => {
    try {
      const data = await eventsRepo.getAnalytics();
      return res.json(data);
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

module.exports = { createAnalyticsRouter };
