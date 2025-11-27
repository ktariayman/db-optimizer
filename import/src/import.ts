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

  // Batch insert
  const batchSize = 1000;
  let insertedCount = 0;
  for (let i = 0; i < recipes.length; i += batchSize) {
   const batch = recipes.slice(i, i + batchSize);
   const ops = batch.map((doc) => {
    // Schema Optimization Logic
    // If SCHEMA_TYPE is 'default' (naive), we convert numbers to strings.
    // If SCHEMA_TYPE is 'optimized', we ensure they are numbers.
    const schemaType = process.env.SCHEMA_TYPE || 'default';

    if (schemaType === 'default') {
     if (doc.cook_time) doc.cook_time = String(doc.cook_time);
     if (doc.prep_time) doc.prep_time = String(doc.prep_time);
     if (doc.calories) doc.calories = String(doc.calories);
     if (doc.num_ingredients) doc.num_ingredients = String(doc.num_ingredients);
     if (doc.num_steps) doc.num_steps = String(doc.num_steps);
     if (doc.healthiness_score) doc.healthiness_score = String(doc.healthiness_score);
     if (doc.est_prep_time_min) doc.est_prep_time_min = String(doc.est_prep_time_min);
     if (doc.est_cook_time_min) doc.est_cook_time_min = String(doc.est_cook_time_min);
    } else {
     if (doc.cook_time) doc.cook_time = Number(doc.cook_time);
     if (doc.prep_time) doc.prep_time = Number(doc.prep_time);
     if (doc.calories) doc.calories = Number(doc.calories);
     if (doc.num_ingredients) doc.num_ingredients = Number(doc.num_ingredients);
     if (doc.num_steps) doc.num_steps = Number(doc.num_steps);
     if (doc.healthiness_score) doc.healthiness_score = Number(doc.healthiness_score);
     if (doc.est_prep_time_min) doc.est_prep_time_min = Number(doc.est_prep_time_min);
     if (doc.est_cook_time_min) doc.est_cook_time_min = Number(doc.est_cook_time_min);
    }
    return { insertOne: { document: doc } };
   });
   await col.bulkWrite(ops, { ordered: false });
   insertedCount += batch.length;
   if (i % 10000 === 0) {
    console.log(`Inserted ${insertedCount}/${recipes.length}`);
   }
  }

  console.log(`\nDone. Imported ${insertedCount} recipes.`);

  // Create text index immediately to ensure baseline works
  console.log("Creating indexes...");
  await col.createIndex({ recipe_title: "text", ingredients: "text" });
  console.log("Indexes created.");

  await client.close();
 } catch (err) {
  console.error("Error importing recipes:", err);
  process.exit(1);
 }
}

main().catch((e) => { console.error(e); process.exit(1); });
