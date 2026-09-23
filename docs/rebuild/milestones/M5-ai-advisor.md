# M5 — Robo AI Advisor (RAG)

Status: proposed PRD; no requirement is accepted by this document. Authority: signed agreement page 2, §2.2, M5 ($6,500 CAD).
Signed coverage: vector database setup; content ingestion with Whisper transcription, chunking and embeddings; chat UI; guided questionnaire; objectivity layer; two-week prompt-tuning sprint.
Reviewed baselines: `master` at `4dbf440` and independent `feat/portfolio-import` at `f3b65e2`. Requirements marked C implement signed outputs; E requirements are proposed engineering gates.

## Outcome and boundaries

A member asks an investing education question, receives a readable answer grounded in permitted current sources, inspects its citations, and resumes the conversation on another device. When the question uses their portfolio or a calculation, the answer identifies authorized dated inputs and deterministic results. Unsupported questions produce an honest limitation or clarification.
The guided questionnaire reuses M4's versioned answers, asks only missing relevant questions, and explains how the answers affect the interaction. It does not silently infer suitability or overwrite a saved goal.
Mobile is primary and web offers equivalent financial behavior for users who prefer it, including older users. Plan for 2,500 beta members and 1,000 online sessions using the common workload model; this is not 1,000 simultaneous model requests or proven capacity for 300,000 users.
Non-goals: autonomous trading, open-ended web browsing by the assistant, arbitrary user-document uploads, clinical/legal/tax determinations, guaranteed investment outcomes, a separate AI platform, or replacement of M3 arithmetic and M4 allocation validation.
Linked third-party content requires permission review before ingestion; the agreement already authorizes project use of the supplied Client IP. The sponsorship admin dashboard remains out of scope, while identifying conflicts in answer sources is necessary for the contracted objectivity layer. Basic ETF administration and sponsor-format normalization remain required in M2.5a/b.

## Current implementation and salvage

Paths are relative to the repository root; feature references carry the `.claude/worktrees/portfolio-import/` prefix.

| Evidence | Finding and treatment |
| --- | --- |
| `robo-advisor/src/views/Plan.jsx:16`, `:62`, `:69` | Local questions and keyword-selected canned answers; review wording, replace all production response logic |
| `robo-advisor/src/views/Plan.jsx:655`, `:663`, `:678` | Fixture chat, component-only answers and timer response; no persisted conversation, shared questionnaire or provider integration |
| `robo-advisor/src/views/Advisor.jsx:17`, `:76`, `:101` | Legacy screen claims RAG while returning canned financial suggestions; remove misleading production claims and eventually retire duplicate screen |
| Feature `robo-advisor/src/views/Plan.jsx:678` | Same simulated response behavior; feature routing/auth do not implement M5 |
| Feature `robo-advisor/src/context/LiveProvider.jsx:1` | Explicit passthrough stub, not an advisor data provider |
| Feature `api/health.js` and `api/_lib/env.js`; `supabase/migrations/20260821000001_portfolio_import.sql` | API tree has no advisor endpoint; migration has portfolio records, no conversation/corpus/retrieval model |

Reuse visual message/grouping concepts only after readable text, touch controls and screen-reader review. Keep fixture conversations in `/demo`; production must never fall back to fake balances, invented yields or “RAG-powered” status without real retrieval.

## Requirements and acceptance mapping

