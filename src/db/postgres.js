const { Pool } = require('pg');
const { POSTGRES_SCHEMA } = require('./schema');

async function createPostgresDb(databaseUrl) {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  await pool.query(POSTGRES_SCHEMA);

  return {
    dialect: 'postgres',
    raw: pool,
    async close() {
      await pool.end();
    },
  };
}

module.exports = { createPostgresDb };
