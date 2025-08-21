import fs from "node:fs";
import { parse } from "csv-parse";
import { MongoClient } from "mongodb";

const url = process.env.MONGO_URL!;
const client = new MongoClient(url);

async function main() {
 await client.connect();
 const db = client.db();
 const col = db.collection("events_rr");

 // Stream the original CSV as-is
 const parser = fs.createReadStream("/data/retailrocket/events.csv").pipe(
  parse({
   columns: true,
   skip_empty_lines: true,
   relax_column_count: true,
   trim: true,
  })
 );

 const all: any[] = [];
 for await (const r of parser) {
  // Keep original fields, minimal typing for timestamp
  const tsNum = Number(r.timestamp);
  all.push({
   timestamp: Number.isFinite(tsNum) ? tsNum : null,  // unix seconds
   visitorid: r.visitorid ?? null,
   event: r.event ?? null,
   itemid: r.itemid ?? null,
   transactionid: r.transactionid && String(r.transactionid).length ? r.transactionid : null,
  });
 }

 const cutoff = Math.floor(all.length * 0.8);
 const baseline = all.slice(0, cutoff);
 const heldout = all.slice(cutoff);

 // Bulk insert baseline (batched)
 const batchSize = 5000;
 await col.deleteMany({}); // optional: start clean
 for (let i = 0; i < baseline.length; i += batchSize) {
  const ops = baseline.slice(i, i + batchSize).map(doc => ({ insertOne: { document: doc } }));
  await col.bulkWrite(ops, { ordered: false });
  process.stdout.write(`inserted ${Math.min(i + batchSize, baseline.length)}/${baseline.length}\r`);
 }

 await fs.promises.writeFile("/data/heldout_retailrocket.json", JSON.stringify(heldout, null, 2));
 console.log(`\nDone. Baseline=${baseline.length}, Heldout=${heldout.length}`);

 await client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