| Requirement | Observable acceptance |
| --- | --- |
| M5-R01 [C] Vector database | M5-A01: a reviewed migration and real isolated-database test store/search versioned vectors, apply publication/permission filters before returning context, and meet measured retrieval quality/latency gates |
| M5-R02 [C] Whisper ingestion, chunking and embeddings | M5-A02: an authorized representative audio/video source completes actual Whisper transcription, timestamped chunking and actual embeddings; approved text also ingests; reruns are idempotent and failed work cannot publish a partial corpus |
| M5-R03 [C] Chat UI | M5-A03: an authenticated member sends a real request, sees truthful progress, receives grounded cited output and resumes the same saved conversation after reload/backgrounding and on a second device |
| M5-R04 [C] Guided questionnaire | M5-A04: existing M4 answers are reused by schema/revision; unanswered or stale questions can be completed/resumed; changing an answer creates a new revision and does not silently alter prior plans or messages |
| M5-R05 [C] Objectivity layer | M5-A05: approved policy/evaluation demonstrates balanced relevant tradeoffs, source-conflict disclosure, no sponsorship-based recommendation boost and no unsupported certainty; Client reviews examples and signs off the policy |
| M5-R06 [C] Two-week prompt tuning | M5-A06: a documented two-week sprint includes a baseline, reviewed failures, versioned changes, a locked holdout evaluation, real-model results and final release recommendation; elapsed time alone cannot satisfy the quality gates |
| M5-R07 [E] Provenance, rights and freshness | M5-A07: every published chunk resolves to a permitted source/version/location; withdrawal immediately blocks further retrieval/citation access and prevents in-flight publication; stale/conflicting evidence is labeled or withheld |
| M5-R08 [E] Tenant and prompt boundaries | M5-A08: user A's conversation, tool result, stream and private cache cannot be read by B; malicious sources cannot override policy, invoke unapproved tools or expose secrets/private data |
| M5-R09 [E] Deterministic financial facts | M5-A09: balances, yields, forecasts and allocations resolve to authorized module outputs with input/version/date; numeric mismatches, invented funds and unsupported calculations fail validation rather than reach the answer |
| M5-R10 [E] Reliability and cost | M5-A10: duplicate/reconnected requests reuse the original job, quota/provider failures terminate truthfully, cancellation prevents publication, and AI saturation leaves portfolio/catalogue reads inside shared SLOs |
| M5-R11 [E] Readability and parity | M5-A11: core chat/questionnaire/citation journeys pass keyboard/screen-reader checks, 200% web zoom and enlarged native text when the native shell exists; parity uses the same API and saved answer |

## Primary journey and states

1. Open `/app/advisor`; explain supported educational topics and whether portfolio context is included. No brokerage connection is required for general education.
2. Review reusable questionnaire answers and optionally complete relevant missing questions. Save acknowledged answers; do not force repetitive questioning for a general factual question.
3. Choose a conversation or begin one; submit a bounded question on deliberate action. Server authenticates, authorizes selected context, reserves budget and persists a turn/job.
4. Display accepted/queued/retrieving/answering/checking status as appropriate. Backgrounding, network loss or route changes do not create another generation.
5. Read a concise answer first, with expandable explanation, dated data and inline source references. Open a citation to its permitted source locator/timestamp; do not expose unrestricted storage URLs.
6. Ask a follow-up or return later; persisted conversation and answer versions remain available subject to withdrawal/deletion policies. Show source updates separately from historical answer text.

Distinguish no sources, no relevant evidence, conflicting evidence, stale evidence, unavailable tool data, quota exhaustion, provider outage, expired session and permission denial. Never turn missing data into zero or fill gaps with fixture responses.
If portfolio context is requested, name the selected portfolio and snapshot date; authorize it server-side for every tool execution. General content retrieval does not gain private data access.
Answer rendering treats generated markdown/links as untrusted: sanitize markup, validate citation targets and disallow executable content. Keep feedback/report controls visible and operable without hover.
Use the shared readability gates: ordinary body text at least 16px-equivalent, plain financial labels/currency, 44px touch targets, focus management, text alternatives and unclipped values. Do not announce every streamed token to a screen reader; announce progress and completed passages.
Initial release can stream progress while buffering substantive text until claim/policy validation passes. Raw unvalidated recommendations must not reach the user through token streaming before the validator can reject them.

## Architecture, records and APIs

`approved source → private ingestion job → Whisper/text extraction → versioned chunks/embeddings → validated publication → permission-filtered retrieval → shared AI gateway + authorized deterministic tools → claim/policy checks → saved cited answer`

M1 owns AI adapter interfaces, secrets, request/job conventions and usage hooks; M4 implements the first bounded real-model adapter. M5 extends that same gateway with retrieval and answer policy. It must not build a second credentials/client/usage/quota stack.
Knowledge owns sources, ingestion, retrieval and citations. Advisor owns private conversations and answer policy. The shared questionnaire contract is introduced by M4 and reused/enriched here; completed M5 cannot be an upstream prerequisite for M4.
Catalogue facts come from M2.5a's published listing records; current distribution observations come from M2.5b; personal holdings come from M2; forecasts come from M3; allocation proposals remain M4's constrained service. RAG supplies educational/source statements, never authoritative live balances, current yields or arithmetic.
Use narrowly defined read tools initially. Any request to create a plan opens the explicit M4 flow; chat does not silently save goals, change targets, execute trades or run arbitrary SQL/URLs.

