# Passive Income Investing

Client project for a mobile-first investing education and portfolio application, with an equivalent web experience. The existing `robo-advisor/` app is a React/Vite prototype; live product implementation is incomplete.

## Start here

- [Rebuild plan and milestone index](docs/rebuild/README.md)
- [Architecture](docs/rebuild/ARCHITECTURE.md)
- [Ordered implementation plan](docs/rebuild/REFACTOR_PLAN.md)
- [Capacity and reliability](docs/rebuild/CAPACITY_AND_RELIABILITY.md)
- [Shared readable mobile/web experience](docs/rebuild/PRODUCT_EXPERIENCE.md)
- [Contributor and agent rules](AGENTS.md)
- [Preserved source documents and workbook inventory](docs/reference/README.md)
- [Earlier implementation gap analysis](docs/reference/IMPLEMENTATION_GAP_ANALYSIS.md)

The signed agreement in `docs/reference/` is authoritative; earlier proposal-based milestone numbers are obsolete. M3 is the calculator; M5 is the AI/RAG advisor. Source documents contain confidential client IP and are not public application assets.

## Run the current prototype

```sh
cd robo-advisor
npm ci
npm run dev
```

Current checks:

```sh
cd robo-advisor
npm run build
npm run lint
```

At the audited `master@4dbf440` baseline the build passes, lint reports nine errors, and there is no test script in this app. Node is not yet pinned in this prototype; choosing a supported version and reproducible root workspace is the first implementation step. Do not confuse proposed rebuild commands/layouts with commands that already exist.

## Branches and planning status

- `codex/foundation-rebuild-plan`: planning branch from `master`; contains the rebuild documentation and AGENTS.md. Application refactoring has not started here.
- `feat/portfolio-import@f3b65e2`: independent worktree with auth/routing/schema/parser groundwork and 33 passing unit tests at audit time. Its live provider and visible import workflow are incomplete.
- `docs/superpowers/` and `PHASE_1_REQUIREMENTS.md`: historical prototype plans, with scope/numbering conflicts identified in the rebuild plan.

No production provisioning, database reset, shared history rewrite, or claim of 300,000-user capacity is implied by this documentation. Beta planning uses the user's stated 2,500 users and approximately 1,000 simultaneously online.
