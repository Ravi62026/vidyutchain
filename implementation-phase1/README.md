# VidyutChain Phase 1

Software MVP for simulated energy telemetry, AI-based anomaly intelligence, and blockchain-backed auditability.

## Components

- `backend/`: Node.js/Express platform API
- `ai/`: Python/FastAPI analytics service
- `simulator/`: real HTTP telemetry replay client
- `blockchain/`: Solidity/Hardhat audit layer
- `frontend/`: React/Vite dashboard
- `mobile/`: Expo mobile client
- `docs/`: architecture and acceptance evidence

## Execution plan

- [Day 1 ten-part implementation plan](docs/day1-implementation-plan.md)
- [Day 1 acceptance criteria](docs/day1-acceptance.md)
- [Day 1 evidence runbook](docs/day1-evidence-runbook.md)

Phase 1 is explicitly validated on simulated telemetry. Physical meter, RS485, and ESP32 integration are Phase 2 work.

## Current Validation Boundary

The local backend, telemetry contract, query APIs, simulator mapping/retry behavior, AI inference service, Node-to-FastAPI integration, blockchain contract, telemetry-to-chain anomaly integration, authenticated audit verification, and rejection tests are implemented and passing. MongoDB is not available in the current development environment, so live persistence remains explicitly blocked rather than replaced with in-memory data.
