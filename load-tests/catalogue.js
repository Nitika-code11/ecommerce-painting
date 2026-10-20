// k6 load test for the painting API.  Run with:  k6 run load-tests/catalogue.js
//
// What it simulates
//   - "browsers": anonymous visitors who list the catalogue, page through it, search and open a painting.
//     This is the bulk of real traffic, so it gets most of the virtual users.
//   - "admins":   a few signed-in administrators who create, update and delete a painting.
//
// The pass/fail rules (thresholds) below are the performance targets documented in docs/performance.md.
// k6 exits non-zero if any threshold is missed, so this can gate a pipeline.
//
// Configuration (environment variables):
//   BASE_URL        API origin                    default http://localhost:8080
//   ADMIN_USERNAME  account used by the admin VUs default admin     (the dev-profile account)
//   ADMIN_PASSWORD  its password                  default admin12345
//   PROFILE         smoke | load                  default load      (smoke = 1 VU, 20 s, for a quick sanity run)
import http from "k6/http";
import { check, group, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";
const ADMIN_USERNAME = __ENV.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || "admin12345";
const SMOKE = (__ENV.PROFILE || "load") === "smoke";

// Search terms that exist in the dev sample data, so the filter path returns real rows.
const SEARCH_TERMS = ["sun", "night", "wave", "lil", "the"];

export const options = {
  scenarios: SMOKE
    ? { browsers: { executor: "constant-vus", vus: 1, duration: "20s", exec: "browse" } }
    : {
        // Ramp up, hold, ramp down: shows how latency behaves as concurrency grows.
        browsers: {
          executor: "ramping-vus",
          exec: "browse",
          startVUs: 0,
          stages: [
            { duration: "20s", target: 40 },
            { duration: "40s", target: 40 },
            { duration: "10s", target: 0 },
          ],
        },
        admins: { executor: "constant-vus", exec: "manage", vus: 3, duration: "70s" },
      },
  thresholds: {
    // Reliability: almost nothing may fail.
    http_req_failed: ["rate<0.01"],
    // Latency targets (95th percentile) per kind of request. See docs/performance.md.
    "http_req_duration{kind:read}": ["p(95)<300"],
    "http_req_duration{kind:write}": ["p(95)<600"],
    "http_req_duration{kind:login}": ["p(95)<800"], // BCrypt is deliberately slow
    // Every check() below must hold in at least 99% of iterations.
    checks: ["rate>0.99"],
  },
};

// Runs once before the test: signs in as the admin so write VUs can reuse one token.
export function setup() {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD }),
    { headers: { "Content-Type": "application/json" }, tags: { kind: "login" } },
  );
  if (res.status !== 200) {
    // Without a token the admin scenario cannot run; fail loudly rather than reporting a misleading pass.
    throw new Error(`Admin login failed (${res.status}). Start the backend with the dev profile or set ADMIN_USERNAME/ADMIN_PASSWORD.`);
  }
  return { token: res.json("accessToken") };
}

// Scenario "browsers": anonymous read-only traffic.
export function browse() {
  group("list first page", () => {
    const res = http.get(`${BASE_URL}/api/paintings`, { tags: { kind: "read" } });
    check(res, {
      "list is 200": (r) => r.status === 200,
      "list has content": (r) => r.json("content").length > 0,
    });
  });

  group("search by title", () => {
    const term = SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];
    const res = http.get(`${BASE_URL}/api/paintings?title=${term}`, { tags: { kind: "read", name: "GET /api/paintings?title=" } });
    check(res, { "search is 200": (r) => r.status === 200 });
  });

  group("open one painting", () => {
    // Ids 1..10 are the dev sample data.
    const id = 1 + Math.floor(Math.random() * 10);
    const res = http.get(`${BASE_URL}/api/paintings/${id}`, { tags: { kind: "read", name: "GET /api/paintings/{id}" } });
    check(res, { "detail is 200": (r) => r.status === 200 });
  });

  sleep(1); // think time: a person reads the page before clicking again
}

// Scenario "admins": create -> update -> delete one painting per iteration, cleaning up after itself.
export function manage(data) {
  const params = (kind, name) => ({
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.token}` },
    tags: { kind, name },
  });
  const body = (title) => JSON.stringify({ title, artist: "Load Test", price: 10.5, stock: 1 });

  const created = http.post(`${BASE_URL}/api/paintings`, body(`Load ${__VU}-${__ITER}`), params("write", "POST /api/paintings"));
  const ok = check(created, { "create is 201": (r) => r.status === 201 });
  if (!ok) return;

  const id = created.json("id");
  const updated = http.put(`${BASE_URL}/api/paintings/${id}`, body(`Load ${__VU}-${__ITER} (edited)`), params("write", "PUT /api/paintings/{id}"));
  check(updated, { "update is 200": (r) => r.status === 200 });

  const removed = http.del(`${BASE_URL}/api/paintings/${id}`, null, params("write", "DELETE /api/paintings/{id}"));
  check(removed, { "delete is 204": (r) => r.status === 204 });

  sleep(2);
}
