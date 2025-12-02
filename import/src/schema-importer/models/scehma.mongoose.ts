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
  num_ingredients: Schema.Types.Mixed, // string | number (for SCHEMA_TYPE modes)
  num_steps: Schema.Types.Mixed,
  fast_hits: Schema.Types.Mixed,
  slow_hits: Schema.Types.Mixed,
  medium_hits: Schema.Types.Mixed,
  cook_speed: String,
  difficulty: String,
  est_prep_time_min: Schema.Types.Mixed,
  est_cook_time_min: Schema.Types.Mixed,
  cook_time: Schema.Types.Mixed,
  prep_time: Schema.Types.Mixed,
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
  healthiness_score: Schema.Types.Mixed,
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
 }
);

// ============================================================================
// INDEXES
// ============================================================================

// Text search on recipe title
recipeSchema.index({ recipe_title: "text" });

// Single field indexes for filtering
recipeSchema.index({ category: 1 });
recipeSchema.index({ subcategory: 1 });
recipeSchema.index({ main_ingredient: 1 });

// Classification indexes
recipeSchema.index({ "classification.cuisine_list": 1 });
recipeSchema.index({ "classification.course_list": 1 });
recipeSchema.index({ "classification.primary_taste": 1 });

// Dietary filter indexes
recipeSchema.index({ "diet.is_vegan": 1 });
recipeSchema.index({ "diet.is_vegetarian": 1 });
recipeSchema.index({ "diet.is_gluten_free": 1 });
recipeSchema.index({ "diet.is_dairy_free": 1 });
recipeSchema.index({ "diet.health_level": 1 });

// Timing indexes for range queries
recipeSchema.index({ "timing.cook_time": 1 });
recipeSchema.index({ "timing.prep_time": 1 });
recipeSchema.index({ "timing.num_ingredients": 1 });

// Compound indexes for common query combinations
recipeSchema.index({ category: 1, subcategory: 1 });
recipeSchema.index({ category: 1, "diet.is_vegetarian": 1 });


export type Recipe = InferSchemaType<typeof recipeSchema>;
export const RecipeModel = model<Recipe>("Recipe", recipeSchema);
