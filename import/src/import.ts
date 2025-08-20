import fs from "node:fs";
import { parse } from "csv-parse";
import { MongoClient } from "mongodb";

const url = process.env.MONGO_URL;
if (!url) {
  throw new Error('MONGO_URL is not set. Example: mongodb://root:root@mongo:27017/app?authSource=admin');
}
const client = new MongoClient(url);


async function main() {
  await client.connect();
  const db = client.db();
  const col = db.collection("events");

  // optional: collection validator (pedagogic)
  await db.command({
    collMod: "events",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["tenant_id", "user_id", "ts", "kind", "payload"],
        properties: {
          tenant_id: { bsonType: "int" },
          user_id: { bsonType: "int" },
          ts: { bsonType: "date" },
          kind: { bsonType: "string" },
          payload: { bsonType: "object" }
        }
      }
    },
    validationLevel: "moderate"
  }).catch(() => { });

  const parser = fs.createReadStream("/data/dataset.csv").pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      relax_quotes: true,
      trim: true
    })
  );

  const all: any[] = [];
  for await (const row of parser) {
    let payload: any;
    try { payload = row.payload ? JSON.parse(row.payload) : {}; }
    catch { payload = {}; }
    all.push({
      tenant_id: Number(row.tenant_id ?? 1),
      user_id: Number(row.user_id ?? 1),
      ts: new Date(row.ts ?? Date.now()),
      kind: String(row.kind ?? "event"),
      payload
    });
  }

  const cutoff = Math.floor(all.length * 0.8);
  const baseline = all.slice(0, cutoff);
  const heldout = all.slice(cutoff);

  // bulkWrite in batches
  const batchSize = 5000;
  for (let i = 0; i < baseline.length; i += batchSize) {
    const ops = baseline.slice(i, i + batchSize).map(doc => ({ insertOne: { document: doc } }));
    await col.bulkWrite(ops, { ordered: false });
    process.stdout.write(`inserted ${Math.min(i + batchSize, baseline.length)}/${baseline.length}\r`);
  }

  await fs.promises.writeFile("/data/heldout.json", JSON.stringify(heldout, null, 2));
  console.log(`\nDone. Baseline=${baseline.length}, Heldout=${heldout.length}`);
  await client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
