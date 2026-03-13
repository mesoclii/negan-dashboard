# Low-Memory Deploy

Target: 1 GB RAM VM with swap.

## Build

Run:

```bash
npm run build
```

What it does:

- auto-detects low-memory hosts and switches into VM mode at `<= 1536 MB` total RAM
- caps the Next build heap at `384 MB` first, then retries at `448 MB` only if needed
- forces the low-memory static generation profile
- disables telemetry
- moves the current `.next` build to `.next.previous`
- restores `.next.previous` automatically if the new build fails

Rollback metadata is written to `negan-dashboard/.next.rollback.json`.

## Runtime

PM2 runtime is tuned in `negan-dashboard/ecosystem.config.cjs`:

- Node heap capped at `320 MB`
- semi-space reduced for lower transient memory pressure
- restart threshold set to `380 MB`

## Safer flow

1. `cd negan-dashboard`
2. `npm run build`
3. `pm2 reload ecosystem.config.cjs --only possum-dashboard`
4. If the reload is bad, stop the app, move `.next.previous` back to `.next`, and reload PM2 again.

## Host notes

- Keep swap enabled. The build is designed to survive brief spikes, not zero-swap hosts.
- Avoid running the bot build and dashboard build at the same time on a 1 GB box.
- Prefer `pm2 reload` over hard restarts so the existing process stays up until the new one is ready.
- `npm run build:vm` still exists if you want to force the low-memory path manually.
