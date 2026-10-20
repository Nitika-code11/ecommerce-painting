# Performance targets and load testing

## Targets

Measured as the 95th percentile (p95) over a test run. These are the thresholds enforced by
[`load-tests/catalogue.js`](../load-tests/catalogue.js); k6 exits non-zero if any is missed.

| Area | Target | Why |
| --- | --- | --- |
| Reads (`GET /api/paintings`, search, detail) | p95 < 300 ms | Page loads should feel instant; this is the bulk of traffic |
| Writes (admin create / update / delete) | p95 < 600 ms | Rare, and the user is waiting on a button |
| Sign-in (`POST /api/auth/login`) | p95 < 800 ms | BCrypt is slow on purpose; faster would mean weaker password hashing |
| Errors | < 1 % of requests fail | Availability |
| Functional checks inside the test | > 99 % pass | Fast but wrong answers do not count |

Targets are for the API alone under the load profile below. They are a starting point to revisit with real traffic
numbers, and they say nothing about the frontend (that would need browser-level measurements such as Lighthouse).

## Load profile

| Scenario | Who | Load |
| --- | --- | --- |
| `browsers` | Anonymous visitors: list, search, open a painting, 1 s think time | ramps 0 → 40 virtual users over 20 s, holds 40 for 40 s, ramps down |
| `admins` | Signed-in administrators: create → update → delete one painting, 2 s think time | 3 virtual users for 70 s |

## Running it

Install [k6](https://k6.io) (`winget install GrafanaLabs.k6` on Windows), start the backend with the dev profile, then:

```bash
k6 run load-tests/catalogue.js                 # full profile, about 70 s
k6 run -e PROFILE=smoke load-tests/catalogue.js # 1 user, 20 s: a quick sanity check
k6 run -e BASE_URL=https://staging.example.com -e ADMIN_USERNAME=... -e ADMIN_PASSWORD=... load-tests/catalogue.js
```

The test signs in once as an administrator, and cleans up every painting it creates. Use a test environment:
**do not point the write scenario at production data.**

## Result recorded on the development machine

Full profile against `./mvnw spring-boot:run` (dev profile, in-memory H2, same laptop as the load generator):

| Measure | Result | Target |
| --- | --- | --- |
| Requests / failures | 6,913 / 0 (0.00 %) | < 1 % |
| Reads p95 | 3.5 ms | < 300 ms |
| Writes p95 | 6.0 ms | < 600 ms |
| Sign-in p95 | 154.6 ms | < 800 ms |
| Checks passed | 9,111 of 9,111 (100 %) | > 99 % |
| Throughput | about 98 requests/s | n/a |

**Read this with care.** The database is in-memory H2 holding about ten rows, the client and server share one
machine, and there is no network. The numbers prove the thresholds work and that nothing is pathologically slow;
they are *not* a capacity estimate. Meaningful numbers need the target stack (PostgreSQL, a realistic row count,
the real network) and a heavier profile. Likely first bottleneck as data grows: the `LIKE '%term%'` title search,
which cannot use an ordinary index (see the roadmap for a proper search index).
