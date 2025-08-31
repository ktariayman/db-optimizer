import Fastify from "fastify";
import { eventsRR } from "./db";

const app = Fastify();

app.get("/health", async () => ({ ok: true, db: "mongo", collection: "events_rr" }));

// GET /events?visitorid=876130&from=1437187000000&to=1437198000000&limit=100&cursor=1437198000000
app.get("/events", async (req, reply) => {
  const q: any = req.query || {};
  const visitorid = q.visitorid ? String(q.visitorid) : null;
  if (!visitorid) return reply.code(400).send({ error: "visitorid is required" });

  const filter: any = { visitorid };
  const from = q.from ? Number(q.from) : null;  // ms epoch
  const to = q.to ? Number(q.to) : null;
  if (from || to) filter.timestamp = {};
  if (from) filter.timestamp.$gte = from;
  if (to) filter.timestamp.$lt = to;

  // Optional cursor for pagination: return events older than cursor
  if (q.cursor) {
    filter.timestamp = filter.timestamp || {};
    filter.timestamp.$lt = Number(q.cursor);
  }

  const limit = Math.min(Number(q.limit || 100), 1000);
  const col = await eventsRR();
  const docs = await col
    .find(filter, { projection: { _id: 0 } })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();

  return docs;
});

// POST /ingest  (single or array) — same schema as CSV
app.post("/ingest", async (req, reply) => {
  const body: any = req.body;
  const items = Array.isArray(body) ? body : [body];

  const docs = items.map((d: any) => ({
    timestamp: Number(d.timestamp),
    visitorid: String(d.visitorid),
    event: d.event ? String(d.event) : null,
    itemid: d.itemid != null ? String(d.itemid) : null,
    transactionid: d.transactionid != null ? String(d.transactionid) : null,
  }));

  const col = await eventsRR();
  await col.insertMany(docs, { ordered: false });
  reply.code(201).send({ inserted: docs.length });
});

const port = Number(process.env.PORT || 8080);
app.listen({ port, host: "0.0.0.0" }).then(() => {
  console.log(`api listening on ${port}`);
});
