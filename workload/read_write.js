import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://api:8080";

export const options = {
  vus: 32,
  duration: "2m",
  thresholds: {
    http_req_duration: ['p(95)<1000'], // tighten/loosen as needed
  },
};

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

export default function () {
  if (Math.random() < 0.7) {
    // READ
    const tenantId = rand(1, 4);
    const res = http.get(`${BASE_URL}/events?tenant_id=${tenantId}&limit=100`);
    check(res, { "200": (r) => r.status === 200 });
  } else {
    // WRITE
    const payload = JSON.stringify({
      tenant_id: rand(1, 4),
      user_id: rand(1, 100000),
      ts: new Date().toISOString(),
      kind: "event",
      payload: { v: Math.random() }
    });
    const res = http.post(`${BASE_URL}/ingest`, payload, {
      headers: { "Content-Type": "application/json" }
    });
    check(res, { "201": (r) => r.status === 201 });
  }
  sleep(0.05);
}
