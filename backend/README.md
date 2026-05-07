# AI CRM Backend

## Quick Start

1. Copy environment file:

```bash
cp .env.example .env
```

2. Install dependencies and run seed:

```bash
npm install
npm run seed
```

3. Start development server:

```bash
npm run dev
```

Backend runs at `http://localhost:4000`.

## Demo Credentials

- `admin@mabrook.app` / `password123`
- `broker@mabrook.app` / `password123`
- `user@mabrook.app` / `password123`

## Key API Endpoints

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/campaigns`
- `GET /api/referrals`
- `GET /api/admin/kpis`
- `PATCH /api/admin/referrals/:referralId/review`
- `POST /api/ref/:code/accept`
- `GET /api/users/:userId/accepted-campaigns`
- `GET /api/reports/rewards.pdf`
