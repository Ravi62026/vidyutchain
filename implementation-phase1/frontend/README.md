# VidyutChain Frontend

React + Vite operational dashboard for the VidyutChain Phase 1 MVP.

## Architecture boundary

The frontend communicates only with the Node.js backend. It does not call the Python FastAPI service or blockchain RPC directly.

```text
React dashboard
  -> Node.js + Express API
      -> MongoDB
      -> FastAPI AI service
      -> EVM-compatible private audit chain
```

## Routes

Public:

- `/` — animated product homepage
- `/login` — backend-authenticated sign in
- `/register` — backend-authenticated operator registration

Protected:

- `/app` — command center
- `/app/live` — live telemetry monitoring
- `/app/meters` — meter registry
- `/app/meters/:meterId` — meter detail
- `/app/analytics` — telemetry aggregation
- `/app/alerts` — AI anomaly inbox
- `/app/audit` — blockchain audit trail
- `/app/audit/:telemetryId` — audit verification
- `/app/health` — service health
- `/app/settings` — configuration summary

## Environment

Copy `.env.example` to `.env` when the backend is not running on the default URL:

```powershell
Copy-Item .env.example .env
```

Default:

```text
VITE_API_BASE_URL=http://localhost:4000
```

## Run

```powershell
npm install
npm run dev
```

## Validate

```powershell
npm run lint
npm run build
```

The production build and ESLint suite currently pass.
