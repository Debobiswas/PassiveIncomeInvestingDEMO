# M8 — iOS and Android apps

Status: proposed PRD, not implemented or accepted. Audited planning base: `master@4dbf440`; independent feature work: `feat/portfolio-import@f3b65e2`. This document changes no application behavior or contractual payment gate.

## Authority, outcome and timing

Signed agreement, page 2, §2.2: M8 covers React Native builds for iOS and Android, push notifications, App Store and Play Store submissions, and store listings. Its listed investment is $2,500 CAD. The signed delivery schedule remains the contractual reference; moving enabling work earlier is a proposed implementation sequence, not a unilateral schedule amendment.

The user clarified that mobile is the primary app and web provides equivalent financial capabilities for people who prefer web, including older users. The private beta is 2,500 users with approximately 1,000 online simultaneously. Readability is a primary product requirement. Responsive browser screens do not satisfy native delivery.

Win condition: a user installs the appropriate native build, signs in, completes the same authorized financial journeys as web against the same saved data, receives an opted-in notification, and follows it to the correct fresh state. Both store submissions and their listings have traceable evidence. Store approval is a separate external outcome; an uploaded binary, submission, approval, and public release must have distinct recorded states.

Bring a thin native compatibility slice forward immediately after M1 identity/API foundations. Grow it alongside accepted M2–M5 slices. Finish the complete native release after the applicable product and M7 readiness gates. If the 2,500-user beta is native, its distribution and support setup must precede that beta; confirm its date without delaying foundational work.

Non-goals: a second backend or financial engine; copying web DOM components into native; trading execution; automatic offline submission of financial changes; guaranteed notification delivery; new social, paper-trading or gamification scope. Initial administrator upload/editor workflows can remain on web unless mobile administration is explicitly required; ordinary member financial capabilities must remain equivalent.

## Current implementation and reuse decisions

| Evidence | Finding and treatment |
| --- | --- |
| `robo-advisor/package.json:6` and `:12` on planning base | Vite/browser scripts and React DOM dependencies; no native build or native test target. Add native delivery deliberately, after shared contracts exist. |
| `robo-advisor/src/App.jsx:101` and `:126` | Local-state navigation plus a responsive browser header. Reuse information hierarchy where validated; replace navigation implementation for native. |
| `robo-advisor/src/views/Home.jsx:31`, `:72`, `:121` | Important labels use 9–10px text. Rework typography and information density; do not carry these sizes into mobile. |
| Feature worktree `robo-advisor/src/App.jsx:39` | BrowserRouter is useful evidence for web routes, not native routing. Preserve logical destinations and introduce platform navigation adapters. |
| Feature worktree `robo-advisor/src/lib/supabase.js:14` | Browser session persistence and URL detection need a reviewed native storage/callback adapter; configuration cannot be copied blindly. |
| Feature worktree `robo-advisor/src/views/Login.jsx:9` and `:37` | Google-only browser flow; M1 owns the complete email/Google lifecycle and native callback contract. |
| Feature worktree `robo-advisor/src/context/LiveProvider.jsx:1` | Live data provider is a passthrough stub. Native cannot gain working persistence merely by sharing existing views. |
| File/dependency inventory on both branches | No React Native app, native push delivery or store submission evidence found. No M8 acceptance is established. |

Feature-worktree paths above are relative to `.claude/worktrees/portfolio-import/`. Inspect/port useful logic through reviewed changes; do not modify that worktree incidentally. Browser CSS/charts/assets may inform design, but reuse only after readability, license and platform checks.

## Requirements and acceptance mapping

S = signed deliverable; U = user clarification; E = engineering recommendation required to make delivery reliable.

| Requirement | Kind | Required behavior | Acceptance |
| --- | --- | --- | --- |
| M8-R01 | S | Reproducible signed React Native iOS and Android builds from the repository | M8-A01 |
| M8-R02 | U/E | Native is primary; ordinary member journeys have equivalent API/domain behavior on web and mobile | M8-A02, M8-A03 |
| M8-R03 | E | Native secure session lifecycle, email/Google callback recovery, authorized deep links and logout isolation | M8-A02, M8-A04 |
| M8-R04 | U/E | Readable navigation, money and controls, screen-reader support and system text scaling | M8-A05 |
| M8-R05 | E | Bounded request/cache behavior, honest stale/offline states and safe reconnect | M8-A06, M8-A10 |
| M8-R06 | S/E | Push notifications with explicit preferences, device lifecycle handling and safe navigation | M8-A07, M8-A08 |
| M8-R07 | S | Complete App Store and Play Store listings and submissions | M8-A11 |
| M8-R08 | E | Compatible server changes while users retain earlier store-distributed builds | M8-A09 |
| M8-R09 | E | Native crash/performance visibility, controlled rollout and recovery procedures | M8-A10, M8-A12 |
| M8-R10 | U/E | Native pilot and beta distribution planned against 2,500 users / 1,000 online | M8-A01, M8-A10, M8-A12 |

