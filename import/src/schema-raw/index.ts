import fs from "node:fs";
import { MongoClient } from "mongodb";

const url = process.env.MONGO_URL!;
async function main() {
 console.log("Connecting to MongoDB:", url);
 console.log("Import mode: RAW (Bad Schema / Strings)");

 const client = new MongoClient(url);

 try {
  await client.connect();
  console.log("Connected.");
  const db = client.db();
  const collection = db.collection("recipes");
  const filePath = "/data/recipes_extended.json";
  console.log(`Reading ${filePath}...`);
  if (!fs.existsSync(filePath)) {
   throw new Error(`File not found: ${filePath}`);
  }

  const stats = fs.statSync(filePath);
  console.log(`File size: ${stats.size} bytes`);

  const data = await fs.promises.readFile(filePath, "utf-8");
  console.log("Parsing JSON...");

  const recipes = JSON.parse(data);
  if (!Array.isArray(recipes)) {
   throw new Error("Expected JSON array");
  }

  console.log(`Found ${recipes.length} recipes.`);
  const limit = Math.floor(recipes.length * 0.8);
  console.log(`Importing ${limit} recipes (80%)...`);

  // Clear existing data
  console.log("Deleting existing recipes...");
  await collection.deleteMany({});
  console.log("Deleted.");

  // Batch insert with schema transformation
  const batchSize = 1000;
  let insertedCount = 0;

  for (let i = 0; i < limit; i += batchSize) {
   const batch = recipes.slice(i, i + batchSize);

   const ops = batch.map((doc: any) => {
    // Enforce BAD schema (Strings) for the raw import baseline
    if (doc.num_ingredients) doc.num_ingredients = String(doc.num_ingredients);
    if (doc.num_steps) doc.num_steps = String(doc.num_steps);
    if (doc.fast_hits) doc.fast_hits = String(doc.fast_hits);
    if (doc.slow_hits) doc.slow_hits = String(doc.slow_hits);
    if (doc.medium_hits) doc.medium_hits = String(doc.medium_hits);
    if (doc.est_prep_time_min) doc.est_prep_time_min = String(doc.est_prep_time_min);
    if (doc.est_cook_time_min) doc.est_cook_time_min = String(doc.est_cook_time_min);
    if (doc.cook_time) doc.cook_time = String(doc.cook_time);
    if (doc.prep_time) doc.prep_time = String(doc.prep_time);
    if (doc.healthiness_score) doc.healthiness_score = String(doc.healthiness_score);

    return { insertOne: { document: doc } };
   });

   await collection.bulkWrite(ops, { ordered: false });
   insertedCount += batch.length;

   if (i % 10000 === 0) {
    console.log(`Progress: ${insertedCount}/${limit}`);
   }
  }

  console.log(`\nImport complete. Inserted ${insertedCount} recipes.`);

  // Create text index
  console.log("Creating text index...");
  await collection.createIndex({ recipe_title: "text", ingredients: "text" });
  console.log("Index created.");

 } finally {
  await client.close();
 }
}

main().catch((err) => {
 console.error("Fatal error:", err);
 process.exit(1);
});