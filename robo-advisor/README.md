# PassiveIncome Advisor — Frontend Demo

A mobile-first robo-advisor interface built on top of **Erica Villani's Ultimate DIY Investing Package**. This is a functional frontend prototype that demonstrates the full user journey — from onboarding and portfolio tracking to ETF discovery, income planning, and monthly rebalancing — using static seed data that mirrors the real spreadsheet structure.

---

## What This Is

This app is a **design and requirements demo**, not a live brokerage application. It answers the question: *"What would a software product built on the DIY Investing Package actually look like for users?"*

Everything visible in the UI — ETF tickers, yields, distribution dates, portfolio values, account balances, AI advisor responses — is seeded from the real data in the **Ultimate DIY Investing Package v7** spreadsheet. No real brokerage accounts are connected; portfolio data is imported once per month via CSV export from the user's actual brokerage (Questrade, Wealthsimple, RBC Direct, etc.).

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React 19 + Vite 8 | Fast HMR, lazy-loaded routes |
| Styling | Tailwind CSS v4 | Utility-first, mobile-first breakpoints (`md:`) |
| Charts | Recharts | Area, Bar, Line, Pie/Donut, Radar charts |
| Icons | Lucide React | Consistent SVG icon set |
| Data | Static `dummy.js` | Mirrors the real Excel tab structure |
| Font | Fira Sans + Fira Code | Readable body + mono for financial figures |

---

## Running Locally

```bash
cd robo-advisor
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle
```

---

## Project Structure

```
src/
├── App.jsx                  # Root — routing, mobile nav, onboarding modal
├── index.css                # Design tokens, card primitives, scrollbar utils
├── data/
│   └── dummy.js             # All seed data (mirrors Excel tabs)
├── components/
│   ├── BentoCard.jsx        # Reusable card shell with shadow + accent variants
│   ├── Sidebar.jsx          # Desktop sidebar nav (hidden on mobile)
│   └── NotificationsPanel.jsx
└── views/
    ├── Home.jsx             # Dashboard — income hero, activity, check-in banner
    ├── Portfolio.jsx        # Holdings, accounts, donut chart, rebalance wizard
    ├── Discover.jsx         # ETF screener, dashboard, comparison tabs
    ├── Plan.jsx             # Risk questionnaire, AI advisor, simulator, crash mode
    ├── Dashboard.jsx        # (Legacy) original desktop-first overview
    ├── Distribution.jsx     # (Legacy) distribution history + calendar
    ├── Rebalance.jsx        # (Legacy) drift bars + radar chart
    ├── ETFScreener.jsx      # (Legacy) standalone screener
    ├── GoalEngine.jsx       # (Legacy) standalone goal planner
    └── Advisor.jsx          # (Legacy) standalone AI chat
```

> **Active views** are `Home`, `Portfolio`, `Discover`, and `Plan` — accessible via the bottom tab bar on mobile and the sidebar on desktop. The legacy views (`Dashboard`, `Distribution`, `Rebalance`, etc.) are earlier iterations preserved for reference; their features have been consolidated into the four main views.

---

## Views and Their Requirements

### 1. Home

**What it shows:** A weekly summary for the investor — monthly income earned, portfolio value, upcoming distribution events, drift alerts, and recent transaction activity.

**Requirements it satisfies:**
- Users need a single "at a glance" view that surfaces the most actionable information without navigating multiple tabs.
- The income number (`$1,487.22/mo`) is the primary KPI for passive income investors; it must be the largest, most prominent figure on the page.
- The **Monthly Check-in banner** surfaces automatically when a new CSV import is due, guiding the user to review their drift and distributions.
- The **Portfolio drifted** action card routes directly to the rebalance wizard whenever drift exceeds the 2% threshold.

