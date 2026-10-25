# Dashboard Bot Integration Map

Last updated: 2026-03-06

This map is based on the local dashboard repo at `C:\Users\joshj\Desktop\negan-dashboard` and the bot repo at `C:\Users\joshj\Desktop\Negan Bot`.

## 1. Bot API Base and Auth

- Bot base URL used by the dashboard proxies: `BOT_API_URL` or `http://127.0.0.1:3001`
- Shared dashboard auth header: `x-dashboard-token`
- Bot routes also accept `x-api-key` or `Authorization: Bearer ...`
- Strict guild access can be enforced by the bot with actor `userId`

## 2. Real Bot-Backed Dashboard Routes

These dashboard routes already proxy to the bot and should be treated as the source of truth.

| Dashboard route | Bot route | Backing store |
| --- | --- | --- |
| `/api/bot/guild-data` | `GET /guild-data?guildId=...` | Live Discord guild state plus Prisma `Guild`, `GuildConfig`, `GuildFeatures` |
| `/api/bot/guild-access` | `GET /guild-access?guildId=...&userId=...` | Bot permission service against live guild member roles/perms |
| `/api/bot/guild-features` | `GET/POST /guild-features` | Prisma `GuildFeatures` |
| `/api/bot/dashboard-config` | `GET/POST /dashboard-config` | Computed view over `GuildFeatures` plus bot engine config store |
| `/api/bot/engine-config` | `GET/POST/PUT /engine-config` | Bot file store `data/guildEngineConfig.json` |
| `/api/control/engine-config/[engineId]` | `GET/POST/PUT /engine-config` | Same bot engine config store, but scoped to one engine |
| `/api/bot/automations` | `GET /api/automations/:guildId`, `POST /api/automation` | Prisma `Automation`, `AutomationBlock`, `AutomationExecutionLog` |
| `/api/bot/automation/[id]` | `GET/PUT /api/automation/:id` | Prisma `Automation`, `AutomationBlock` |
| `/api/bot/automation/[id]/blocks` | `PUT /api/automation/:id/blocks` | Prisma `AutomationBlock` |
| `/api/bot/automation/[id]/publish` | `POST /api/automation/:id/publish` | Prisma `Automation` |
| `/api/bot/automation/[id]/logs` | `GET /api/automation/:id/logs` | Prisma `AutomationExecutionLog` |
| `/api/bot/commands` | `GET /api/commands/:guildId`, `POST /api/command` | Prisma `CustomCommand` |
| `/api/bot/command/[id]` | `PUT/DELETE /api/command/:id` | Prisma `CustomCommand` |

## 3. Bot Response Shapes That Matter To The UI

### `GET /guild-data`

Returns:

- `guild`: id, name, icon
- `roles`: live guild roles
- `channels`: live guild channels
- `premium`: premium plan state
- `features`: canonical guild feature flags
- `privateGuild`: whether private-only features are allowed

This is the main source for role pickers, channel pickers, guild name bootstrapping, premium lock state, and feature lock rules.

### `GET /dashboard-config`

Returns a composed dashboard snapshot:

- `features`
- `persona`
- `security.preOnboarding`
- `security.onboarding`
- `security.verification`
- `security.lockdown`
- `security.raid`
- `giveaways`

Important detail: this is not a standalone database table. The bot builds it from:

- Prisma `GuildFeatures`
- bot engine config file store via `services/engineConfigService.js`

### `GET /engine-config`

Supported engine keys on the bot today:

- `preOnboarding`
- `onboarding`
- `verification`
- `lockdown`
- `raid`
- `persona`
- `giveaways`
- `tts`

These are persisted in the bot repo file:

- `C:\Users\joshj\Desktop\Negan Bot\data\guildEngineConfig.json`

## 4. Dashboard Areas Already Mapped To Real Bot Data

These surfaces are using real bot APIs, not just local dashboard files.

- Guild selection and guild metadata
- Role and channel pickers
- Dashboard access gate and guild admin checks
- Feature toggles backed by `/api/bot/guild-features`
- Security engine matrix backed by `/api/bot/dashboard-config` and `/api/bot/engine-config`
- Lockdown and raid editors
- Command Studio
- Automation Studio
- Engine detail page under `src/pages/dashboard/engines/[engineId].tsx`

## 5. Hybrid Pages: Bot + Local Dashboard JSON

These pages fetch bot data for guild context, but still persist most editor state in the dashboard repo itself.

