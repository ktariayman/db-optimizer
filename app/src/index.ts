import Fastify from "fastify";
import { eventsPrimary, eventsSecondaryPreferred } from "./db";

const app = Fastify();

app.get("/health", async () => ({ ok: true, db: "mongo-repl" }));

// READ: secondaryPreferred
app.get("/events", async (req, reply) => {
  const q: any = req.query || {};
  const visitorid = q.visitorid ? String(q.visitorid) : null;
  if (!visitorid) return reply.code(400).send({ error: "visitorid is required" });

  const filter: any = { visitorid };
  const from = q.from ? Number(q.from) : null;
  const to = q.to ? Number(q.to) : null;
  if (from || to) filter.timestamp = {};
  if (from) filter.timestamp.$gte = from;
  if (to) filter.timestamp.$lt = to;
  if (q.cursor) {
    filter.timestamp = filter.timestamp || {};
    filter.timestamp.$lt = Number(q.cursor);
  }

  const limit = Math.min(Number(q.limit || 100), 1000);

  const col = await eventsSecondaryPreferred();
  const docs = await col.find(filter)
    .sort({ timestamp: -1 })
    .limit(limit)
    .project({ _id: 0 })
    .toArray();

  return docs;
});

// WRITE: primary
app.post("/ingest", async (req, reply) => {
  const body: any = req.body;
  const items = Array.isArray(body) ? body : [body];

  const col = await eventsPrimary();
  await col.insertMany(items.map((d: any) => ({
    timestamp: Number(d.timestamp ?? Date.now()),
    visitorid: String(d.visitorid),
    event: d.event || "event",
    itemid: d.itemid != null ? String(d.itemid) : null,
    transactionid: d.transactionid != null ? String(d.transactionid) : null,
  })), { writeConcern: { w: 1 } });

  reply.code(201).send({ inserted: items.length });
});

const port = Number(process.env.PORT || 8080);
app.listen({ port, host: "0.0.0.0" }).then(() => {
  console.log(`api listening on ${port}`);
});
