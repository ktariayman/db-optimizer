import fs from "node:fs";
import { parse } from "csv-parse";
import pg from "pg";

const url = process.env.DATABASE_URL!;
const client = new pg.Client({ connectionString: url });

async function main() {
  await client.connect();
  // Ensure schema exists
  const ddl = await fs.promises.readFile("/schema/001_init.sql", "utf8");
  await client.query(ddl);

  // Read CSV (robust to JSON in payload)
  const parser = fs.createReadStream("/data/dataset.csv").pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      relax_quotes: true,
      trim: true,
    })
  );

  const all: any[] = [];
  for await (const row of parser) {
    let payload;
    try {
      payload = row.payload ? JSON.parse(row.payload) : { raw: row };
    } catch {
      payload = { raw: row };
    }
    all.push({
      tenant_id: Number(row.tenant_id ?? 1),
      user_id: Number(row.user_id ?? 1),
      ts: new Date(row.ts ?? Date.now()),
      kind: String(row.kind ?? "event"),
      payload,
    });
  }

  const cutoff = Math.floor(all.length * 0.8);
  const baseline = all.slice(0, cutoff);
  const heldout = all.slice(cutoff);

  // Batch insert baseline
  const batchSize = 5000;
  for (let i = 0; i < baseline.length; i += batchSize) {
    const slice = baseline.slice(i, i + batchSize);
    const values: any[] = [];
    const tuples = slice
      .map((it, idx) => {
        const base = idx * 5;
        values.push(it.tenant_id, it.user_id, it.ts, it.kind, it.payload);
        return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5})`;
      })
      .join(",");
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO events (tenant_id,user_id,ts,kind,payload) VALUES ${tuples}`,
      values
    );
    await client.query("COMMIT");
    process.stdout.write(`inserted ${Math.min(i + batchSize, baseline.length)}/${baseline.length}\r`);
  }
  await fs.promises.writeFile("/data/heldout.json", JSON.stringify(heldout, null, 2));
  console.log(`\nDone. Baseline=${baseline.length}, Heldout=${heldout.length}`);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
