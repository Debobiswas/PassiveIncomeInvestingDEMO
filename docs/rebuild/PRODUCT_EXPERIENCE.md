# Shared mobile and web product experience

Status: product constraints supplied by the user plus proposed measurable design gates.

## Product direction

Mobile is the primary app. Web offers the same financial capabilities to people who prefer a larger screen or are less comfortable using mobile apps. Neither client should present a conflicting portfolio total, goal, explanation or data timestamp. Use one API, the same deterministic domain rules, versioned inputs and equivalent acceptance journeys. Layout and native interaction can differ.

Prioritize four familiar destinations: Home, Portfolio, Explore, and Plan. Advisor, calculator, saved goals and distributions have real deep links within those destinations. The exact labels should be tested with representative users; preserving four large screens with all logic embedded is not required.

## Readability gates

- Use at least 16px-equivalent body text in ordinary content and at least 14px for secondary information; critical amounts, dates, validation errors and actions must not be miniature labels. Native text follows system scale.
- Support 200% browser zoom and enlarged native text without hiding actions, truncating meaningful money values or forcing two-dimensional scrolling for ordinary journeys.
- Meet WCAG 2.2 AA contrast and keyboard/focus requirements for web. Use a proposed shared minimum 44x44 logical-pixel touch target; do not equate visual icon size with hit area.
- Group monetary values with plain labels, currency and time period. Distinguish “Paid this month,” “Estimated monthly income,” and “Last updated.” Avoid unlabeled yield percentages.
- Offer a text/table equivalent for charts. Do not rely on red/green or color alone for drift, loss, warnings or selection.
- Use progressive disclosure: the common task gets a clear primary action; advanced methodology and data provenance remain reachable without overwhelming the first screen.
- Use explicit back/cancel, saving/progress/success and retry states. Avoid hover-only controls, unexplained abbreviations and modals nested inside modals.
- Financial forms preserve safe drafts on transient failures, explain validation inline and ask confirmation for meaningful destructive data changes.
- Test empty accounts, long fund names, very large/negative amounts, missing data, CAD/USD, daylight/date boundaries and offline/stale states.

These are engineering/design recommendations unless the user explicitly specified them above; they turn “super easy to read” into reviewable tests. Font-size and 44px targets are product choices, not a claim that WCAG mandates those exact values. The normative web accessibility reference is [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

## Parity and native timing

Every M1–M5 PRD should provide the same acceptance scenario for API behavior and identify client presentation differences. M8 remains the signed native deliverable, but a mobile-first beta may require earlier M8 enabling work: React Native shell, secure token storage, deep-link OAuth, shared contracts, navigation and test distribution. Build a thin native journey after M1 to expose platform constraints, then grow it with milestone slices.

Do not count a responsive website as native completion, or defer native API compatibility until all web features are finished. Do not build two independent calculators or two sources of portfolio truth. Share contracts/domain code; share UI only where it preserves platform accessibility and maintainability.

For disconnected use, initially allow clearly timestamped previously fetched summaries where security/storage permits; queueing financial changes offline is a separate decision and must not silently happen. Reconnect must reauthorize, reconcile versions and use bounded retries. Native local storage of portfolio data needs an explicit cache-retention/clear-on-sign-out policy.

## Design validation sequence

1. Establish readable tokens and one navigation shell in M1, with keyboard/screen-reader/text-scaling checks.
2. Test sign-in/onboarding and one real portfolio import/sync journey before redesigning every screen.
3. Run task-based usability sessions with a small representative group, including older web users, before the 2,500-person beta. Measure whether they can find monthly income, understand its freshness, inspect a holding, and save/revisit a goal without coaching.
4. Use 10–20 members for an early feature-scoped M1–M5 pilot; the user's 2,500-person beta is a later expansion gate with the capacity test above. Re-run the required pilot journeys on full scope including M6 before calling the signed M7 pilot/launch accepted. These stages must be recorded separately.
5. Track completion, confusion, unreadable labels, errors and recovery. A visually attractive screenshot alone does not pass.