| Conceptual record | Responsibility |
| --- | --- |
| KnowledgeSource / SourceVersion | Owner/licensor, allowed use/audience, source URI/hash, title/author, publication/fetch/review dates, conflict labels, language, withdrawal state and effective version |
| IngestionRun | Source/version, stage/parser/Whisper/embedding versions, input hash, retry/deadline/progress, usage and validation results |
| Chunk / EmbeddingSet / CorpusRelease | Stable source locators including page/section/time range, exact normalized content hash, model/dimension/chunking version, publication membership and access labels |
| Conversation / Turn / AnswerRevision | Verified owner, selected context and questionnaire revision, idempotency request, answer status, safe saved output, model/prompt/policy/corpus versions and retention metadata |
| EvidenceReference / ToolSnapshot | Claim-to-source locator or deterministic result reference, authorized context/version/as-of, validation result; private evidence cannot join a shared public cache |
| EvaluationRun / Feedback | Dataset/model/prompt/corpus identifiers, rubric scores/failures/reviewer decision, safe report metadata; member transcripts require controlled separate handling |

These are conceptual responsibilities, not authorization to apply a migration. Prefer the existing Postgres/Supabase direction with pgvector after a representative benchmark; dimension/index/model changes require versioned re-embedding and tested publication, not mixed incomparable vectors.
Permission and active-publication filtering belongs inside the retrieval query and must be verified for the actual index/query strategy. Filtering unauthorized results only after top-k retrieval is insufficient; test both leak prevention and recall under selective filters.
Private conversations use tenant ownership at API and database boundaries. Internal ingestion records and privileged tools are server-only. Retrieval functions, job results, stream subscriptions, feedback records and citation resolvers need the same authorization attention as main tables.

Proposed `/api/v1` contracts, finalized with the shared registry:

- `POST /advisor/conversations`, `GET /advisor/conversations`, `GET /advisor/conversations/:id`: owned, paginated conversation lifecycle; no secret transcript fields in list responses.
- `POST /advisor/conversations/:id/turns`: bounded question, explicit allowed context IDs and expected conversation revision; actor-scoped idempotency key plus request digest; returns `202`, turn and job IDs.
- `GET /advisor/turns/:id` and optional authenticated events endpoint: persisted status/result and monotonic event cursor; reconnect reauthorizes and resumes, never starts generation.
- `POST /advisor/turns/:id/cancel`, bounded feedback and owned conversation deletion endpoints: explicit terminal/deletion semantics; cancellation can stop publication even if vendor billing already occurred.
- Shared questionnaire read/update use case: schema plus answer revision, optimistic concurrency, M4-owned compatibility rules; no second questionnaire store.
- Admin source registration/ingestion/publication/withdrawal endpoints: server-verified admin authority, audit trail and bounded jobs; citations resolve only currently permitted evidence.

Persist accepted turn before generation and publish one final answer transactionally. Concurrent follow-ups require expected conversation revision or explicit branch semantics; start with a conflict response rather than hidden reordered history.
Durable jobs use leases, bounded retries and terminal states. Retry known transient stages without retranscribing/re-embedding unchanged content; ambiguous model timeouts may incur cost and do not justify unlimited replay.
Mobile reconnect uses cursor/status lookup, jitter and cache version checks; no permanent connection for idle chat. Client cache keys include identity and conversation; clear private caches on account change, with M8 defining secure native retention.

## Source governance and ingestion

