# Cross-milestone contracts and ownership

Status: planning decisions to encode as runtime schemas/types in F1–F4 and domain slices. No endpoints or tables below should be presumed implemented. This registry resolves naming/ownership conflicts across milestone reviews; schema migration details come later.

## Transport conventions

One `/api/v1` API serves web and native. All product endpoints authenticate unless explicitly designated published/public. Supabase Auth is a separate provider protocol. Requests carry a verified actor; client-supplied owner IDs never authorize access. Collections are bounded/cursor-paginated, decimals carry units/currency, dates distinguish calendar date from instant, and responses carry resource/source versions and freshness where applicable.

Stable errors distinguish validation, unauthenticated, forbidden, not found, conflict, quota/rate limit, dependency unavailable and timeout. Include request ID and safe recovery guidance. Never serialize raw provider errors/secrets. Unknown financial values are nullable with a reason, not a default zero. Jobs expose accepted/queued/running/validating/succeeded/failed/cancelled/expired states as appropriate to the workflow.

## Canonical routes and API resources

| Owner | UI route family | API family | Consuming milestones |
| --- | --- | --- | --- |
| M1 identity | `/login`, `/auth/*`, `/app/onboarding` | `/me`, `/me/onboarding` | All |
| M2 portfolios | `/app/portfolios`, `/:portfolioId` | `/portfolios`, `/accounts`, `/imports`, `/broker-connections` | M3–M6, M8 |
| M2 target adoption | Under selected portfolio | `/portfolios/:portfolioId/target-adoptions` | M4 writes through use case; M6 reads |
| M2.5a catalogue | `/app/funds`, `/app/funds/compare`, `/app/funds/:listingId` | `/funds`, `/funds/compare`, `/model-portfolios` | M2.5b–M6, M8 |
| M2.5a admin | `/admin/funds` | `/admin/funds`, `/admin/catalogue-imports`, `/admin/catalogue-releases` | M7 assembles admin navigation |
| M2.5b distributions | `/app/funds/:listingId/distributions` | `/funds/:listingId/distributions`, `/funds/:listingId/yield` | Catalogue, M3–M6 |
| M2.5b admin | `/admin/distributions` | `/admin/distribution-imports`, `/admin/distribution-releases` | M7 |
| M3 calculations | `/app/calculator` | `/calculator/assumptions`, `/calculator/scenarios` | M4–M6, M8 |
| M4 goals | `/app/goals`, `/app/goals/:goalId/plans/:planId` | `/goals`, `/goals/:goalId/generations`, `/goals/:goalId/plans` | M5, M6, M8 |
| M5 advisor/content | `/app/advisor`, `/admin/content` | `/advisor/conversations`, `/advisor/conversations/:id/turns`, `/advisor/turns/:id`, `/admin/content` | M6 explanations, M8 |
| M6 check-ins | Portfolio/notification routes | `/check-ins`, `/notification-preferences` | M7 support, M8 |
| M8 devices | Native system settings | `/devices`, `/push-preferences` | M6 delivery through notification service |

API names in milestone PRDs that are more detailed are suggestions to reconcile against this registry when implementing, not separate APIs. The catalogue parameter is a listing ID even if a UI label says “fund.” Match static `/compare` before dynamic listing routes. The web Explore navigation label may use `/app/funds`; old `/app/discover` can redirect during migration.

## Domain facts and data ownership

| Fact | Authoritative owner | Invariant |
| --- | --- | --- |
| Actor and trusted staff capability | M1 | Server verified; never profile-editable authorization |
| Portfolio/account/holding snapshot | M2 | Same-owner relationships; atomic source revision; currency/as-of explicit |
| Broker cash receipt | M2 | Actual user activity, private; not a shared fund announcement |
| Fund and tradeable listing identity | M2.5a | Stable identity, ticker aliases/exchange/currency; no ticker-only joins |
| Client model portfolio/template | M2.5a | Immutable published constituent/weight revision with workbook provenance |
| Fund distribution announcement | M2.5b | Shared dated per-unit event and provenance; no inferred user entitlement |
| Distribution yield and price basis | M2.5b | Named versioned method and compatible dated price; never yield-on-cost synonym |
| Financial forecast | M3 | Shared deterministic engine, explicit tax/inflation/inputs/version; server recomputes saved result |
| Goal and proposed allocation | M4 | Private immutable input/output revisions, valid catalogue IDs and constraints |
| Applied portfolio targets | M2 | Explicit user adoption of a proposal/manual target; versioned and never implicitly equal-weight |
| Goal questionnaire | M4 first version | Stable schema/answer version; M5 adds advisor questions without overwriting existing answers |
| Knowledge corpus/retrieval | M5 | Published permitted content, traceable chunks/versions, access filter before retrieval |
| Check-in/explanation record | M6 | Pins actual snapshot + applied target + relevant goal/calculation versions |
| Native cached view | M8 client | Dated replica of server facts; cache cannot authorize or silently commit actions |