**Data source (Excel):** `portfolioStats` (Portfolio #1 summary row), `recentActivity` (transaction log), `upcomingDates` (distribution calendar tab), `driftAlerts` (drift calculation).

---

### 2. Portfolio

**What it shows:** Full portfolio breakdown — total value, yield on cost, monthly income, donut allocation chart, linked brokerage accounts, holdings table with drift indicators, distribution calendar, activity log, and the rebalance wizard.

**Requirements it satisfies:**

| Feature | Requirement |
|---|---|
| **Linked accounts (CSV import)** | Users hold accounts at multiple brokerages (Questrade TFSA, Wealthsimple RRSP, RBC Direct Cash, TD FHSA). Since real-time API sync is not planned, holdings are imported once per month via CSV. Each account row shows its last import date and balance. |
| **Donut allocation chart** | Visual breakdown of the 10-position Portfolio #1 mix (ZWQT, HDIV, HYLD, HDIF, HHIS, EQCL, USCC, QQCC, BMAX, ECHI), each at ~10% target weight. |
| **Holdings table with drift** | Each row shows current % vs. target %, value, and drift delta. Coloured amber (over-weight) and blue (under-weight). |
| **Rebalance wizard (3-step modal)** | Drift review → plain-English trade plan → confirmation. Generates a self-funded trade list (sell over-weight, buy under-weight) with no new capital required. |
| **Distribution tab** | Shows upcoming ex-dividend, record, and pay dates for all 10 holdings. |
| **Activity tab** | Chronological log of distributions received and buy/sell orders. |

**Data source (Excel):** `portfolioHoldings` (Portfolio #1 tab), `brokerageAccounts` (account list), `upcomingDates` (distribution calendar), `rebalanceHistory` (past rebalances).

---

### 3. Discover

**What it shows:** A searchable, filterable ETF screener across 69 income ETFs from the DIY Investing Package, a curated dashboard of featured picks, and a side-by-side comparison tool.

**Requirements it satisfies:**

| Feature | Requirement |
|---|---|
| **Screener tab** | Users evaluate ETFs by yield, MER, payout frequency, asset type, and manager before adding to their portfolio. Filters: text search, type pills (CDN Covered Call / US Covered Call / CDN Equity / US Equity / Fixed Income / REIT), minimum yield slider. |
| **Dashboard tab** | Erica's 6 featured ETFs (HDIV, HYLD, ZWQT, HHIS, BMAX, QQCC) with distribution history sparkbars and YouTube video links. Users without deep knowledge use this as the starting point. |
| **Compare tab** | Select 2–4 ETFs from the screener and view them side-by-side across yield, MER, payout, coverage, region, and manager. Helps users decide between similar instruments (e.g., QQCC vs. QYLD). |
| **Detail modal** | Full ETF profile: ex/record/pay dates, 6-month distribution history bar chart, star rating, and a linked Erica Villani YouTube review video. |
| **Floating compare drawer** | When 2+ ETFs are selected in the screener, a sticky drawer appears at the bottom with one-tap access to the Compare tab. |

**Data source (Excel):** `etfsExtended` (Tab 5 ETF list + Tab 2 income ETFs + Tab 4 US ETFs — 69 tickers across Hamilton, BMO, Global X, Evolve, Harvest, Brompton, Ninepoint, JPMorgan, and US-listed names).

---

### 4. Plan

**What it shows:** A two-panel layout — a 4-question risk questionnaire that transitions into an AI advisor chat on the left; a tabbed right panel with a goal tracker, what-if income simulator, and market crash stress-tester on the right.

**Requirements it satisfies:**

| Feature | Requirement |
|---|---|
| **Risk questionnaire** | 4 questions (risk tolerance, time horizon, income goal, account type) build a risk profile. Results inform a portfolio match suggestion (Conservative / Balanced / Aggressive). Progress bar with animated dots. |
| **AI advisor chat** | After the questionnaire, an AI chat panel opens. In production this is a RAG pipeline over Erica's YouTube transcripts and course content. In demo mode, canned responses cover the three most common questions. Suggested prompt chips surface those questions. |
| **Goals tracker** | Users set a target monthly income (default `$1,000/mo`). The goal card shows current income, progress toward target, and an income calculator that outputs the required invested capital based on current yield and tax region (Canada vs. US). |
| **What-If Simulator** | Sliders for invested capital, yield, monthly contributions, and time horizon project income growth on an area chart. Optional inflation toggle shows real vs. nominal income side-by-side. |
| **Market Crash Mode** | Simulates three historical scenarios (2008 Financial Crisis, COVID-19 crash, Dot-com Bubble) against the user's actual portfolio. Outputs estimated drawdown, income impact in dollars, and recovery time in months, with a recovery index chart. |

**Data source (Excel):** `goals` (target income), `portfolioStats` (current yield and income), `samplePortfolios` (matched portfolio suggestions), `advisorMessages` (seed chat history).

---

## Data Model

All data lives in `src/data/dummy.js`. The structure maps directly to tabs in the Ultimate DIY Investing Package spreadsheet. To connect real data, replace each export with an API call that returns the same shape.

| Export | Excel equivalent | Used in |
|---|---|---|
| `portfolioStats` | Portfolio #1 summary row | Home, Portfolio, Plan |
| `portfolioHoldings` | Portfolio #1 — all positions with drift | Portfolio, Rebalance |
| `brokerageAccounts` | Account list (manual) | Portfolio, Home |
| `etfsExtended` | Tab 5 + Tab 2 + Tab 4 | Discover |
| `distributionHistory` | Distribution log tab | Distribution, Discover |
| `upcomingDates` | Distribution calendar | Portfolio, Home |
| `recentActivity` | Transaction log | Home, Portfolio |
| `incomeProjection` | Projection model | Home, Dashboard |
| `allocationData` | Allocation breakdown | Dashboard |
| `driftAlerts` | Drift calculation | Home, Portfolio, Rebalance |
| `rebalanceHistory` | Rebalance event log | Portfolio, Rebalance |
| `goals` | Goal planner | Plan |
| `samplePortfolios` | Sample portfolio matches | Plan |
| `advisorMessages` | Seed chat history | Plan |
| `notifications` | Notification feed | App (bell icon) |
| `monthlyCheckin` | Monthly check-in state | Home |

---

## Design System

### Colour palette — 60 / 30 / 10 rule

| Token | Value | Role |
|---|---|---|
| `--bg-page` | `#FFFBF2` | 60% — warm cream page background |
| `--text-hi` | `#1A1A1A` | 30% — headings, key financial values |
| `--accent` | `#F5A623` | 10% — buttons, active nav, income numbers |
| Purple | `#7C3AED` | Charts (projected lines), AI advisor panel |
| Green | `#16A34A` | Distributions received, positive yield values |
| Amber | `#D97706` | Over-weight drift (TRIM signals) |
| Blue | `#2563EB` | Under-weight drift (BUY signals) |

### Responsive strategy

- **Mobile (`< 768px`):** Fixed bottom tab bar (Home / Portfolio / Discover / Plan), single-column stacked layout, abbreviated stat values (`$148K` not `$148,320`), sparkline chart visible on income hero.
- **Desktop (`md:` and up):** Left sidebar, 5-column bento grid, side-by-side panels (questionnaire + goals, screener + detail).

### Accessibility

- All interactive elements: `focus-visible:ring-2 focus-visible:ring-amber-400`
- Touch targets: minimum 44×44px everywhere
- `touch-action: manipulation` eliminates the 300ms tap delay globally
- `prefers-reduced-motion` disables all transitions and animations
- `aria-label` on every icon-only button

---

## Monthly Import Flow (No Real-Time Sync)

The app does **not** use live brokerage APIs. The design reflects a deliberate monthly manual import cycle:

1. At month-end, the user exports a holdings CSV from each brokerage.
2. They upload it via the **"Upload Holdings CSV"** button in Portfolio (CSV or XLSX, Portfolio Template format: `Symbol | Investment | Shares | Book Price | Yield%`).
3. The app parses the file and updates `portfolioHoldings`.
4. A notification fires: *"Holdings imported — May 1, 2026"*.
5. The next import due date (`Jun 1, 2026`) appears in the Portfolio footer and the notification badge.

Account rows in Portfolio reflect this state: imported accounts show a green balance and last import date; pending accounts show an alert icon at reduced opacity.

---

## What Would Change in Production

| Demo behaviour | Production replacement |
|---|---|
| Static `dummy.js` data | REST API / Supabase returning live portfolio data |
| Canned AI advisor responses | RAG pipeline over Erica's YouTube transcripts + course content |
| CSV upload parsed in-browser | Server-side CSV parser + database write |
| Hardcoded distribution dates | Data vendor feed (TMX, Morningstar) or scraper |
| ETF yields marked "estimated" | Trailing-12-month yield from fund company APIs |
| Onboarding modal on every session | Persisted `localStorage` flag after first visit |
| Rebalance wizard "queues" trades | Questrade API or Wealthsimple API order submission |
