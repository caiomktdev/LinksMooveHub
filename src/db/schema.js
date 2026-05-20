/** DDL da tabela de eventos — compatível com SQLite e PostgreSQL. */

const TABLE_SQLITE = `
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL CHECK (event_type IN ('visita_pagina', 'clique_botao')),
    button_name TEXT,
    user_agent TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    device_type TEXT NOT NULL CHECK (device_type IN ('mobile', 'desktop')),
    region TEXT NOT NULL DEFAULT 'Desconhecido',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

const TABLE_POSTGRES = `
  CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(32) NOT NULL CHECK (event_type IN ('visita_pagina', 'clique_botao')),
    button_name VARCHAR(255),
    user_agent TEXT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    device_type VARCHAR(16) NOT NULL CHECK (device_type IN ('mobile', 'desktop')),
    region VARCHAR(128) NOT NULL DEFAULT 'Desconhecido',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

/** Índices para filtros de analytics (data, tipo, compostos). */
const INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type)',
  'CREATE INDEX IF NOT EXISTS idx_events_device_type ON events(device_type)',
  'CREATE INDEX IF NOT EXISTS idx_events_region ON events(region)',
  'CREATE INDEX IF NOT EXISTS idx_events_created_at_event_type ON events(created_at, event_type)',
  'CREATE INDEX IF NOT EXISTS idx_events_event_type_created_at ON events(event_type, created_at)',
];

const SQLITE_SCHEMA = [TABLE_SQLITE, ...INDEXES].join('\n');
const POSTGRES_SCHEMA = [TABLE_POSTGRES, ...INDEXES].join('\n');

module.exports = {
  TABLE_SQLITE,
  TABLE_POSTGRES,
  INDEXES,
  SQLITE_SCHEMA,
  POSTGRES_SCHEMA,
};