Start with an explicit Client-approved source manifest; do not crawl all 544 workbook links automatically. Record permission for transcription, embedding, retrieval excerpts and member display, separately where needed. Linked video availability is not evidence of rights.
Worker fetches only approved source origins, validates redirects/DNS and blocks private/local metadata addresses; limit payload size, decompression, duration and redirect count. Ingestion does not execute document instructions, macros or scripts.
For video/audio, use the contracted Whisper step; retain time alignment and mark transcription uncertainty. Human-review samples must catch fund/ticker/numeric transcription errors before those passages support financial claims. Existing captions may aid review but do not replace demonstrated Whisper acceptance.
Use section-aware chunking with stable locators and bounded overlap; evaluate candidate sizes against the actual corpus. Deduplicate by content/version; preserve source identity when equivalent copies have different rights or dates.
Publish only validated complete releases. New embeddings build alongside the active release; a failed run leaves the previous valid release available and clearly dated. Maintain permitted prior releases for rollback.
Define source-specific review dates and expiry policies; static methodology differs from time-sensitive distribution information. Detect changed/removed sources and queue review. Do not represent a dated transcript quote as a current fund fact.
Withdrawal immediately tombstones the source at read/retrieval/publication boundaries, including cached answers and in-flight jobs; purge derived vectors, chunks and permitted raw copies by a declared deletion deadline. Proposed deadline: 24 hours for online derivatives; backup expiry follows documented retention.
Historical answers containing withdrawn content require a policy: conservative default suppresses affected answer text/citations with an explanatory state pending review. Merely hiding a link while continuing to display prohibited excerpts does not implement withdrawal.
Account deletion cancels private jobs and removes conversations/tool snapshots/cache entries according to retention policy; deleting one user's chat must not delete shared licensed corpus records.

## Objectivity and evaluation gates

Client approves a versioned editorial policy: distinguish factual evidence from opinion, describe material risks/tradeoffs, disclose known source sponsorship/conflicts, avoid guaranteed returns, and abstain when support is absent. A disclaimer alone is not the objectivity layer.
Rank for relevance and approved source quality/recency, not paid placement. Test paired questions/documents with sponsorship labels changed: factual ranking and fund-selection criteria must not gain an unexplained sponsored preference. Relevant conflicts stay visible in the answer.
Version corpus, prompts, model, retrieval settings and tool schemas. Separate tuning cases from a locked holdout; changes to any of these rerun relevant evaluations. Model judging is supplemental; human reviewers adjudicate factual support and finance-specific errors.
Proposed initial release suite: at least 120 ordinary questions across permitted topics, 30 unanswerable/stale/conflicting cases, 60 injection/exfiltration cases across user/source/tool text, and 40 deterministic-tool/ownership cases. Keep separate human-labeled retrieval queries with expected source evidence.
Proposed measurable gates, to ratify before tuning:

- Retrieval recall@5 at least 90% on at least 50 answerable labeled queries; report misses by topic/source and selective permission filters.
- At least 95% of sampled material factual claims supported by their cited evidence; 100% of displayed citations resolve to an actually retrieved permitted source/version/locator. A valid-looking but unrelated citation fails support scoring.
- 100% exact agreement for rendered numeric claims backed by deterministic tools; zero invented fund IDs, fabricated quotes, guaranteed returns or unsupported material personal-finance claims in the release suite. A critical failure blocks release despite average scores.
- At least 90% correct abstention/clarification on the 30 insufficient-evidence cases; report unnecessary abstention on answerable questions separately, target at most 10%.
- Zero successful cross-user disclosure, unauthorized tool invocation, source-policy override or secret exfiltration in the adversarial suite. This is a release gate for tested cases, not a claim of universal immunity.
- At least 90% of 30 independently reviewed answers score 4/5 or better for clarity, relevant tradeoffs and objectivity under the agreed rubric; sponsored-pair tests have zero unexplained ranking boosts.

Include adversarial sources saying “ignore instructions,” encoded instructions, false system-role text, forged citations, malicious links and tool results containing commands. Treat previous model messages as untrusted as well. Repeat selected high-risk cases across multiple model runs and preserve failures, not only favorable samples.
Two-week sprint starts after representative permitted corpus, working retrieval/tool contracts and baseline evaluation exist. Week one: baseline, error taxonomy, retrieval/prompt changes and reviewer feedback. Week two: held-out assessment, accessibility/session recovery checks, regression fixes and signed release recommendation. Corpus acquisition is not silently substituted for prompt tuning.

## Ordered implementation and win conditions

