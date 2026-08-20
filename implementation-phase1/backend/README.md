# VidyutChain Backend

The Node.js/Express platform API owns authentication, meter registry, telemetry ingestion, alerts, audit records, and the blockchain integration boundary.

## Local run

```bash
npm install
npm run dev
```

The initial health check is available at `http://localhost:4000/health`.

## End-to-end check

With MongoDB running and the backend available, set `E2E_PASSWORD` in the local process environment and run:

```bash
npm run e2e
```

Optional environment variables are `E2E_EMAIL`, `E2E_METER_ID`, and `VIDYUTCHAIN_BASE_URL`. The check does not print access tokens. See [the Day 1 evidence runbook](../docs/day1-evidence-runbook.md) for the complete simulator and recovery sequence.

## Blockchain audit boundary

The backend blockchain client is disabled until `BLOCKCHAIN_CONTRACT_ADDRESS` and `BLOCKCHAIN_PRIVATE_KEY` are configured. With a local Hardhat node or private chain available, it hashes canonical audit payloads and supports meter registration, audit-event logging, and tamper verification. See [the blockchain README](../blockchain/README.md) for deployment commands.

An authenticated `GET /api/telemetry/audit/:telemetryId` endpoint reconstructs the stored AI anomaly evidence and verifies it against the on-chain hash. A changed database record therefore returns `verified: false`.
