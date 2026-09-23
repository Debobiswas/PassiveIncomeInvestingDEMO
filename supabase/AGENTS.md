# Database changes

Follow root AGENTS.md, the relevant milestone PRD, and `docs/runbooks/local-identity.md`. Load the Supabase and Postgres skills before schema/security work.

- Keep private base tables outside Data API exposure. Public commands are narrow security-invoker functions with explicit grants; critical invariants must hold when callers bypass the application API.
- Preserve ownership constraints, forced RLS, positive own-user tests and cross-user/direct-command denial tests. Do not make runtime requests service-role operations to bypass a policy failure.
- The existing private security-definer session helper is a narrow read-only exception. Do not broaden it or expose Auth internals through arbitrary user/session arguments.
- Do not invent approved disclosure wording or staff authority. Test content is synthetic and cleaned up.
- Append reviewed migrations after the baseline is committed. Reconcile any applied legacy/remote history before upgrades; the independent portfolio-import worktree is not this database.
- `npm run db:reset:local` destroys only the verified disposable local project. Do not reset remote or valuable local data. Run `db:check` and actual `test:integration` after schema changes; mocks do not prove RLS.
