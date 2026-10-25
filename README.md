# Negan Bot Dashboard

Next.js dashboard for the bot. The bot API is a separate service/repository; the dashboard proxies requests to it and must use the same API token.

## Oracle Cloud VM deployment

Use Ubuntu LTS and Node.js 20.9 or newer. Run the dashboard as a non-root service and expose it through an HTTPS reverse proxy; the PM2 configuration binds Next.js to `127.0.0.1:3000`.

1. Clone this repository and install dependencies:

   ```sh
   npm ci
   ```

2. Copy `.env.example` to `.env` and configure:
   - Discord OAuth client ID and secret.
   - `DISCORD_REDIRECT_URI` as `https://<dashboard-domain>/api/auth/discord/callback`, matching the OAuth application's registered redirect URL.
   - A unique `SESSION_SECRET` (generate with `openssl rand -hex 32`).
   - `BOT_API_URL` and `DASHBOARD_API_TOKEN`, with the token matching the bot API's configuration.
   - `DASHBOARD_PUBLIC_URL` and `NEXT_PUBLIC_DASHBOARD_URL` to the dashboard's HTTPS origin.

3. Run checks and build:

   ```sh
   npm run lint
   npm run build
   ```

4. Start the process and configure PM2 startup:

   ```sh
   pm2 start ecosystem.config.cjs
   pm2 startup
   pm2 save
   ```

The dashboard's SQLite database is stored at `prisma/dashboard.db`; preserve and back it up across deployments. It contains dashboard sessions, so protect the file and its backups. Keep the bot API private to the VM/reverse-proxy network and use a strong shared `DASHBOARD_API_TOKEN`.

## Local development

```sh
npm ci
cp .env.example .env
npm run dev
```

The dashboard is not considered healthy solely because Next.js builds. Verify Discord OAuth, guild access, bot API health, and feature controls against a real guild after deployment.
