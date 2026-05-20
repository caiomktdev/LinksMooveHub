const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { SQLITE_SCHEMA } = require('./schema');

/**
 * Resolve o caminho do arquivo SQLite a partir de DATABASE_URL.
 * Aceita: file:./data/links.db ou caminho direto terminando em .db
 */
function resolveSqlitePath(databaseUrl) {
  const raw = databaseUrl.startsWith('file:')
    ? databaseUrl.slice('file:'.length)
    : databaseUrl;

  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
}

/** Adapta node:sqlite para API compatível com os repositórios (prepare/run/get/all). */
function createSqliteAdapter(db) {
  return {
    exec(sql) {
      db.exec(sql);
    },
    prepare(sql) {
      const names = [];
      const positional = sql.replace(/@([a-zA-Z_][\w]*)/g, (_, name) => {
        names.push(name);
        return '?';
      });
      const stmt = db.prepare(positional);

      const bind = (params) => names.map((name) => params[name]);

      return {
        run(params = {}) {
          const result = names.length ? stmt.run(...bind(params)) : stmt.run();
          return { lastInsertRowid: result.lastInsertRowid };
        },
        get(params) {
          return names.length ? stmt.get(...bind(params)) : stmt.get();
        },
        all(params) {
          return names.length ? stmt.all(...bind(params)) : stmt.all();
        },
      };
    },
  };
}

function createSqliteDb(databaseUrl) {
  const dbPath = resolveSqlitePath(databaseUrl);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec(SQLITE_SCHEMA);

  const adapter = createSqliteAdapter(db);

  return {
    dialect: 'sqlite',
    raw: adapter,
    close() {
      db.close();
    },
  };
}

module.exports = { createSqliteDb, resolveSqlitePath };