These requirements operationalize the signed mobile deliverable and user priorities. Architecture/tool choices below remain proposals until recorded by the implementation ADR.

## Primary journey and readable states

1. Install a traceable beta/release build; see clear product identity and a readable email/Google sign-in choice.
2. Complete sign-in through the configured callback, return to the intended authorized destination, and resume saved onboarding if interrupted.
3. Use Home, Portfolio, Explore and Plan with clear current location/back behavior. See monetary units, estimate/actual labels and the last successful update time.
4. Perform the same member scenarios as web: create/import/link a portfolio, browse/compare funds, inspect distributions, calculate income, save/revisit a goal, and use the grounded advisor as their milestones become available.
5. Reopen the app after a network loss. See a permitted last-known snapshot with its timestamp, or an explicit unavailable state if no safe cached copy exists. Reconnection revalidates identity and freshness.
6. Opt into useful notifications at a relevant moment; denial leaves the core product usable. A notification opens a destination only after authorization, then fetches current state.
7. Sign out or change account; previous identity's private data, drafts and notification association are cleared according to policy.

Empty portfolios invite import/manual entry without fictional balances. Expired sessions explain reauthentication; interrupted imports/chat expose their server job state. Missing data stays unknown. Deleted, inaccessible or stale deep-link targets show a recoverable state. Unsupported app versions provide a readable update path; don't loop or discard safe drafts silently.

