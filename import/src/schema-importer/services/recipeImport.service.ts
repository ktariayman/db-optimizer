// src/services/recipeImport.service.ts
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { RecipeModel } from "../models/scehma.mongoose.js";

export type SchemaTypeMode = "default" | "optimized";

export interface ImportRecipesOptions {
 filePath: string;
 schemaType?: SchemaTypeMode;
 fraction?: number;   // e.g. 0.8 for 80%
 batchSize?: number;  // default 1000
}

// minimal type for bulkWrite ops
type BulkWriteOp = {
 insertOne: { document: any };
};

function applyNumericMode(
 value: any,
 schemaType: SchemaTypeMode
): number | string | undefined {
 if (value === undefined || value === null) return undefined;

 if (schemaType === "default") {
  return String(value);
 }

 const n = Number(value);
 return Number.isNaN(n) ? undefined : n;
}

function mapRawRecipe(raw: any, schemaType: SchemaTypeMode) {
 return {
  recipe_title: raw.recipe_title,
  category: raw.category,
  subcategory: raw.subcategory,
  main_ingredient: raw.main_ingredient ?? "unknown",

  content: {
   description: raw.description,
   ingredients: raw.ingredients ?? [],
   directions: raw.directions ?? [],
   ingredient_text: raw.ingredient_text,
   directions_text: raw.directions_text,
   combined_text: raw.combined_text,
  },

  raw: {
   ingredients_raw: raw.ingredients_raw ?? [],
   directions_raw: raw.directions_raw ?? [],
   ingredients_canonical: raw.ingredients_canonical ?? [],
  },

  classification: {
   cuisine_list: raw.cuisine_list ?? [],
   course_list: raw.course_list ?? [],
   tastes: raw.tastes ?? [],
   primary_taste: raw.primary_taste,
   secondary_taste: raw.secondary_taste,
  },

  timing: {
   num_ingredients: applyNumericMode(raw.num_ingredients, schemaType),
   num_steps: applyNumericMode(raw.num_steps, schemaType),
   fast_hits: applyNumericMode(raw.fast_hits, schemaType),
   slow_hits: applyNumericMode(raw.slow_hits, schemaType),
   medium_hits: applyNumericMode(raw.medium_hits, schemaType),
   cook_speed: raw.cook_speed,
   difficulty: raw.difficulty,
   est_prep_time_min: applyNumericMode(raw.est_prep_time_min, schemaType),
   est_cook_time_min: applyNumericMode(raw.est_cook_time_min, schemaType),
   cook_time: applyNumericMode(raw.cook_time, schemaType),
   prep_time: applyNumericMode(raw.prep_time, schemaType),
  },

  diet: {
   is_vegan: raw.is_vegan,
   is_vegetarian: raw.is_vegetarian,
   is_halal: raw.is_halal,
   is_kosher: raw.is_kosher,
   is_nut_free: raw.is_nut_free,
   is_dairy_free: raw.is_dairy_free,
   is_gluten_free: raw.is_gluten_free,
   dietary_profile: raw.dietary_profile ?? [],
   healthiness_score: applyNumericMode(raw.healthiness_score, schemaType),
   health_flags: raw.health_flags ?? [],
   health_level: raw.health_level,
  },
 };
}

export async function importRecipesFromFile(
 options: ImportRecipesOptions
): Promise<number> {
 const {
  filePath,
  schemaType = (process.env.SCHEMA_TYPE as SchemaTypeMode) || "default",
  fraction = 0.8,
  batchSize = 1000,
 } = options;

 const resolvedPath = path.resolve(filePath);
 console.log(`Reading recipes from: ${resolvedPath}`);
 console.log(`SCHEMA_TYPE=${schemaType}, fraction=${fraction}, batchSize=${batchSize}`);

 if (!fs.existsSync(resolvedPath)) {
  throw new Error(`File not found: ${resolvedPath}`);
 }

 const stats = fs.statSync(resolvedPath);
 console.log(`File size: ${stats.size} bytes`);

 const data = await fsp.readFile(resolvedPath, "utf-8");
 console.log("File read. Parsing JSON...");

 const raw = JSON.parse(data);
 if (!Array.isArray(raw)) {
  throw new Error("Expected JSON file to contain an array of recipes");
 }

 console.log(`Found ${raw.length} recipes.`);
 const limit = Math.floor(raw.length * fraction);
 console.log(`Importing ${limit} recipes (${fraction * 100}% of dataset)...`);

 const shouldCreateIndex = process.env.IMPORT_CREATE_INDEX === "true";

 if (shouldCreateIndex) {
  console.log("Index creation ENABLED → synchronizing indexes...");
  await RecipeModel.syncIndexes();

  const indexes = await RecipeModel.collection.listIndexes().toArray();
  console.log(`Indexes created: ${indexes.length}`);
  indexes.forEach((idx, i) => {
   console.log(`  [${i + 1}] ${idx.name}: ${JSON.stringify(idx.key)}`);
  });

 } else {
  console.log("Index creation DISABLED → skipping syncIndexes().");
 }



 const collection = RecipeModel.collection;

 console.log("Deleting existing recipes...");
 await collection.deleteMany({});
 console.log("Existing recipes deleted.");

 let insertedCount = 0;

 for (let i = 0; i < limit; i += batchSize) {
  const slice = raw.slice(i, i + batchSize);
  const ops: BulkWriteOp[] = slice.map((rawDoc) => {
   const doc = mapRawRecipe(rawDoc, schemaType);
   return { insertOne: { document: doc } };
  });

  if (ops.length > 0) {
   await (collection as any).bulkWrite(ops, { ordered: false });
   insertedCount += ops.length;
  }

  if (i === 0 || (i / batchSize) % 10 === 0) {
   console.log(`Progress: inserted ${insertedCount}/${limit}`);
  }
 }

 console.log(`Import complete. Inserted ${insertedCount} recipes.`);
 return insertedCount;
}
