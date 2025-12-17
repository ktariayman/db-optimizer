// src/models/recipe.ts
import { Schema, model, InferSchemaType } from "mongoose";

const contentSchema = new Schema(
 {
  description: String,
  ingredients: [String],
  directions: [String],
  ingredient_text: String,
  directions_text: String,
  combined_text: String,
 },
 { _id: false }
);

const rawSchema = new Schema(
 {
  ingredients_raw: [String],
  directions_raw: [String],
  ingredients_canonical: [String],
 },
 { _id: false }
);

const classificationSchema = new Schema(
 {
  cuisine_list: [String],
  course_list: [String],
  tastes: [String],
  primary_taste: String,
  secondary_taste: String,
 },
 { _id: false }
);


const timingSchema = new Schema(
 {
  num_ingredients: Schema.Types.Number,
  num_steps: Schema.Types.Number,
  fast_hits: Schema.Types.Number,
  slow_hits: Schema.Types.Number,
  medium_hits: Schema.Types.Number,
  cook_speed: String,
  difficulty: String,
  est_prep_time_min: Schema.Types.Number,
  est_cook_time_min: Schema.Types.Number,
  cook_time: Schema.Types.Number,
  prep_time: Schema.Types.Number,
 },
 { _id: false }
);

const dietSchema = new Schema(
 {
  is_vegan: Boolean,
  is_vegetarian: Boolean,
  is_halal: Boolean,
  is_kosher: Boolean,
  is_nut_free: Boolean,
  is_dairy_free: Boolean,
  is_gluten_free: Boolean,
  dietary_profile: [String],
  healthiness_score: Schema.Types.Number,
  health_flags: [String],
  health_level: String,
 },
 { _id: false }
);

const recipeSchema = new Schema(
 {
  recipe_title: { type: String },

  category: { type: String },
  subcategory: { type: String },

  main_ingredient: { type: String, default: "unknown" },

  content: contentSchema,
  raw: rawSchema,
  classification: classificationSchema,
  timing: timingSchema,
  diet: dietSchema,
 },
 {
  collection: "recipes",
  strict: false,
  timestamps: false,
  autoIndex: false,
 }

);




if (process.env.IMPORT_CREATE_INDEX === "true") {
 console.log("Indexing enabled for Recipe model.");
 recipeSchema.index({ recipe_title: "text" });
 recipeSchema.index({ "content.ingredients": 1 });
} else {
 console.log("Indexing disabled for Recipe model.");
}


export type Recipe = InferSchemaType<typeof recipeSchema>;
export const RecipeModel = model<Recipe>("Recipe", recipeSchema);
