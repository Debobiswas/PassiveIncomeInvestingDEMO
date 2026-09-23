# Phase 1 — Requirements & Information Architecture

> Historical prototype plan. This document uses superseded proposal numbering and demo-only exclusions. For current signed scope and implementation order, use [the rebuild PRD index](docs/rebuild/README.md). In the signed agreement M3 is the calculator and M5 is the RAG advisor; M2 remains a distinct portfolio milestone.

**Source:** `robo-advisor-proposal.md` (Phases 1A + 1B, $40,000 CAD, 16 weeks)
**Goal:** A simple, intuitive app for passive income investors. The user should always know two things at a glance: **how much they're making** and **what to do next**.

---

## Phase 1 Milestone → Feature Map

| Milestone | Investment | Feature Bucket | UI Surface |
|---|---|---|---|
| **M1** Foundations & Auth | $4,500 | OAuth, SnapTrade (20+ brokerages), CSV fallback, multi-portfolio | Onboarding + Accounts panel |
| **M2.5a** ETF Screener v1 | $4,500 | 140+ ETF dataset, filters, side-by-side compare, YouTube embeds | Discover tab |
| **M2.5b** Live Distribution Dashboard | $3,000 | 12–24 mo history, yield charts, ex/record/pay dates, CSV/XLSX | Portfolio tab → Distributions |
| **M3** Robo AI Advisor (RAG) | $6,500 | Vector DB, content ingestion, chat UI, guided questionnaire | Plan tab → Advisor chat |
| **M4** Goal Engine | $2,500 | Goal wizard, AI portfolio generator, plain-English rationale | Plan tab → Goal card |
| **M5** Passive Income Calculator | $4,000 | Reverse engineer, CA+US tax-drag toggle, inflation tracking | Plan tab → Calculator |
| **M6** Check-in & Rebalance | $5,000 | Drift detection, monthly cron, rebalance UI, email alerts | Portfolio tab → Rebalance card |
| **M7** Polish, Beta, Launch | $3,000 | UX pass, admin console, beta (10–20 members) | All views |
| **M8** iOS + Android | $2,500 | React Native builds, push notifications | Mobile shell |

---

## Information Architecture — 4 Top-Level Tabs

**Principle:** Group by user intent, not by milestone.

```
┌─────────────────────────────────────────────────────────────┐
│  HOME          PORTFOLIO         DISCOVER         PLAN      │
│  ───           ─────────         ────────         ────      │
│  Overview      What you own      What to buy      What next │
└─────────────────────────────────────────────────────────────┘
```

### Tab 1 — HOME
**Question answered:** "How am I doing right now?"
**Hero metric:** Monthly passive income (the single number that matters)
**Items on this page:**
1. **Big income hero** — `$612/mo` with delta vs last month + sparkline
2. **Portfolio value strip** — Total value, 1-day delta, 1-month delta
3. **Next dividend** — Single most imminent ex-date with countdown ("XDIV.TO pays $124.50 in 5 days")
4. **One-call-to-action card** — Either:
   - "Drift detected — review rebalance" (if drift > threshold) → Portfolio
   - "Ask your advisor" (default) → Plan
5. **Recent activity feed** — Last 3 transactions, link to full Portfolio

*Removed from current design:* allocation pie, projection chart, connected accounts widget, quick chat input. All moved to other tabs.

### Tab 2 — PORTFOLIO
**Question answered:** "What do I own and how is it performing?"
**Items on this page:**
1. **Connected accounts** (M1) — SnapTrade list, "Add Account" CTA
2. **Holdings table** — Ticker, units, monthly income, yield, % of portfolio
3. **Allocation visualization** — Single horizontal bar OR donut (one, not both)
4. **Distributions sub-section** (M2.5b):
   - 12-month distribution chart per ticker
   - Upcoming ex/record/pay date calendar (next 30 days)
   - Export CSV/XLSX
5. **Rebalance card** (M6) — Only shown when drift detected; collapsed by default
6. **Rebalance history** — Last 3 events

