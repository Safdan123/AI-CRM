# AI-CRM (Mabrook Rewards)

Enterprise microservices CRM for broker referrals & multi-currency rewards.
React 19 frontend + 11 Node.js microservices behind a Kong gateway, with
MongoDB (per-service DB), NATS JetStream events, Redis, Meilisearch, MinIO,
Mailpit, and Ollama — all wired via a single `docker compose` stack.

## Architecture

```
mabrook-web (Vite/React 19)
        │
        ▼  http://localhost:8000 (Kong gateway, declarative)
┌────────────────────────────────────────────────────────────┐
│  auth-service          (4001)  JWT + refresh tokens         │
│  user-profile-service  (4002)  profiles + MinIO avatars     │
│  campaign-service      (4003)  campaigns CRUD               │
│  referral-service      (4004)  referrals + acceptance       │
│  reward-service        (4005)  multi-currency ledger + FX   │
│  notification-service  (4006)  email + in-app + Socket.IO   │
│  content-service       (4007)  blogs CMS + public config    │
│  search-service        (4008)  Meilisearch query/index      │
│  analytics-service     (4009)  KPIs + counters              │
│  ai-service            (4010)  Ollama / OpenAI adapter      │
│  report-service        (4011)  PDF + Excel via BullMQ jobs  │
└────────────────────────────────────────────────────────────┘
        ▲                    ▲
        │  NATS JetStream    │  per-service Mongo databases
        │  (event bus)       │  (auth_db, users_db, …)
```

### Event flow (key example)

```
broker creates referral
  → referral-service publishes referrals.created
       ├→ notification-service: in-app + email to broker
       ├→ search-service: index the referral document
       └→ analytics-service: bump counters

admin marks referral converted
  → referral-service publishes referrals.reviewed + referrals.converted
       ├→ reward-service: convert FX, write multi-currency ledger,
       │   publish rewards.credited
       │       └→ notification-service: socket push to broker
       └→ analytics-service: bump conversion counters
```

## Tech stack

| Concern             | Tool                                                      |
| ------------------- | --------------------------------------------------------- |
| Gateway             | **Kong** 3.7 (DB-less, declarative `gateway/kong.yml`)    |
| Languages           | TypeScript on Node 20, ESM                                |
| HTTP                | Express 4 + Helmet + Zod validation                       |
| Persistence         | MongoDB 7 (one logical DB per service)                    |
| Cache / queues      | Redis 7 + BullMQ                                          |
| Event bus           | NATS JetStream 2                                          |
| Search              | Meilisearch v1.10                                         |
| Object storage      | MinIO (S3 compatible)                                     |
| Email (dev)         | Mailpit (SMTP + UI on port 8025)                          |
| Realtime            | Socket.IO 4                                               |
| AI                  | Ollama (default) with OpenAI adapter (env-switchable)     |
| FX                  | exchangerate.host (no API key, Redis-cached)              |
| Auth                | JWT (15 min access) + refresh (7 day, rotated, in Redis)  |
| Logging             | Pino (pretty in dev)                                      |

## Run locally

Prerequisites: **Docker Desktop** with Compose v2, **Node 20+**.

```bash
# spin up the entire backend stack (~2 minutes first build)
npm run stack:up

# pull the Ollama model in the background (one-time, ~2GB)
docker compose -f infra/docker-compose.yml logs ollama-pull

# seed demo accounts + campaigns + blogs
npm run seed

# run end-to-end smoke through Kong
npm run smoke

# tail logs from a single service
docker compose -f infra/docker-compose.yml logs -f referral-service
```

Frontend (separate terminal):

```bash
cd mabrook-web
cp .env.example .env       # already points VITE_API_URL at the gateway
npm install
npm run dev                # http://localhost:5173
```

### Demo accounts (after `npm run seed`)

| Role    | Email                  | Password      |
| ------- | ---------------------- | ------------- |
| admin   | admin@mabrook.app      | password123   |
| broker  | broker@mabrook.app     | password123   |
| user    | user@mabrook.app       | password123   |
| support | support@mabrook.app    | password123   |

### Useful URLs

| URL                         | What it is              |
| --------------------------- | ----------------------- |
| http://localhost:5173       | Frontend (Vite)         |
| http://localhost:8000       | Kong proxy (use this)   |
| http://localhost:8001       | Kong admin              |
| http://localhost:8025       | Mailpit inbox           |
| http://localhost:9001       | MinIO console           |
| http://localhost:7700       | Meilisearch dashboard   |
| http://localhost:8222       | NATS monitoring         |
| http://localhost:11434      | Ollama API              |

## Project layout

