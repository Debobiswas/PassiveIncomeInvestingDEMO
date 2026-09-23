# Capacity, reliability and cost plan

Status: proposed workload and acceptance targets. No load benchmark has been run; no claim of capacity is established by this document.

## What the user actually specified

- Private beta: 2,500 users; approximately 1,000 online at the same time.
- Initial broader launch aspiration: 10,000 users, activity definition still to be confirmed.
- Growth aspiration: 300,000 active users, activity window and peak concurrency still to be confirmed.
- Mobile is primary. Web provides the same product for people who prefer it, including older users.

One thousand open mobile apps are not necessarily one thousand requests per second or one thousand database connections. Local rendering and cached deterministic calculations can reduce API work; frequent polling, reconnect storms, chat, sync, and background retries can increase it. The workload model must name actions and rates.

## Proposed beta traffic model

The following is an engineering hypothesis to validate using beta telemetry. Idle sessions retain no database connection and do not need a permanent WebSocket for static dashboards.

| Component | Explicit assumption | Derived demand |
| --- | --- | --- |
| Interactive sessions | 1,000 concurrent sessions, 4 lightweight reads/minute each | 66.7 read requests/second |
| Ordinary writes | 0.2 writes/minute per session | 3.3 write requests/second |
| Test headroom | Round ordinary workload up | 100 read + 10 write requests/second sustained |
| Reconnect burst | 1,000 clients reconnect and issue 4 reads over 10 seconds | 400 read requests/second burst, plus bounded auth refresh |
| Brokerage sync | 500 linked beta users, 2 accounts each, initial daily refresh hypothesis | 1,000 account syncs/day; stagger jobs and obey vendor quota |
| Chat/AI | 5% of 1,000 online users submit one prompt/minute | 0.83 new generation requests/second; at 10 seconds mean service time, about 8.3 in-flight generations |
| AI stress lane | 5x AI hypothesis | 4.2 requests/second; explicit admission control, not unlimited fan-out |

Provider requests per account sync and actual AI duration must be measured; the counts above are not vendor quota promises. Use burst/admission tests without paying for thousands of real generations. Verify representative real-provider requests separately and record which limits are stubbed.

Capacity is also about data size. Seed 2,500 synthetic users, 2 portfolios/user, 2 accounts/portfolio and 40 positions/account: 400,000 current position rows. Seed meaningful skew (one large import, many small portfolios), histories, catalogue/distribution versions, and private conversations. Do not imply every user actually has those records. Retained full daily snapshots would add approximately 146 million position rows/year at that density; decide snapshot compaction/change retention before adopting that storage strategy. Storage/backups and query costs must be modelled, not only request throughput.

## Benchmark protocol

1. Use an isolated staging project in the intended North American region and record commit, instance size, runtime version, schema/index revision, fixture generator/seed, cache state, request mix and external-provider mode.
2. Run a smoke test, then a ramp to the beta workload; sustain 100 read + 10 ordinary write RPS for 30 minutes with 1,000 virtual sessions and realistic think time. Use an open-arrival test or report dropped/late arrivals; a closed loop alone can conceal saturation as response times slow.
3. Exercise the 400-read-RPS reconnect burst, preserving retry jitter and cached-version checks; ensure the test client does not multiply failures through immediate retries.
4. Run a two-hour soak at normal beta demand while imports, broker refresh and catalogue publication run. Check memory, pool saturation, job age, lock waits, consistency, and storage growth.
5. Exercise a cold-cache run, a large permitted upload, concurrent imports to the same portfolio, provider 429/timeouts, worker crash after external success, and database pressure.
6. Test AI admission separately at the baseline/stress lanes. Queue excess work with an honest state or reject with a retry time. Basic reads must stay healthy during AI saturation.
7. Save raw output and a short interpreted report; each missed target gets an owner, remediation and rerun. Do not mark a passing mock-only benchmark as provider-integrated capacity.

## Proposed beta gates