M4 may retain an adoption reference for display, but the M2 transaction and target revision are authoritative. A failed adoption cannot be marked successful by either module. M6 cannot treat a generated but unadopted plan as the target.

Management fee and MER are separate named attributes. A raw workbook number cannot be renamed to a different fee basis. Historical performance snapshots, Client target yields, sourced distribution yield, actual income and forecast income remain different types/labels.

## Minimum data passed between modules

- Portfolio valuation: portfolio/snapshot ID and owner context, base currency, native amounts, converted amounts if available, FX source/date, completeness, as-of and revision.
- Catalogue selection: listing/fund ID, revision/release, currency/exchange, eligibility attributes with provenance/unknown state, archival status, model-template revision if used.
- Distribution metric: listing ID, metric type/value or unavailable reason, distribution release, compatible price observation, calculation version and effective/observation times.
- Forecast: normalized input snapshot, model/assumption versions, gross/net/real result series, milestone status and source references. A saved goal holds a reference rather than copying a second formula implementation.
- AI invocation: actor/job/task, minimized approved facts, immutable source IDs, prompt/model/schema versions, token/deadline/cost budgets, validated output and usage. Provider secrets never appear in the contract visible to clients.
- Applied targets: portfolio owner/version, exact listing/asset identities and weights, target basis, source proposal/manual revision and explicit confirmation. Unmatched holdings remain visible and require a policy; do not silently drop them from drift.

## Events and side effects

Add events only with a real consumer. Canonical names use `domain.action.v1`, for example `catalogue.published.v1`, `distributions.published.v1`, `portfolio.snapshot_published.v1`, `portfolio.targets_adopted.v1`, `goal.plan_saved.v1`, and `knowledge.source_withdrawn.v1`.

Each event has ID, schema version, aggregate ID/version, occurrence time, request/job correlation and only necessary scope metadata. Publish in a transactional outbox where consistency requires it; consumers deduplicate by event ID and reject stale aggregate versions. Do not embed account secrets, full financial payloads or transcripts in general events/logs.

Catalogue/distribution updates trigger cache invalidation or refresh of derived facts; they do not silently mutate saved plans. Source withdrawal invalidates retrieval eligibility even if an old embedding remains physically stored. Account deletion/revocation cancels or suppresses late job publications. Notification delivery is a separately recorded side effect.

## Decisions resolved during synthesis

1. Use root `api/`, `packages/server`, and `packages/test-support` from ARCHITECTURE, not competing proposed workspace layouts.
2. User-context ordinary writes preserve RLS. Blanket service-role writes from the earlier feature design are rejected as a default. Members can reach permitted Data API surfaces directly, so non-exposed base tables, reviewed projections/commands and database invariants must protect the same behavior without trusting API-only validation.
3. Catalogue identity may be resolved after initial manual portfolio work; unresolved external holdings remain valid private assets. M2 does not depend on importing every fund first.
4. M4 does not depend on full M5 RAG. M1 establishes interfaces; the actual bounded model adapter ships before M4 acceptance; M5 extends it.
5. M2 owns applied targets; M4 owns proposals. The questionnaire's first version lands in M4, with M5 extension later.
6. Native compatibility begins after M1 because mobile is primary; full M8 acceptance still includes native functionality, push and stores.
7. All milestones inherit the 2,500-user/1,000-online beta workload and common error/latency gates. Module stress tests add to, not replace, shared acceptance.
8. A 10–20-person feature-scoped pilot precedes expanded M1–M5 beta admission; the latter needs capacity and operational gates beyond a small pilot. Full signed M7 acceptance requires pilot evidence on full launch scope including M6; early preview success is not that acceptance.

These decisions are planning defaults to encode and test, not evidence that the code currently follows them.
