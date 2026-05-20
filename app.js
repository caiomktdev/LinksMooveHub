const express = require('express');
const path = require('path');
const { getDialect } = require('./src/db');
const { createEventsRepository } = require('./src/repositories/eventsRepository');
const { createTrackRouter } = require('./src/routes/track');
const { createAnalyticsRouter } = require('./src/routes/analytics');
const { errorHandler } = require('./src/middleware/errorHandler');
const { adminAuth } = require('./src/middleware/adminAuth');
const { getAdminDiagnostics } = require('./src/config/adminCredentials');

const PUBLIC_DIR = path.join(__dirname, 'public');
const DASHBOARD_FILE = path.join(PUBLIC_DIR, 'dashboard.html');

/**
 * Cria e configura a aplicação Express (API + páginas estáticas).
 * @param {import('./src/db')} db
 */
function createApp(db) {
  const app = express();
  const eventsRepo = createEventsRepository(db);

  app.set('trust proxy', true);

  app.use(express.json({ limit: '32kb' }));
  app.use(express.urlencoded({ extended: false }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      dialect: getDialect(),
      env: process.env.NODE_ENV || 'development',
      ...getAdminDiagnostics(),
    });
  });

  app.use('/api/track', createTrackRouter(eventsRepo));
  app.use('/api/analytics', adminAuth, createAnalyticsRouter(eventsRepo));

  app.get('/', (_req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  });

  app.get('/login', (_req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'login.html'));
  });

  app.get(['/dashboard', '/admin'], (_req, res) => {
    res.sendFile(DASHBOARD_FILE);
  });

  app.get('/dashboard.html', (_req, res) => {
    res.redirect(301, '/dashboard');
  });

  app.use(
    express.static(PUBLIC_DIR, {
      index: false,
      maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    })
  );

  app.use(errorHandler);

  return app;
}

module.exports = { createApp, PUBLIC_DIR };
