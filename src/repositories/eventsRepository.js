const VALID_EVENT_TYPES = ['visita_pagina', 'clique_botao'];

// UTC-3 (America/Sao_Paulo — BRT sem horário de verão)
const TZ_OFFSET = '-3 hours';

const SINCE_SQLITE = `datetime(created_at) >= datetime('now', '-12 months')`;
const SINCE_POSTGRES = `created_at >= NOW() - INTERVAL '12 months'`;

function createEventsRepository(db) {
  if (db.dialect === 'sqlite') {
    return createSqliteRepository(db.raw);
  }
  return createPostgresRepository(db.raw);
}

function createSqliteRepository(sqlite) {
  const insertStmt = sqlite.prepare(`
    INSERT INTO events (event_type, button_name, user_agent, ip_address, device_type, region, created_at)
    VALUES (@event_type, @button_name, @user_agent, @ip_address, @device_type, @region, @created_at)
  `);

  const totalsStmt = sqlite.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN event_type = 'visita_pagina' THEN 1 ELSE 0 END) AS total_visitas,
      SUM(CASE WHEN event_type = 'clique_botao' THEN 1 ELSE 0 END) AS total_cliques
    FROM events
    WHERE ${SINCE_SQLITE}
  `);

  const byMonthStmt = sqlite.prepare(`
    SELECT strftime('%Y-%m', datetime(created_at, '${TZ_OFFSET}')) AS mes, COUNT(*) AS total
    FROM events
    WHERE ${SINCE_SQLITE}
    GROUP BY mes
    ORDER BY mes ASC
  `);

  const visitasPorMesStmt = sqlite.prepare(`
    SELECT strftime('%Y-%m', datetime(created_at, '${TZ_OFFSET}')) AS mes, COUNT(*) AS total
    FROM events
    WHERE ${SINCE_SQLITE} AND event_type = 'visita_pagina'
    GROUP BY mes
    ORDER BY mes ASC
  `);

  const byDeviceStmt = sqlite.prepare(`
    SELECT device_type, COUNT(*) AS total
    FROM events
    WHERE ${SINCE_SQLITE}
    GROUP BY device_type
  `);

  const peakHourStmt = sqlite.prepare(`
    SELECT CAST(strftime('%H', datetime(created_at, '${TZ_OFFSET}')) AS INTEGER) AS hora, COUNT(*) AS total
    FROM events
    WHERE ${SINCE_SQLITE}
    GROUP BY hora
    ORDER BY total DESC
    LIMIT 1
  `);

  const byRegionStmt = sqlite.prepare(`
    SELECT region, COUNT(*) AS total
    FROM events
    WHERE ${SINCE_SQLITE}
    GROUP BY region
    ORDER BY total DESC
    LIMIT 10
  `);

  const recentEventsStmt = sqlite.prepare(`
    SELECT id, event_type, button_name, ip_address, device_type, region,
           datetime(created_at, '${TZ_OFFSET}') AS created_at_local
    FROM events
    ORDER BY id DESC
    LIMIT 50
  `);

  return {
    async insertEvent(payload) {
      const createdAt = payload.created_at || new Date().toISOString();
      const result = insertStmt.run({ ...payload, created_at: createdAt });
      return { id: Number(result.lastInsertRowid), created_at: createdAt };
    },

    async getAnalytics() {
      const totals = totalsStmt.get();

      return formatAnalytics({
        total: totals.total,
        totalVisitas: totals.total_visitas,
        totalCliques: totals.total_cliques,
        byMonth: byMonthStmt.all(),
        visitasPorMes: visitasPorMesStmt.all(),
        byDevice: byDeviceStmt.all(),
        peakHourRow: peakHourStmt.get(),
        byRegion: byRegionStmt.all(),
      });
    },

    async getRecentEvents() {
      return recentEventsStmt.all();
    },
  };
}

function createPostgresRepository(pool) {
  const totalsSql = `
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE event_type = 'visita_pagina')::int AS total_visitas,
      COUNT(*) FILTER (WHERE event_type = 'clique_botao')::int AS total_cliques
    FROM events
    WHERE ${SINCE_POSTGRES}
  `;

  return {
    async insertEvent(payload) {
      const createdAt = payload.created_at || new Date();
      const { rows } = await pool.query(
        `
        INSERT INTO events (event_type, button_name, user_agent, ip_address, device_type, region, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, created_at
      `,
        [
          payload.event_type,
          payload.button_name,
          payload.user_agent,
          payload.ip_address,
          payload.device_type,
          payload.region,
          createdAt,
        ]
      );
      return rows[0];
    },

    async getAnalytics() {
      const [
        totalsResult,
        monthResult,
        visitasMesResult,
        deviceResult,
        peakResult,
        regionResult,
      ] = await Promise.all([
        pool.query(totalsSql),
        pool.query(`
          SELECT to_char(created_at AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM') AS mes, COUNT(*)::int AS total
          FROM events WHERE ${SINCE_POSTGRES}
          GROUP BY mes ORDER BY mes ASC
        `),
        pool.query(`
          SELECT to_char(created_at AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM') AS mes, COUNT(*)::int AS total
          FROM events
          WHERE ${SINCE_POSTGRES} AND event_type = 'visita_pagina'
          GROUP BY mes ORDER BY mes ASC
        `),
        pool.query(`
          SELECT device_type, COUNT(*)::int AS total
          FROM events WHERE ${SINCE_POSTGRES}
          GROUP BY device_type
        `),
        pool.query(`
          SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE 'America/Sao_Paulo')::int AS hora, COUNT(*)::int AS total
          FROM events WHERE ${SINCE_POSTGRES}
          GROUP BY hora ORDER BY total DESC LIMIT 1
        `),
        pool.query(`
          SELECT region, COUNT(*)::int AS total
          FROM events WHERE ${SINCE_POSTGRES}
          GROUP BY region ORDER BY total DESC LIMIT 10
        `),
      ]);

      return formatAnalytics({
        total: totalsResult.rows[0].total,
        totalVisitas: totalsResult.rows[0].total_visitas,
        totalCliques: totalsResult.rows[0].total_cliques,
        byMonth: monthResult.rows,
        visitasPorMes: visitasMesResult.rows,
        byDevice: deviceResult.rows,
        peakHourRow: peakResult.rows[0] || null,
        byRegion: regionResult.rows,
      });
    },

    async getRecentEvents() {
      const { rows } = await pool.query(`
        SELECT id, event_type, button_name, ip_address, device_type, region,
               (created_at AT TIME ZONE 'America/Sao_Paulo') AS created_at_local
        FROM events
        ORDER BY id DESC
        LIMIT 50
      `);
      return rows;
    },
  };
}

function formatAnalytics({
  total,
  totalVisitas,
  totalCliques,
  byMonth,
  visitasPorMes,
  byDevice,
  peakHourRow,
  byRegion,
}) {
  const deviceMap = { mobile: 0, desktop: 0 };
  for (const row of byDevice) {
    deviceMap[row.device_type] = Number(row.total);
  }

  const mapMes = (rows) =>
    rows.map((row) => ({
      mes: row.mes,
      total: Number(row.total),
    }));

  return {
    periodo: 'ultimos_12_meses',
    total_acessos: Number(total),
    total_visitas: Number(totalVisitas ?? 0),
    total_cliques: Number(totalCliques ?? 0),
    acessos_por_mes: mapMes(byMonth),
    visitas_por_mes: mapMes(visitasPorMes ?? []),
    acessos_por_dispositivo: {
      mobile: deviceMap.mobile,
      desktop: deviceMap.desktop,
    },
    horario_pico: peakHourRow
      ? {
          hora: Number(peakHourRow.hora),
          total: Number(peakHourRow.total),
          label: `${String(peakHourRow.hora).padStart(2, '0')}:00`,
        }
      : null,
    principais_regioes: byRegion.map((row) => ({
      regiao: row.region,
      total: Number(row.total),
    })),
  };
}

module.exports = { createEventsRepository, VALID_EVENT_TYPES };