- Tickets
- Selfroles
- TTS
- Utilities
- Invite tracker
- Giveaways UI
- Economy store
- Progression
- Leaderboard
- Radio / birthday
- Loyalty
- Governance
- Heist ops
- Games config
- AI pricing and personas
- Security profiles, policies, automation studio, and audit UI

Dashboard local stores involved:

- `data/setup/*.json`
- `data/baselines/*.json`
- `data/ui/*.json`

Primary helpers:

- `src/lib/setupStore.ts`
- `src/lib/configStore.ts`

This means many pages look guild-aware in the UI, but the saved data is still dashboard-local unless the route explicitly forwards to the bot.

## 6. Dashboard-Only Persistence Still Acting As Placeholder State

These dashboard routes are not the bot source of truth yet:

- Most `/api/setup/*` routes
- `src/lib/configStore.ts`
- `data/setup/*`
- `data/baselines/*`
- `data/ui/*`

Concrete examples:

- `src/pages/api/setup/utilities-config.ts` stores tickets, selfroles, persona, tts, radio, and loyalty config in dashboard-local JSON
- `src/pages/api/setup/governance-config.ts` stores crew, contracts, dominion, treasury, and warfare config in dashboard-local JSON

That is why several pages are visually complete but not yet wired to the bot runtime.

## 7. Bot Models Available For Proper Wiring

These bot Prisma models already exist and can support richer dashboard pages.

### Core guild and subscription

- `Guild`
- `GuildConfig`
- `GuildFeatures`
- `SubscriptionLog`
- `GlobalSubscription`

### Automation and commands

- `Automation`
- `AutomationBlock`
- `AutomationExecutionLog`
- `CustomCommand`
- `CommandUsageStats`

### VIP, loyalty, radio

- `VipMember`
- `RadioProfile`
- `RadioBoost`
- `LoyaltyProfile`
- `LoyaltyCosmetic`

### AI and Possum Bot

- `AiMemory`
- `AiCharacter`
- `PossumSettings`
- `PossumProfile`
- `PossumGuildConfig`
- `PossumGovernor`
- `PossumUserProfile`
- `PossumChannelProfile`
- `PossumKnowledge`

### Security

- `GateFlag`
- `VerificationState`
- `VerificationLog`
- `EntryState`
- `OnboardingState`
- `AuditLog`
- `Blacklist`
- `EnforcementAction`
- `UserSecurityProfile`
- `DomainReputation`
- `DomainUserRelation`
- `ThreatWave`
- `EnforcementRequest`
- `GovernanceState`
- `BehaviorProfile`
- `TrustProfile`
- `EscalationState`
- `SecurityConfig`
- `CrewSecurityProfile`
- `CrewInteractionLog`

### Dominion, crew, contracts-style gameplay

- `Crew`
- `DominionRaid`
- `DominionContribution`
- `DominionSeason`
- `DominionCrewStats`
- `DominionTerritory`
- `CrewAlliance`
- `DominionPerk`
- `DominionWar`
- `DominionWarCrew`
- `DominionCosmetic`
- `DominionEvent`

## 8. Current Mismatch Summary

The dashboard registry is broader than the bot API surface.

What is real today:

- guild data
- feature toggles
- engine config
- dashboard config
- automations
- custom commands
- guild access

What is mostly still dashboard-local:

- many setup panels under economy, access, security, AI, and governance
- most builder-style pages that save into `data/setup`, `data/baselines`, or `data/ui`

## 9. Recommended Wiring Order

1. Keep `guild-data`, `guild-features`, `dashboard-config`, `engine-config`, automations, and commands as the canonical control plane.
2. Replace remaining dashboard-local writes in `/api/setup/*` with bot-backed proxy routes one feature area at a time.
3. Start with the hybrid areas that already partially depend on bot state: TTS, giveaways, onboarding, tickets, selfroles, and governance.
4. After that, map data-heavy pages to real bot models: security analytics, loyalty/radio, AI memory/personas, and dominion/crew systems.

## 10. Key Files To Read First

Dashboard:

- `src/pages/api/bot/guild-data.ts`
- `src/pages/api/bot/guild-features.ts`
- `src/pages/api/bot/dashboard-config.ts`
- `src/pages/api/bot/engine-config.ts`
- `src/pages/api/control/engine-config/[engineId].ts`
- `src/lib/setupStore.ts`
- `src/lib/configStore.ts`

Bot:

- `app.js`
- `services/featureService.js`
- `services/engineConfigService.js`
- `services/guildAccessService.js`
- `prisma/schema.prisma`
