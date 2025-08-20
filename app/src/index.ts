import Fastify from "fastify";
import { events } from "./db";

const app = Fastify();

app.get("/health", async () => ({ ok: true, db: "mongo" }));

// GET /events?tenant_id=1&from=ISO&to=ISO&limit=100&cursor=ISO
app.get("/events", async (req, reply) => {
  const q: any = req.query || {};
  const tenant_id = q.tenant_id ? Number(q.tenant_id) : null;
  if (!tenant_id) return reply.code(400).send({ error: "tenant_id is required" });

  const filter: any = { tenant_id };
  const from = q.from ? new Date(q.from) : null;
  const to = q.to ? new Date(q.to) : null;
  if (from || to) filter.ts = {};
  if (from) filter.ts.$gte = from;
  if (to) filter.ts.$lt = to;
  if (q.cursor) {
    filter.ts = filter.ts || {};
    filter.ts.$lt = new Date(q.cursor);
  }

  const limit = Math.min(Number(q.limit || 100), 1000);

  const col = await events();
  const docs = await col
    .find(filter, { projection: { _id: 0 } })
    .sort({ ts: -1 })
    .limit(limit)
    .toArray();

  return docs;
});

// POST /ingest  (single doc or array)
app.post("/ingest", async (req, reply) => {
  const body: any = req.body;
  const items = Array.isArray(body) ? body : [body];

  const col = await events();
  await col.insertMany(items.map((d: any) => ({
    tenant_id: Number(d.tenant_id),
    user_id: Number(d.user_id),
    ts: new Date(d.ts),
    kind: d.kind || "event",
    payload: d.payload ?? {}
  })));

  reply.code(201).send({ inserted: items.length });
});

const port = Number(process.env.PORT || 8080);
app.listen({ port, host: "0.0.0.0" }).then(() => {
  console.log(`api listening on ${port}`);
});
