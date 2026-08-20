# VidyutChain Blockchain Audit Layer

This module contains the local private-chain prototype. It stores hashes of important meter and anomaly events, while MongoDB remains the operational telemetry database.

Phase 1 events:

- Meter registration
- Energy checkpoint
- Anomaly event

The backend will retain transaction metadata and expose a verification endpoint.

## Local verification

The package uses a local `solc-js` compiler so contract tests do not depend on downloading a compiler at runtime.

```powershell
npm install
npm test
```

Start a local private chain and deploy the contract:

```powershell
npm run node
npm run compile
npx hardhat run scripts/deploy.mjs --network localhost --no-compile
```

The backend blockchain client accepts `BLOCKCHAIN_RPC_URL`, `BLOCKCHAIN_CONTRACT_ADDRESS`, and `BLOCKCHAIN_PRIVATE_KEY`. It canonicalizes and hashes audit payloads before submitting them, and verifies the same digest by reading the contract back.
