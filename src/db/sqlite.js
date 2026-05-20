const fs = require('fs');
const os = require('os');
const path = require('path');
const { TABLE_SQLITE, INDEXES } = require('./schema');

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

function resolveDataDirectory(databaseUrl) {
  if (process.env.DATA_DIR) {
    return path.resolve(process.env.DATA_DIR);
  }

  return path.dirname(resolveSqlitePath(databaseUrl));
}

function ensureWritableDataDir(preferredDir) {
  try {
    fs.mkdirSync(preferredDir, { recursive: true });
    fs.accessSync(preferredDir, fs.constants.W_OK);
    return preferredDir;
  } catch {
    const fallback = path.join(os.tmpdir(), 'linksmoovehub');
    fs.mkdirSync(fallback, { recursive: true });
    console.warn(
      `[db] sem permissão de escrita em ${preferredDir}; usando ${fallback}`
    );
    return fallback;
  }
}

/** Adapta node:sqlite para API compatível com os repositórios (prepare/run/get/all). */
function createNativeSqliteAdapter(db) {
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

/** Adapta better-sqlite3 (parâmetros @nome nativos). */
function createBetterSqliteAdapter(db) {
  return {
    exec(sql) {
      db.exec(sql);
    },
    prepare(sql) {
      const stmt = db.prepare(sql);
      return {
        run(params = {}) {
          const result = stmt.run(params);
          return { lastInsertRowid: result.lastInsertRowid };
        },
        get(params) {
          return stmt.get(params);
        },
        all(params) {
          return stmt.all(params);
        },
      };
    },
  };
}

function canUseNativeSqlite() {
  const [major, minor] = process.versions.node.split('.').map(Number);
  return major > 22 || (major === 22 && minor >= 5);
}

function openSqliteDatabase(dbPath) {
  if (canUseNativeSqlite()) {
    try {
      const { DatabaseSync } = require('node:sqlite');
      const db = new DatabaseSync(dbPath);
      console.log('[db] driver: node:sqlite');
      return {
        raw: createNativeSqliteAdapter(db),
        close() {
          db.close();
        },
      };
    } catch (err) {
      console.warn('[db] node:sqlite falhou, tentando better-sqlite3:', err.message);
    }
  }

  try {
    const Database = require('better-sqlite3');
    const db = new Database(dbPath);
    console.log('[db] driver: better-sqlite3');
    return {
      raw: createBetterSqliteAdapter(db),
      close() {
        db.close();
      },
    };
  } catch (err) {
    throw new Error(
      `SQLite indisponível: use Node.js 22.5+ no hPanel (atual: ${process.version}). Detalhe: ${err.message}`
    );
  }
}

function createSqliteDb(databaseUrl) {
  const preferredDir = resolveDataDirectory(databaseUrl);
  const dataDir = ensureWritableDataDir(preferredDir);

  const fileName = path.basename(resolveSqlitePath(databaseUrl));
  const dbPath = path.join(dataDir, fileName);

  const { raw, close } = openSqliteDatabase(dbPath);

  raw.exec('PRAGMA journal_mode = WAL');
  raw.exec(TABLE_SQLITE);
  for (const indexSql of INDEXES) {
    raw.exec(indexSql);
  }

  console.log(`[db] sqlite arquivo: ${dbPath}`);

  return {
    dialect: 'sqlite',
    raw,
    close,
  };
}

module.exports = { createSqliteDb, resolveSqlitePath };
