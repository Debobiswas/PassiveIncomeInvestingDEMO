# Robo Advisor Scoping & Proposal

**Prepared for:** Erica Villani

**Prepared by:** Blundr

**Date:** May 15th, 2026 

---

## The Product

Blundr is proposing the development of a robo-advisor built on your existing intellectual property (IP), including your videos, spreadsheets, and cash flow thesis. The platform is designed as a retention layer for your existing audience, offering objective answers and portfolio check-ins.

* **Timeline:** A working robo-advisor will be in your members' hands by December.

* **Infrastructure:** The web version will launch in December, followed by mobile apps (React Native/Flutter) once Apple and Google approvals clear.

---

## The Plan: Phase 1 Breakdown

The project is divided into two primary phases, with a total investment of **$40,000 CAD** over 16 weeks.

### Phase 1A: Core Advisor (Weeks 1–9)

| Milestone | Investment | Key Features |
| --- | --- | --- |
| **M1 Foundations & Auth** | $4,500 | OAuth, DB schema, CI/CD, SnapTrade integration (20+ brokerages), CSV fallback, multi-portfolio support. |
| **M2.5a ETF Screener v1** | $4,500 | 140+ ETF dataset, mobile-first filtering, side-by-side comparison, embedded YouTube links. |
| **M2.5b Live Dist. Dashboard** | $3,000 | 12-24 month distribution history, yield charts, ex/record/pay dates, CSV/XLSX admin tools. |
| **M3 Robo AI Advisor (RAG)** | $6,500 | Vector DB, content ingestion pipeline (audio/text), chat UI, guided questionnaire, prompt-tuning. |
| **Total Phase 1A** | **$23,000** | |

### Phase 1B: Calculators, Engagement & Mobile (Weeks 10–16)

| Milestone | Investment | Key Features |
| --- | --- | --- |
| **M4 Goal Engine** | $2,500 | Goal wizard, AI portfolio generator, plain-English rationale. |
| **M5 Passive Income Calc** | $4,000 | Reverse-engineering engine, CA+US tax-drag toggle, inflation/milestone tracking. |
| **M6 Check-in & Rebalance** | $5,000 | Drift detection, monthly cron jobs, rebalance UI, email notifications. |
| **M7 Polish, Beta, Launch** | $3,000 | UX pass, admin console, closed beta (10-20 members), web launch. |
| **M8 iOS + Android Builds** | $2,500 | Native builds, push notifications, store submissions. |
| **Total Phase 1B** | **$17,000** | |

---

## Operational Costs

These third-party costs are passed through and not included in the build fee:

* **SnapTrade:** Free up to 100 accounts, then ~$1/account.
* **AI API (Claude/Gemini/GPT):** $15–$100/mo (scales with users).
* **Vector DB:** $25–$70/mo.
* **Market Data:** Free to $25/mo.
* **Email:** Free to $40/mo.
* **Total estimated ops:** **~$40 to $235 CAD/mo**.

---

## Project Governance

* **Ownership:** You own everything, including the private GitHub repository.
* **Refund Policy:**
  * **Prior to M1:** Fully refundable.
  * **Post M1:** Completed and accepted milestones are final.
  * **Cancellation:** Work stops immediately; you keep all code developed up to the last accepted milestone.
* **Open Questions:** Blundr is seeking clarification on the depth of the "What If" simulator, the Risk & Crash simulator, and the specific fields/overlays required for the ETF comparison tool.

---

## Next Steps

Book a 30-minute call with the Blundr team to review the build plan, technical stack, and risks before committing.
