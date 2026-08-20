# VidyutChain Phase 1

Software MVP for simulated energy telemetry, AI-based anomaly intelligence, and blockchain-backed auditability.

## 🚀 Quick Start (1-Command Orchestration)

To launch all services (MongoDB check, Hardhat EVM node, FastAPI AI service, Express backend, and Vite Web Dashboard):

```bash
cd implementation-phase1
./start_all.sh
```

To seed 20 smart meters and stream realistic STPI telemetry with AI anomaly and blockchain audit verification:

```bash
npm run demo:seed
```

To run all automated test suites across backend, blockchain, AI, and simulator (43 tests):

```bash
npm run test:all
```

---

## 📦 Components

- `backend/`: Node.js / Express platform API (Port 4000)
- `ai/`: Python / FastAPI analytics service with RandomForest classifier (Port 8000)
- `simulator/`: Python HTTP telemetry replay client streaming STPI 20-meter data
- `blockchain/`: Solidity `EnergyAudit.sol` on Hardhat private EVM chain (Port 8545)
- `frontend/`: React 19 / Vite / Tailwind Web Dashboard & Mobile PWA (Port 5173)
- `mobile/`: Mobile PWA client & native roadmap documentation
- `docs/`: Architecture, acceptance runbooks, and demo presentation guides

---

## 📚 Documentation & Guides

- [Demo Presentation Guide](docs/phase1-demo-guide.md)
- [Day 1 Ten-Part Implementation Plan](docs/day1-implementation-plan.md)
- [Day 1 Acceptance Criteria & Evidence](docs/day1-acceptance.md)
- [Day 1 Evidence Runbook](docs/day1-evidence-runbook.md)
- [System Architecture](docs/architecture.md)
- [Mobile PWA Strategy](mobile/README.md)

Phase 1 is validated on simulated smart meter telemetry. Physical meter, RS485, and ESP32 hardware integration are scheduled for Phase 2.
