import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://api:8080";

export const options = {
  vus: 10,
  iterations: 1000,
  thresholds: {
    http_req_duration: ["p(95)<1000"],
  },
};

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function () {
  const r = Math.random();

  if (r < 0.7) {
    const res = http.get(`${BASE_URL}/recipes`, {
      tags: { endpoint: "GET /recipes" },
    });

    check(res, {
      "GET /recipes -> 200": (r) => r.status === 200,
    });
  }

  else if (r < 0.9) {
    const payload = JSON.stringify({
      recipe_title: `New Recipe ${Date.now()}`,
      ingredients: ["ingredient1", "ingredient2"],
      directions: ["Step 1", "Step 2"],
    });

    const res = http.post(`${BASE_URL}/recipes`, payload, {
      headers: { "Content-Type": "application/json" },
      tags: { endpoint: "POST /recipes" },
    });

    check(res, {
      "POST /recipes -> 201": (r) => r.status === 201,
    });
  }

  else {
    const receivedBefore = new Date(
      Date.now() - rand(1000, 60000)
    ).toISOString();

    const res = http.get(
      `${BASE_URL}/recipes?receivedBefore=${receivedBefore}&limit=20`,
      { tags: { endpoint: "GET /recipes (time-filtered)" } }
    );

    check(res, {
      "GET /recipes (time-filtered) -> 200": (r) => r.status === 200,
    });
  }

  sleep(0.1);
}
