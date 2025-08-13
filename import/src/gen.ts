import fs from "node:fs";

const ROWS = Number(process.env.ROWS || 1_000_000);
const TENANTS = Number(process.env.TENANTS || 100);
const start = new Date("2024-12-01T00:00:00Z").getTime();

const outPath = "/data/dataset.csv";
const out = fs.createWriteStream(outPath);
out.write("tenant_id,user_id,ts,kind,payload\n");

function rand(n: number) { return Math.floor(Math.random() * n); }
function iso(ms: number) { return new Date(ms).toISOString(); }
function csvEscape(raw: string) {
 // Wrap in double quotes and double any inner quotes per RFC4180
 return `"${raw.replace(/"/g, '""')}"`;
}

const kinds = ["click", "view", "add_to_cart", "checkout"];
(async () => {
 for (let i = 0; i < ROWS; i++) {
  const tenant_id = (i % TENANTS) + 1;
  const user_id = rand(1_000_000) + 1;
  const ts = iso(start + i * 1000);
  const kind = kinds[rand(kinds.length)];

  const payloadJSON = JSON.stringify({ sku: "SKU" + (i % 5000), v: Math.random() });
  const payloadCSV = csvEscape(payloadJSON);

  out.write(`${tenant_id},${user_id},${ts},${kind},${payloadCSV}\n`);
  if (i % 100000 === 0 && i > 0) process.stdout.write(`generated ${i}\r`);
 }
 out.end(() => console.log(`\nWrote ${ROWS} rows to ${outPath}`));
})();
