import fs from "node:fs";
import { MongoClient } from "mongodb";

const url = process.env.MONGO_URL!;
async function importRecipes() {
 const client = new MongoClient(url);
 const batchSize = 1000;
 const filePath = "/data/recipes_extended.json";

 try {
  await client.connect();
  const db = client.db();
  const collection = db.collection("recipes");
  const data = await fs.promises.readFile(filePath, "utf-8");
  const recipes = JSON.parse(data);
  const limit = Math.floor(recipes.length * 0.8);
  let insertedCount = 0;
  for (let i = 0; i < limit; i += batchSize) {
   const batch = recipes.slice(i, i + batchSize);
   const ops = batch.map((doc: any) => {
    return { insertOne: { document: doc } };
   });
   await collection.bulkWrite(ops, { ordered: false });
   insertedCount += batch.length;
  }
 } finally {
  await client.close();
 }
}

importRecipes().catch((err) => {
 console.error("Fatal error:", err);
 process.exit(1);
});