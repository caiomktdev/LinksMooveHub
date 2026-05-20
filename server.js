require('dotenv').config();

const { createApp } = require('./app');
const { connectDatabase, getDialect } = require('./src/db');

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  const db = await connectDatabase();
  const app = createApp(db);

  console.log(`[db] ${getDialect()} conectado`);

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`LinksMooveHub em http://0.0.0.0:${PORT}`);
    console.log(`  Página de links : http://localhost:${PORT}/`);
    console.log(`  Dashboard       : http://localhost:${PORT}/dashboard`);
    console.log(`  Admin (alias)   : http://localhost:${PORT}/admin`);
  });

  const shutdown = async () => {
    server.close();
    await db.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
