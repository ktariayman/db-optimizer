import mongoose from "mongoose";
import { importRecipesFromFile } from "./services/recipeImport.service.js";

const url = process.env.MONGO_URL!;

async function main() {
  await mongoose.connect(url);
  try {
    await importRecipesFromFile({
      filePath: "/data/recipes_extended.json",
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
