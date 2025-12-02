import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://api:8080";

export const options = {
  vus: 30,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<1000"],
  },
};

const INGREDIENTS = ["chicken", "garlic", "onion", "beef", "pasta", "tomato", "cheese", "rice"];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export default function () {
  if (Math.random() < 0.8) { // 80% Reads
    const url = `${BASE_URL}/recipes`;

    const res = http.get(url, { tags: { endpoint: "GET /recipes" } });
    check(res, { "GET /recipes -> 200": (r) => r.status === 200 });
  } else { // 20% Writes
    const payload = JSON.stringify({
      recipe_title: `New Recipe ${Date.now()}`,
      ingredients: ["ingredient1", "ingredient2"],
      directions: ["Step 1", "Step 2"]
    });

    const res = http.post(`${BASE_URL}/recipes`, payload, {
      headers: { "Content-Type": "application/json" },
      tags: { endpoint: "POST /recipes" },
    });
    check(res, { "POST /recipes -> 201": (r) => r.status === 201 });
  }

  sleep(0.1); // Increased sleep slightly to be gentler
}
