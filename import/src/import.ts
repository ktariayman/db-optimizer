// src/index.ts
import mongoose from "mongoose";
import { importRecipesFromFile } from "./services/recipeImport.service.js";

const url = process.env.MONGO_URL!;

async function main() {
  console.log("Connecting to MongoDB:", url);
  await mongoose.connect(url);
  console.log("Connected.");

  try {
    await importRecipesFromFile({
      filePath: "/data/recipes_extended.json",
      schemaType: (process.env.SCHEMA_TYPE as any) || "optimized",
      fraction: 0.8,
      batchSize: 1000,
    });
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