```
ai-crm/
├── mabrook-web/              # React 19 + Vite + Tailwind frontend
├── packages/
│   └── shared/               # @aicrm/shared: JWT, NATS, types, errors, events
├── services/
│   ├── auth-service/
│   ├── user-profile-service/
│   ├── campaign-service/
│   ├── referral-service/
│   ├── reward-service/
│   ├── notification-service/
│   ├── content-service/
│   ├── search-service/
│   ├── analytics-service/
│   ├── ai-service/
│   └── report-service/
├── gateway/
│   └── kong.yml              # declarative routes + CORS + rate limits
├── infra/
│   ├── docker-compose.yml    # full local stack
│   ├── Dockerfile.service    # generic Node 20 image (one per service)
│   ├── seed.mjs
│   └── smoke.mjs
├── package.json              # npm workspaces (packages/*, services/*)
└── README.md
```

## Service contracts (highlights)

All routes go through Kong on port `8000`. Auth uses `Authorization: Bearer <accessToken>`.

### auth-service

| Method | Path                       | Notes                        |
| ------ | -------------------------- | ---------------------------- |
| POST   | /api/auth/signup           | Returns access+refresh + user |
| POST   | /api/auth/login            | Returns access+refresh + user |
| POST   | /api/auth/refresh          | Body: `{refreshToken}`        |
| GET    | /api/auth/me               | Current user                  |
| POST   | /api/auth/logout           | Revokes refresh token         |
| GET    | /api/admin/users           | admin/support only            |

### reward-service (multi-currency)

| Method | Path                          | Notes                                          |
| ------ | ----------------------------- | ---------------------------------------------- |
| GET    | /api/rewards/me               | Ledger + balance in base currency              |
| GET    | /api/rewards/cashflow         | admin/support — totals in base currency        |
| POST   | /api/rewards/adjustments      | admin — manual credit/debit in any currency    |
| GET    | /api/rewards/fx?base=USD      | Live exchange rates (cached in Redis 24h)      |

### ai-service

| Method | Path                           | Notes                                                    |
| ------ | ------------------------------ | -------------------------------------------------------- |
| GET    | /api/recommendations/:userId   | Vector-similarity recommendations (Ollama embeddings)    |
| POST   | /api/ai/chat                   | Provider-agnostic chat (Ollama default, OpenAI optional) |
| GET    | /api/ai/status                 | Which provider is active                                 |

Switch providers without code changes:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

### report-service

| Method | Path                              | Notes                                |
| ------ | --------------------------------- | ------------------------------------ |
| POST   | /api/reports/rewards              | Body: `{format: "pdf"\|"xlsx"}` → 202 + jobId |
| GET    | /api/reports/jobs/:jobId          | Job state                            |
| GET    | /api/reports/jobs/:jobId/download | Download once `state == "completed"` |

(legacy `/api/reports/rewards.pdf` still works for synchronous downloads.)

## Multi-currency

- Campaigns store `totalRewardAmount` + `rewardCurrency` (3-letter ISO).
- Reward ledger entries persist `amount`, `currency`, `amountInBase`, `baseCurrency`,
  and the `fxRate` used at write time.
- FX rates fetched from `https://api.exchangerate.host/latest` (no key required),
  cached in Redis for 24h, with a baked-in fallback table if the API is down.
- Frontend can call `getFxRates('USD')` to render values in the user’s preferred currency
  (stored on the profile as `preferredCurrency`).

## AI

By default the stack uses **Ollama** (`llama3.2` for chat, `nomic-embed-text` for
embeddings). Models are pulled automatically by the `ollama-pull` sidecar on
first boot. To switch to OpenAI later, set `AI_PROVIDER=openai` and
`OPENAI_API_KEY` on `ai-service` — no code change required.

Recommendations work by:
1. Subscribing to `campaigns.created` + `content.blog.published` events
2. Computing embeddings via the active provider
3. Storing `{type, refId, vector, meta}` in MongoDB
4. On request, finding cosine-similar items to a user's accepted campaigns

## Security notes (dev defaults to change for prod)

- `JWT_SECRET` and `JWT_REFRESH_SECRET` are set to dev defaults in compose. Override in production.
- Kong has CORS pinned to `http://localhost:5173` and a 600 req/min rate limit (30 for auth).
- All inter-service "internal" endpoints (`/_internal/*`) require `X-Internal-Key`
  header equal to `JWT_SECRET`. In production, switch to mTLS or a dedicated key.
- bcryptjs is used for password hashing; argon2 is recommended for hardened deployments.

## Troubleshooting

| Symptom                                | Try                                                       |
| -------------------------------------- | --------------------------------------------------------- |
| `npm run smoke` says rewards is empty  | Wait 5–10s; the conversion → reward flow is async via NATS |
| Avatars 404                            | MinIO `avatars` bucket is auto-created with public read    |
| AI endpoints time out on first request | Ollama is still pulling models — `docker compose logs ollama-pull` |
| FX rates show fallback values          | exchangerate.host blocked from your network — fallbacks ship in code |
| 502 from Kong                          | A backing service hasn't booted yet — `docker compose ps`  |