1. **Contract and corpus readiness:** agree rights/source manifest, shared questionnaire, tool contracts, answer/objectivity rubric and cost limits. Win: implementers can trace every approved answer input to an owner and permission; missing access has a named owner.
2. **Vertical ingestion slice:** approved source through actual Whisper, chunks, embeddings and isolated permission-tested search. Win: one real source is reproducibly searchable with valid timestamp citations; no broad crawler scaffold needed.
3. **Publication and withdrawal:** source versions, review/validation, admin publish/tombstone and retry/repair. Win: failed ingest cannot corrupt active knowledge and withdrawal suppresses queued/cached use.
4. **Grounded private chat:** persistent owned conversations, shared gateway, retrieval, citation/claim validation, resumable jobs and quotas. Win: two-user API/database tests plus real-model educational chat pass before personal tools are enabled.
5. **Questionnaire and deterministic tools:** reuse M4 answers; integrate authorized M2/M2.5/M3 facts with freshness and plain explanations. Win: mixed currencies, absent data and stale snapshots produce correct tool-grounded output or explicit unavailability.
6. **Client journey and robustness:** readable web chat, equivalent API/native shell journey when available, reconnect/cancel/deletion, overload and observability. Win: duplicate reconnects cause no duplicate published turn and saturated generation does not impair ordinary reads.
7. **Two-week tuning and release:** execute the contracted sprint against the frozen holdout and real-provider tests. Win: all C acceptances and agreed engineering gates have linked evidence and a controlled rollout/rollback decision.

Corpus inventory/rights work and evaluation authoring can start early. Personal-data tools wait for owner-authorized upstream APIs; full production chat waits for M1 isolation/jobs and M4's real shared adapter. Do not delay M4 waiting for M5 retrieval, or mark milestone closure from a mocked chat demo.

## Operations, verification and release

Integration tests use a real disposable database/vector index and prove own-user success plus cross-user denial for every child resource; test denied corpus audiences, changed rights, selective retrieval, concurrent publication, poisoned job, deletion mid-generation and crash after provider success.
E2E covers questionnaire reuse, send/reload/reopen on another session, citation opening, network loss/background/reconnect, missing sources, provider 429/timeouts, budget refusal, invalid citation, withdrawal after answer and safe accessible failure recovery. Verify actual Whisper/embedding/model adapters with permitted small fixtures in addition to mocks.
Inherit shared AI lanes: approximately 0.83 accepted requests/second baseline and 4.2/second stress, with explicit provider concurrency/admission limits. Load with simulated provider timing; separately measure real-provider latency/cost. Include longer output, slow stream consumers, reconnect storms and ingestion competing with reads.
Proposed normal-load gates: accepted progress p95 within 2 seconds; retrieval p95 within 500ms on the representative corpus; complete validated answer p95 within 30 seconds with a 60-second generation deadline. Ratify completion budgets after real-model measurement; report queue/inference/validation separately. Gate overload through honest queue/retry states.
Set bounded input/output/context sizes, per-user active-turn limits and daily quotas, global daily spend limits, ingestion minute/token limits and finite repair attempts before paid calls. Reserve estimated cost then reconcile actual usage; alert and stop thresholds need an operational owner. Pricing/budget requires verified vendor terms at implementation.
Observe retrieval misses/latency, citation/claim failures, source age, ingestion queue/retries, answer stage timings, model tokens/cost, quota denial and reconnects. Logs carry IDs/versions and safe categories; full questions, holdings, questionnaire answers and prompts are not ordinary telemetry.
Roll out by cohort; pause new ingestion or generation independently while allowed saved content and ordinary portfolio reads remain available. Roll back prompt/model/corpus by explicit compatible versions; source withdrawal deny rules override rollback. Use additive schema changes and tested forward repair.
Release requires linked A01–A11 evidence, real provider integration, completed two-week sprint, approved source rights/objectivity rubric, tested withdrawal/deletion, configured budgets/alerts and shared capacity gates. No statement here proves measured scale or regulatory suitability.

## External prerequisites and unresolved decisions

Client supplies permitted corpus/access, source ownership/withdrawal contact, representative questions and reviewer availability. Confirm languages, supported topics, content refresh cadence and which sources can be excerpted to members.
Approve questionnaire wording/compatibility, personalization disclosure, provider retention/region policy, transcript/chat retention, conflict labels and historical-answer withdrawal behavior. Confirm native beta timing with M8 so resumable chat is tested in the actual intended client.
Select model/embedding configuration and worker hosting only through the shared architecture decision and measured corpus/cost evaluation. A new vector vendor or a second AI gateway needs demonstrated justification; it is not a prerequisite implied by “vector database.”
