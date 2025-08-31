import fs from "node:fs";
import { parse } from "csv-parse";
import { MongoClient } from "mongodb";

const url = process.env.MONGO_URL!;
const client = new MongoClient(url);

async function main() {
 await client.connect();
 const col = client.db().collection("events_rr");

 // RetailRocket events.csv is headerless: timestamp,visitorid,event,itemid,transactionid?
 const parser = fs.createReadStream("/data/retailrocket/events.csv").pipe(
  parse({
   columns: false,            // IMPORTANT: no header row
   skip_empty_lines: true,
   relax_column_count: true,
   trim: true,
  })
 );

 const all: any[] = [];
 for await (const row of parser) {
  // row = [timestamp(ms), visitorid, event, itemid, tx?]
  const [ts, visitorid, event, itemid, tx] = row;
  const tsNum = Number(ts); // RetailRocket has ms; if yours is seconds, multiply by 1000 here.
  all.push({
   timestamp: Number.isFinite(tsNum) ? tsNum : null,     // keep as Number (ms)
   visitorid: String(visitorid ?? ""),
   event: String(event ?? ""),
   itemid: itemid != null && itemid !== "" ? String(itemid) : null,
   transactionid: tx != null && tx !== "" ? String(tx) : null,
  });
 }

 const cutoff = Math.floor(all.length * 0.8);
 const baseline = all.slice(0, cutoff);
 const heldout = all.slice(cutoff);

 // Start clean (optional)
 await col.deleteMany({});

 // Batch insert baseline
 const batchSize = 5000;
 for (let i = 0; i < baseline.length; i += batchSize) {
  const ops = baseline.slice(i, i + batchSize).map((doc) => ({ insertOne: { document: doc } }));
  await col.bulkWrite(ops, { ordered: false });
  process.stdout.write(`inserted ${Math.min(i + batchSize, baseline.length)}/${baseline.length}\r`);
 }

 await fs.promises.writeFile("/data/heldout_retailrocket.json", JSON.stringify(heldout, null, 2));
 console.log(`\nDone. Baseline=${baseline.length}, Heldout=${heldout.length}`);

 await client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
