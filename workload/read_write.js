import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://api:8080";

export const options = {
  vus: 64,
  duration: "2m",
  thresholds: {
    http_req_duration: ["p(95)<1000"],
  },
};

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

export default function () {
  if (Math.random() < 0.7) {
    // READ: your API requires visitorid (+ optional from/to/limit)
    const visitor = rand(1, 4);               // keep a small set we also write to
    const now = Date.now();
    const from = now - 24 * 60 * 60 * 1000;   // last 24h
    const url = `${BASE_URL}/events?visitorid=${visitor}&from=${from}&to=${now}&limit=100`;

    const res = http.get(url, { tags: { endpoint: "GET /events" } });
    check(res, { "GET /events -> 200": (r) => r.status === 200 });
  } else {
    // WRITE: match POST /ingest schema
    const payload = JSON.stringify({
      timestamp: Date.now(),               // ms epoch (number)
      visitorid: String(rand(1, 4)),       // align with read set
      event: "view",
      itemid: String(rand(1, 1000)),
      transactionid: null,
    });

    const res = http.post(`${BASE_URL}/ingest`, payload, {
      headers: { "Content-Type": "application/json" },
      tags: { endpoint: "POST /ingest" },
    });
    check(res, { "POST /ingest -> 201": (r) => r.status === 201 });
  }

  sleep(0.05);
}