Follow `../PRODUCT_EXPERIENCE.md`: proposed 16px-equivalent body text, 14px secondary minimum, 44×44 logical-pixel targets, chart text equivalents, meaningful currencies and explicit saved/error states. Test enlarged system text, screen readers, narrow screens and keyboard avoidance; critical amounts and primary actions must remain available. Native accessibility requires platform-aware labels, roles and focus behavior, not only visible text. [React Native accessibility](https://reactnative.dev/docs/accessibility).

## Architecture and ownership

Proposed native module: `apps/mobile`, created only when the first runnable slice is implemented. It contains platform entry points, navigation, accessible presentation, session/network lifecycle and platform adapters. Select React Native workflow, navigation, secure-storage and build tooling in a bounded ADR/spike; no new framework/vendor is selected by this document.

Shared `packages/contracts` owns validated API shapes; `packages/domain` owns deterministic decimal-safe math and versioned assumptions. Use the same `/api/v1` product API as web. Platform session adapters and narrowly scoped upload flows follow the exceptions in `ARCHITECTURE.md`. Never bundle server repositories, privileged credentials, original source PDF/XLSX or model/broker secrets in native binaries.

M1 owns identity/authorization and native-compatible callback contracts. M2 owns import/sync and broker state. Native integrates the supported connect flow with cancellation/return recovery, not provider secrets or trading tools. Browser-only parsing/widgets require a native-compatible adapter or the shared server upload path. M3 owns calculator math; native slider previews use its exact version and server save validation. M4/M5 own goal/chat jobs and outcomes; native observes/reconnects to their job IDs instead of recreating work after suspension.

Persist tokens through a reviewed platform secure-storage adapter. Unencrypted general-purpose async storage is inappropriate for tokens; protect any retained private summaries with an explicit storage/expiry policy. Deep links are external input: validate destinations, bind OAuth flows using the chosen provider's reviewed PKCE/state mechanism, avoid tokens or financial values in links, and authorize the resolved resource server-side. [React Native security guidance](https://reactnative.dev/docs/security).

Conceptual native records: device installation, owned push registration, notification preferences/consent, delivery attempt, supported app/API version and minimum-version policy. Installation IDs are not identity. Token rotation/reinstallation must not create duplicate deliveries or transfer a previous user's subscriptions. Register/update/revoke operations resolve the authenticated actor; another user cannot edit a registration by guessing its ID.

Proposed API capabilities are owned registration upsert/revoke, notification preference read/update, and safe version/capability metadata. Routes follow the versioned API conventions; exact schemas are implementation deliverables. Shared M6 engagement events feed a push delivery adapter; M8 does not create an independent monthly scheduler. Other notifications must have a named source event, preference and deduplication key.

Push processing uses a durable delivery record and bounded retries. Deduplicate by event, installation and channel; inspect provider results and expire invalid registrations. Provider acceptance, device receipt and user opening are different states. Keep default lock-screen text generic, with no amounts, broker identifiers or conversation excerpts; fetch details after sign-in. Notification permission and delivery behavior must be tested separately on both platforms. [Apple permission guidance](https://developer.apple.com/documentation/usernotifications/asking-permission-to-use-notifications), [Android notification permission](https://developer.android.com/develop/ui/compose/notifications/notification-permission).

## Network, cache and compatibility policy

One thousand online mobile apps do not establish a lower server workload. Local rendering and shared-math previews help; foreground refresh, broker sync and AI can dominate. Inherit the declared workload and evidence gates in `../CAPACITY_AND_RELIABILITY.md` rather than forecasting from the client framework.

Use one documented client query-cache strategy, scoped by identity/resource/version. Fetch bounded summary endpoints, reuse immutable catalogue versions, cancel irrelevant requests, and cap retry count/time with jitter. Deduplicate concurrent session refresh; foreground/reconnect respects freshness windows. Do not poll every dashboard card or hold a database connection for each online user.

Initially permit timestamped cached reads where the selected privacy policy allows; writes require connectivity and explicit outcome. Unknown network outcomes are resolved through operation/job IDs and idempotency keys before retry. Replayed requests cannot duplicate imports, goals or notifications. Persisting queued offline mutations is deferred until conflict semantics have separate acceptance.

Do not assume background execution or silent pushes are dependable for financial freshness. Resume through authoritative snapshots and job status. Show whether a refresh is queued, running, failed or complete. Apply backoff to both network and provider failures; UI gestures must not multiply requests.

Proposed compatibility baseline: latest and preceding supported native release remain functional during a documented minimum 30-day rollout window; decide the final support window before beta. Use additive response/schema evolution and versioned formulas. Older supported clients receive stable behavior; genuinely unsupported versions receive an actionable upgrade response. Security exceptions need a deliberate minimum-version rollout, not a silently broken endpoint. Local cache migrations must fail safely and clear incompatible cache without destroying server data.

## Ordered delivery slices and dependencies

| Order | Scope and prerequisites | Slice win condition |
| --- | --- | --- |
| N1 — after M1 | Native tooling ADR; iOS/Android development builds; shared API contract and domain import; secure auth/deep links; readable shell | Same synthetic user signs in on both platforms, reads persisted onboarding/profile and sees web changes; sign-out isolation passes. This is early compatibility evidence, not full M8. |
| N2 — with M2 | Real portfolio summary/manual flow, native upload picker and broker connect-return spike | Persisted holdings agree with web; file cancellation, interrupted upload, duplicate retry and reconnect are safe. Resolve incompatible provider widgets here. |
| N3 — with M2.5/M3 | Readable fund/distribution screens, three-way comparison, native video handling, shared calculator | Canonical data/version/currency agree across clients; enlarged text and independent financial examples pass. |
| N4 — with M4/M5 | Persisted goals and grounded chat; suspension/resume/cancel states | Reopening does not restart completed jobs or lose saved goals; citations and source timestamps remain usable. |
| N5 — with M6 | Consent/preferences, device lifecycle and push delivery adapter | Opted-in test devices receive safe messages; denial, logout, token rotation and invalid registration cases pass. |
| N6 — before expanded native beta | M7 pilot evidence, native device/accessibility/performance runs, tester distribution/support | Pilot users complete representative tasks; beta capacity/failure evidence and rollout rollback controls are reviewed. |
| N7 — release delivery | Signed builds, listing assets/metadata, client-owned store access and reviewer access | Both submissions and listings have receipts/build IDs; review issues tracked separately from approval and public availability. |

N1 can proceed once M1 interfaces and identity gates are stable. Final parity cannot precede accepted upstream product behavior. Prepare store identities and distribution access early; do not wait for finished screens to discover account/setup blockers. Do not build every mobile screen in parallel against changing API contracts.

## Verification and measurable acceptance

| Acceptance | Evidence required |
| --- | --- |
| M8-A01 | CI or documented clean build produces traceable iOS/Android artifacts for the declared supported device/OS matrix; signed builds install on real devices. Record commit, runtime, dependency lockfile and artifact/build IDs. No simulator-only claim. |
| M8-A02 | Email and Google sign-in, recovery/cancel, app termination during callback, token expiry, account switch and logout pass on each platform; saved profile/onboarding match web for the same user. |
| M8-A03 | Approved member journeys for M2, M2.5a/b, M3, M4, M5 and later M6 run against the same staging API/data. Compare canonical amounts, currencies, dates, versions and saved outcomes; platform differences have explicit justification. |
| M8-A04 | User A succeeds on owned resources; user B's ID/link/registration spoof fails without state change. Signed-out and expired-session deep links reveal no private content. Native caches and push association clear correctly on logout/account change. |
| M8-A05 | VoiceOver/TalkBack, enlarged system text and declared narrow/large devices pass the primary journeys. Currency/critical values are not truncated; focused fields/actions remain reachable with keyboard open; color-only charts have equivalent text. Representative older web users also pass parity/readability checks. |
| M8-A06 | Offline start with/without cached data, network switching, app kill after accepted write, lost response and foreground reconnect yield honest states. A retry reuses the same operation and creates one business result. No silent offline-write queue. |
| M8-A07 | Real permitted test devices receive one intended notification for a deduplicated event. Denial/revocation leaves ordinary features usable; token rotation, reinstall, multi-device and sign-out behavior pass. Record provider acceptance separately from observed device receipt. |
| M8-A08 | Lock-screen payload contains no private financial/chat data. Open notification while signed out, signed into another account, or after target deletion; authorization and recovery are correct. Provider failures/invalid tokens produce observable bounded terminal states. |
| M8-A09 | Current and preceding supported native builds run critical journeys against the new API/schema; unknown optional fields and cache upgrades are safe. Minimum-version responses and update links work; supported builds survive server rollback. |
| M8-A10 | Record startup, navigation responsiveness, crash/ANR and API request counts on declared mid-range real devices/network profiles; set numeric native budgets in N1 and enforce them before beta. Shared 1,000-session sustained/reconnect/soak gates pass with native request patterns and bounded refresh, while sync/AI are busy. |
| M8-A11 | Client-owned listings include approved name, screenshots, description, support/privacy links and required declarations; artifacts submitted to both stores with receipts/build IDs and review notes. Record approval/rejection/pending state honestly; no promised review date. |
| M8-A12 | Rehearse feature disablement, staged rollout stop, compatible server rollback and corrective-build process. Operator can correlate a redacted crash/request/job to app version. Pilot, support ownership and beta admission decision are documented. |

Implementation adds shared-domain tests, API contracts, native component tests and native device E2E commands; no such native commands exist today. Assert financial examples independently of code: identical CAD/USD input and formula versions produce identical web/native/server output; unknown FX remains unknown. Use synthetic tenants/data, real disposable backend integration and representative real push/provider smoke tests; mocks alone do not prove delivery.

## Release evidence, operations and unresolved inputs

A release dossier links each acceptance ID to commit, build/environment, device/OS, expected/observed result and reviewer. N1 is not M8 acceptance; responsive-web screenshots are not native evidence; M1–M5 completion does not imply push/store readiness. Product approval and external store review remain separate.

Monitor native crashes/ANRs, startup/resume, failed auth callbacks, request volume/cache hits, version adoption, provider delivery results and reconnect retries. Scrub tokens, account identifiers, chat text and private values. Bound push fan-out and retention; include build services, push delivery and observability in the operating-cost model without inventing current vendor prices.

Server feature flags can disable a failing feature while retaining compatible reads. Store-distributed binaries cannot be treated like an instant web redeploy: maintain backward-compatible APIs and a corrective-release runbook. Choose any update mechanism only after checking its platform constraints; it is not an assumed escape from native review or native-code changes.

External prerequisites: client-owned Apple/Google accounts and signing access; final app identity and domains; approved notification use cases and privacy/listing text; permitted broker/native callback configuration; physical test devices; beta tester access; production API readiness and operator ownership. Provider/store accounts and paid provisioning are not created by this plan.

Decisions at N1/N6: native beta date and distribution channel; supported OS/device/language matrix; React Native workflow/navigation/build tooling; secure cache retention and app-switcher redaction; permitted notification categories; supported-version window; who handles reviewer requests and launch support. Resolve these through bounded evidence; keep implementation progressing where the choice is independent.
