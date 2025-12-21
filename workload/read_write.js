import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

const SCHEMA_PATH = "/recipes/by-time";
const INGREDIENT_PATH = "/recipes/by-ingredient";

export const options = {
  vus: Number(__ENV.VUS || 10),
  iterations: Number(__ENV.ITERATIONS || 1000),
};

function normalGet() {
  const url = `${BASE_URL}/recipes`;
  const res = http.get(url, { tags: { name: "GET_normal" } });
  check(res, { "GET_normal status 200": (r) => r.status === 200 });
}

function postRecipe() {
  const payload = JSON.stringify({
    recipe_title: "k6 test",
    ingredients: ["salt", "pepper"],
    directions: ["mix", "cook"],
    cook_speed: "fast",
  });

  const res = http.post(`${BASE_URL}/recipes`, payload, {
    headers: { "Content-Type": "application/json" },
    tags: { name: "POST_recipe" },
  });

  check(res, { "POST status 2xx": (r) => r.status >= 200 && r.status < 300 });

}

function schemaSensitiveGet() {
  const maxPrep = 60;
  const url = `${BASE_URL}${SCHEMA_PATH}?maxPrep=${maxPrep}&limit=10`;
  const res = http.get(url, { tags: { name: "GET_schema_sensitive" } });
  check(res, { "GET_schema_sensitive status 200": (r) => r.status === 200 });
}

function ingredientGet() {
  const ingredients = ["salt and freshly ground black pepper",
    "1 teaspoon paprika",
    "1 tablespoon finely chopped fresh rosemary",
    "2 tablespoons butter"]; // exact matches
  const ing = ingredients[Math.floor(Math.random() * ingredients.length)];
  const url = `${BASE_URL}${INGREDIENT_PATH}?ingredient=${encodeURIComponent(ing)}&limit=10`;

  const res = http.get(url, { tags: { name: "GET_indexed_ingredient" } });
  check(res, { "GET_indexed_ingredient status 200": (r) => r.status === 200 });
}


export default function () {
  const r = Math.random();

  if (r < 0.60) {
    normalGet();              // 60% indexed query
  } else if (r < 0.80) {
    postRecipe();             // 20% 
  } else if (r < 0.90) {
    schemaSensitiveGet();     // 10% queries for testing schema
  } else {
    ingredientGet();          // 10% indexed query
  }

  sleep(1);
}