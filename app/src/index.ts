import Fastify from "fastify";
import pool from "./db"; // <-- no ".js"

const app = Fastify();

app.get("/health", async () => ({ ok: true, env: "dev-hot-reload" }));

app.get("/events", async (req, reply) => {
  const q: any = req.query || {};
  const tenant_id = q.tenant_id ? Number(q.tenant_id) : null;
  const from = q.from;
  const to = q.to;
  const limit = Math.min(Number(q.limit || 100), 1000);
  const cursor = q.cursor;

  if (!tenant_id) return reply.code(400).send({ error: "tenant_id is required" });

  const params: any[] = [tenant_id];
  let where = "tenant_id = $1";
  if (from) { params.push(from); where += ` AND ts >= $${params.length}`; }
  if (to) { params.push(to); where += ` AND ts <  $${params.length}`; }
  if (cursor) { params.push(cursor); where += ` AND ts < $${params.length}`; }

  params.push(limit);
  const sql = `
    SELECT id, tenant_id, user_id, ts, kind, payload
    FROM events
    WHERE ${where}
    ORDER BY ts DESC
    LIMIT $${params.length}
  `;
  const { rows } = await pool.query(sql, params);
  return rows;
});

app.post("/ingest", async (req, reply) => {
  const body: any = req.body;
  const items = Array.isArray(body) ? body : [body];

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const text = `
      INSERT INTO events (tenant_id, user_id, ts, kind, payload)
      VALUES ($1,$2,$3,$4,$5)
    `;
    for (const it of items) {
      await client.query(text, [it.tenant_id, it.user_id, it.ts, it.kind, it.payload]);
    }
    await client.query("COMMIT");
    reply.code(201).send({ inserted: items.length });
  } catch (e: any) {
    await client.query("ROLLBACK");
    reply.code(500).send({ error: e.message });
  } finally {
    client.release();
  }
});

const port = Number(process.env.PORT || 8080);
app.listen({ port, host: "0.0.0.0" }).then(() => {
  console.log(`api listening on ${port}`);
});
