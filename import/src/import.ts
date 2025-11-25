import fs from "node:fs";
import { MongoClient } from "mongodb";

const url = process.env.MONGO_URL!;
console.log("Connecting to MongoDB at", url);
const client = new MongoClient(url);

async function main() {
 try {
  await client.connect();
  console.log("Connected to MongoDB");
  const db = client.db();
  const col = db.collection("recipes");

  const filePath = "/data/recipes_extended.json";
  console.log(`Reading ${filePath}...`);

  if (!fs.existsSync(filePath)) {
   throw new Error(`File not found: ${filePath}`);
  }

  const stats = fs.statSync(filePath);
  console.log(`File size: ${stats.size} bytes`);

  const data = await fs.promises.readFile(filePath, "utf-8");
  console.log("File read. Parsing JSON...");

  const recipes = JSON.parse(data);
  console.log("JSON parsed.");

  if (!Array.isArray(recipes)) {
   throw new Error("Expected JSON to be an array of recipes");
  }

  console.log(`Found ${recipes.length} recipes. Importing...`);

  if (recipes.length === 0) {
   console.log("Warning: Recipes array is empty.");
  }

  // Start clean
  console.log("Deleting existing recipes...");
  await col.deleteMany({});
  console.log("Deleted.");
  const limit = Math.floor(recipes.length * 0.8);
  console.log(`Importing 80% of data (${limit} recipes), leaving 20% for simulation.`);

  // Batch insert
  const batchSize = 1000;
  let insertedCount = 0;
  for (let i = 0; i < limit; i += batchSize) {
   const batch = recipes.slice(i, Math.min(i + batchSize, limit));
   const ops = batch.map((doc) => ({ insertOne: { document: doc } }));
   await col.bulkWrite(ops, { ordered: false });
   insertedCount += batch.length;
   if (i % 10000 === 0) {
    console.log(`Inserted ${insertedCount}/${limit}`);
   }
  }

  // console.log(`\nDone. Imported ${insertedCount} recipes.`);

  // Create text index immediately to ensure baseline works
  // console.log("Creating indexes...");
  // await col.createIndex({ recipe_title: "text", ingredients: "text" });
  // console.log("Indexes created.");

  await client.close();
 } catch (err) {
  console.error("Error importing recipes:", err);
  process.exit(1);
 }
}

main().catch((e) => { console.error(e); process.exit(1); });