### Tab 3 — DISCOVER
**Question answered:** "What could I add to my portfolio?"
**Items on this page:**
1. **Search bar** — Single prominent input
2. **Filter pills** — Type, min yield, max MER (3 max, not 6)
3. **Results table** — Ticker, name, yield, MER, type, ★ rating
4. **Deep dive modal** — Opens on click:
   - Key metrics
   - YouTube video embed (M2.5a)
   - Ex/record/pay dates
   - "Add to compare" toggle
5. **Compare drawer** — Bottom sheet when 2+ ETFs selected, max 4

*Removed from current design:* in-table star displays (move to detail view), in-table compare checkboxes (use selection mode).

### Tab 4 — PLAN
**Question answered:** "What should I do next to reach my goals?"
**Items on this page:**
1. **AI Advisor chat** (M3) — Top of page, always available
2. **Single goal card** (M4) — One active goal with progress bar; "Set new goal" wizard
3. **Income calculator** (M5) — Collapsed by default:
   - Input: target monthly income
   - Output: required portfolio value at current yield
   - Tax toggle (CA/US), inflation slider
4. **AI portfolio suggestion** (M4) — Shown when user runs goal wizard

*Removed from current design:* 60-month projection chart (lives inside Calculator now), 3 goal cards (focus on ONE active goal), in-page advisor preview (it IS the page).

---

## Simplification Principles Applied

| Before | After | Why |
|---|---|---|
| 6 sidebar nav items | **4 tabs** | Fewer choices = faster orientation |
| 9 widgets on Dashboard | **5 items, 1 hero** | One thing at a time |
| Allocation in 3 places (Dashboard, Portfolio, Rebalance) | **One place** (Portfolio) | Single source of truth |
| 3 goal cards visible | **1 active goal** | Focus on the current one |
| Charts on every page | **One chart per page max** | Visual rest |
| 22 ETFs in dense table | **Search-first, results below** | Reduce cognitive load |
| Rebalance always visible | **Conditional card** (only when drift > 0.5%) | Don't show what isn't actionable |
| Quick chat on Dashboard + Advisor page | **Advisor only on Plan tab** | One conversation surface |

---

## Visual Language (unchanged from current)

- **Palette:** Cream `#FFFBF2` (60%) · Charcoal `#1A1A1A` (30%) · Gold-orange `#F5A623` (10%)
- **Type:** Fira Sans (body) + Fira Code (numbers/tickers)
- **Cards:** White on cream, 1px subtle border, soft shadow
- **Spacing scale:** 4 / 8 / 12 / 16 / 24 / 32 / 48 px
- **Radius scale:** 8 (chip) / 12 (input) / 16 (card) / 24 (hero card)

## Layout

- **Desktop (≥1024px):** Left sidebar nav (4 items), main content max-width 1280px
- **Tablet (768–1023px):** Sidebar collapses to icon-only rail
- **Mobile (<768px):** Bottom tab bar with 4 icons + labels

---

## Component Inventory (4 pages total)

```
src/views/
  Home.jsx           ← was Dashboard.jsx (slimmed: 9 widgets → 5)
  Portfolio.jsx      ← merge: Distribution + Rebalance + Holdings
  Discover.jsx       ← was ETFScreener.jsx (search-first refactor)
  Plan.jsx           ← merge: Advisor + GoalEngine

src/components/
  Sidebar.jsx        ← 4 items instead of 6
  BentoCard.jsx      ← unchanged
  IncomeHero.jsx     ← NEW: the big monthly income display
  DriftAlert.jsx     ← NEW: conditional rebalance prompt
  GoalProgress.jsx   ← NEW: single goal with progress
  EtfRow.jsx         ← NEW: extracted from old screener
  DistCalendar.jsx   ← NEW: 30-day ex-date strip
```

---

## Out-of-scope for Phase 1 frontend demo

- Real OAuth flow (mocked)
- Real SnapTrade API calls (dummy accounts)
- Real RAG retrieval (canned responses)
- Real cron jobs (drift derived from static dummy data)
- Real CSV/XLSX export (button is non-functional placeholder)
- Email notifications (UI affordance only)
