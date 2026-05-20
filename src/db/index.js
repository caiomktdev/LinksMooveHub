const { createSqliteDb } = require('./sqlite');
const { createPostgresDb } = require('./postgres');

const DATABASE_URL = process.env.DATABASE_URL || 'file:./data/links.db';

function getDialect(url = DATABASE_URL) {
  if (/^postgres(ql)?:\/\//i.test(url)) return 'postgres';
  return 'sqlite';
}

/**
 * Inicializa a conexão com o banco conforme DATABASE_URL.
 * @returns {Promise<{ dialect: string, raw: object, close: Function }>}
 */
async function connectDatabase() {
  const dialect = getDialect();

  if (dialect === 'postgres') {
    return createPostgresDb(DATABASE_URL);
  }

  return createSqliteDb(DATABASE_URL);
}

module.exports = { connectDatabase, getDialect, DATABASE_URL };