| Area | Gate under declared workload |
| --- | --- |
| Ordinary cached/read API | p95 <=500 ms; p99 <=1,500 ms end-to-end in the stated region |
| Ordinary transactional writes | p95 <=800 ms; errors/conflicts measured separately |
| Server errors | <0.5% unexpected 5xx; no unauthorized cross-user data; no lost acknowledged writes |
| Reconnect burst | Bounded load shedding/retries, no uncontrolled connection growth; return to steady SLO within 60 seconds |
| DB connections | <=70% of configured safe connection budget sustained; no exhausted pool under beta workload |
| Queue | Oldest age and service rate within each workload's declared objective; poison job does not block peers |
| AI | p95 first user-visible progress <=2 seconds for accepted requests; measured generation latency budget set after real model evaluation; explicit bounded timeout and queue ETA |
| Browser first route | Proposed <=200 kB gzip initial JavaScript excluding deferred route chunks; measured on a representative mid-range device |
| Web user experience | Target LCP <=2.5s, INP <=200ms, CLS <=0.1 at p75 on declared devices/network; measurements required |
| Availability | Proposed beta monthly target 99.5%; narrow 99.9% production API objective only after monitoring/recovery evidence |
| Recovery | Proposed beta RPO <=24h and RTO <=4h; validate backup tier and restore drill before promise; revisit for broader launch |

Per-milestone performance examples inherit this beta workload. Lower-volume development smoke tests are not substitutes for the shared release gate. A failing accessibility or tenant-isolation test blocks release regardless of average latency. Web responsiveness thresholds follow the [Core Web Vitals guidance](https://web.dev/articles/vitals); the API, bundle and recovery thresholds above are proposed project budgets.

## Scaling toward 10k and 300k

For 10,000 users, first clarify whether the figure is registered, daily active, or concurrent. If the same 40% concurrency fraction as beta applied, peak sessions would be 4,000: the hypothesis would imply about 267 reads/second before headroom, not 10,000/second. This is an illustration, not a forecast.

For 300,000 active users, measure session distribution before extrapolating. A hypothetical 5% online peak is 15,000 sessions and 1,000 reads/second at 4 reads/minute; 40% would mean 120,000 sessions and 8,000 reads/second. Either figure needs a separate budget, provider contract, storage forecast and load campaign. Do not extrapolate a 1,000-session test linearly into a guarantee.

Scale in response to measured pressure: remove N+1/unbounded queries; index and cache published catalogue versions; precompute expensive aggregates; bound queue fan-out; increase database/worker capacity after measuring; consider replicas for suitable shared reads. Partition histories or split services only when representative evidence shows a bottleneck and operational ownership is clear. Public-reference caching must never mix in private portfolio state.

## Controls that reduce server load

- Cache immutable published catalogue/content versions and fetch deltas/version IDs.
- Use pagination and compact aggregate dashboard responses; avoid one API call per card or holding.
- Compute slider previews locally with the same versioned deterministic math; persist meaningful actions, not each keystroke.
- Refresh on meaningful foreground/reconnect events with jitter and freshness windows; avoid uniform rapid polling by every client.
- Make broker sync asynchronous, deduplicated and rate-limited. Fetch shared distributions once per publication rather than per user.
- Bound file decompression, row count, AI context, output tokens, in-flight generations and provider concurrency.
- Keep the last good snapshot visible with its timestamp when dependencies fail.

## Observability and operating cost

Dashboards must separate API latency/error rate, cache-hit rate, query time/rows scanned, DB CPU/I/O/pool waits, worker throughput/oldest age/retries, broker requests/429s, model tokens/cost/latency, ingestion failures, data freshness and active sessions. Correlate request/job IDs without logging account numbers, credentials, raw user financial data or full chats by default.

Build a cost sheet from usage drivers: linked brokerage users/accounts and refresh cadence, database compute/storage/backups, object storage/egress, API/worker execution, monthly model tokens, transcription minutes, email/push, and observability. Use verified vendor quotes at implementation time. The agreement's indicative $150 CAD/month is not a tested budget for 1,000 concurrent users. Set alert, admission and stop thresholds before enabling paid calls.

The release evidence must identify who receives alerts, who can pause imports/sync/generation, how a poisoned job is replayed, and how a database restore is tested. Infrastructure access and paid provisioning remain external prerequisites; this planning work has not provisioned or load-tested any service.
