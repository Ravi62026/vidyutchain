# VidyutChain Phase 1 Architecture

## System flow

```text
Python meter simulator
        |
        | REST telemetry
        v
Node.js/Express backend
        |
        +--> MongoDB: users, meters, telemetry, alerts, audit metadata
        |
        +--> FastAPI: anomaly classification and risk scoring
        |
        +--> Hardhat/Solidity: hashes of important audit events
        |
        +--> Socket.IO and REST APIs
                 |
                 +--> React web dashboard
                 +--> Expo mobile application
```

## Ownership boundaries

- Node.js owns platform APIs, authentication, persistence, alerts, and blockchain orchestration. After telemetry validation, it calls FastAPI and stores the returned model version, anomaly class, risk score, confidence, and reasons with the telemetry record.
- FastAPI owns model inference and analytics. It trains the reproducible STPI RandomForest model and does not write to MongoDB or create alerts directly.
- The simulator is a network client and never writes directly to the database.
- MongoDB stores operational and telemetry data.
- The blockchain stores hashes and transaction proof for important events, not raw telemetry.
- The backend ethers client canonicalizes event payloads, submits meter registration and audit-event transactions, and verifies the digest by reading the contract back. Raw telemetry stays in MongoDB.
