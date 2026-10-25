# SaaS Readiness Backlog

This file tracks the current SaaS hardening phase after the dashboard OAuth, premium catalog, and runtime split pass.

## Next Platform Work

- Keep the internal Possum names aligned across runtime models, database mappings, and dashboard controls.
- Expand adaptive-AI operator pages from routing/runtime controls into full learned-memory/admin tooling.
- Finish VM OAuth verification against the public dashboard URL after the new redirect logic is deployed.

## Current Assumptions

- Saviors remains the untouched full baseline guild.
- The public-games server remains the secondary baseline guild.
- OAuth/session guild discovery is handled in the dashboard, while bot invite/install state still comes from the live bot runtime.

## Ordered Execution Plan

1. Deploy the public URL redirect fix and live-test OAuth on the VM.
2. Verify Prisma-backed dashboard sessions and subscription sync against live bot premium state.
3. Bring Redis online on the VM so cache/event helpers move from no-op to live cluster sync.
4. Expand dashboard audit coverage from the central write routes to the remaining setup endpoints.
5. Verify the data-preserving table and progression migration on the production database.
6. Run the final bot-vs-dashboard reconciliation pass for overlap, missing depth, and ease-of-use gaps.

## Current Engine Findings

- The active adaptive learning pipeline uses `core/possum/*` and `engine/possumIntelligence.js`.
- Unused legacy character-specific runtime modules have been removed.
- `ai-core/runtime.js` and `ai-characters/runtime.js` are now explicitly marked as archived scaffolds instead of silent dormant handlers.
- Dashboard guild discovery now supports a public URL override, Prisma-backed session storage, rate limiting, subscription sync, and cache/audit helpers.
