# VidyutChain: Legacy System Analysis & Solana DePIN Integration Roadmap

> **Document Version:** 1.0.0  
> **Date:** August 21, 2026  
> **Status:** Approved Architectural Blueprint  
> **Repository:** [https://github.com/Ravi62026/vidyutchain.git](https://github.com/Ravi62026/vidyutchain.git)

---

## 1. Executive Summary

VidyutChain has evolved across two generations of development:
1. **The Legacy System (`legacy/`):** Focused on decentralized P2P solar energy trading, DISCOM grid tendering/bidding, solar installation marketplaces, RSA-signed carbon offset certificates ($0.85\text{ kg } CO_2/\text{kWh}$), and solar irradiance forecasting on the Solana blockchain.
2. **The Modern Current System (`implementation-phase1/`):** Focused on high-throughput smart meter IoT telemetry ingestion, real-time 99.5% accurate AI electricity theft & hardware tampering detection (FastAPI + Random Forest on STPI datasets), and cryptographic blockchain audit ledgers with an ultra-premium glassmorphic light-mode interface.

This document analyzes the legacy repositories, highlights the architectural alignment, documents our strategic decisions (transitioning to a **Solana DePIN Architecture with Embedded Smart Energy Wallets**), and outlines the step-by-step technical integration plan to unite both systems into a single end-to-end Smart Grid Super-Platform.

---

## 2. Legacy Codebase Deep Dive

The legacy codebase consists of three distinct repositories cloned under the `legacy/` directory:

```
legacy/
├── vidyutchain-fe/   ──► React 19 + Solana Web3 + P2P Trading Marketplace
├── vidyutchain-be/   ──► Express 5 + Mongoose + Tenders, Bids & Solar Products
└── vidyutchain-ai/   ──► Flask + Solar Weather Forecasting + Carbon Certificate Authority
```

### A. Frontend Repository (`legacy/vidyutchain-fe`)
* **Core Technology:** React 19, Vite, Tailwind CSS, `@solana/web3.js`, `@solana/wallet-adapter-react`, `@project-serum/anchor`, `@solana/spl-token`.
* **Key Components & Modules:**
  * **`EnergyTrading.jsx` (1,710 lines):** Comprehensive P2P energy trading marketplace allowing solar prosumers to list surplus energy (kWh) with dynamic price suggestions, escrow locking, and SPL token transfers.
  * **`GridTendering.jsx`, `CreateTender.jsx`, `CreateBid.jsx`, `BidList.jsx`, `AdminBids.jsx`:** DISCOM tender management where grid operators open bulk energy procurement requests and solar sellers submit competitive bids.
  * **`CarbonCertificateCard.jsx`, `VirtualGridPool.jsx`, `CertificateService.js`:** Carbon offset certificate viewer and claim pool for industrial consumers seeking renewable energy credits (RECs).
  * **`SolarInstallation.jsx`, `SolarSellerDashboard.jsx`:** Solar panel hardware marketplace connecting equipment vendors with household buyers.
  * **`TheftDetection.jsx` (918 lines):** Energy flow diagram visualizing power distribution nodes and highlighting anomalous consumers in red.
  * **Role Dashboards:** Multi-persona interfaces for `AdminDashboard`, `IndustryDashboard`, and `SolarSellerDashboard`.

---

### B. Backend Repository (`legacy/vidyutchain-be`)
* **Core Technology:** Node.js, Express 5, Mongoose 8, `@solana/web3.js`, `@noble/ed25519`, `tweetnacl`, `node-cron`.
* **Database Models (`model/`):**
  * `User.js`: User accounts with Solana wallet addresses, role enum (`admin`, `seller`, `buyer`, `industry`), and profile metadata.
  * `Grid.js`: Virtual grid and feeder area definitions.
  * `Tender.js`: Energy procurement tenders (`draft`, `open`, `closed`, `awarded`, `cancelled`) with start/end dates, base price, and requirements.
  * `Bid.js`: Supplier bid submissions linked to tenders with pricing and acceptance status.
  * `SolarProduct.js` & `SolarInstallation.js`: Hardware inventory and installation service requests.
* **Utilities & Cron Jobs (`utils/`):**
  * `solanaUtils.js` & `walletUtils.js`: Ed25519 cryptographic signature verification and wallet validation.
  * `tokenTransfer.js`: SPL token transfer execution for energy marketplace purchases.
  * `cronJobs.js`: Scheduled jobs for automated tender expiration and status updates.

---

### C. AI & Intelligence Repository (`legacy/vidyutchain-ai`)
* **Core Technology:** Python, Flask, Cryptography (RSA-2048 / SHA-256 PSS), Solcast API, OpenWeatherMap API, NumPy, Pandas.
* **Key Features in `app.py` (1,022 lines):**
  * **AI Solar Weather & Dynamic Pricing Engine (`/api/predict-price`):**
    * Computes solar irradiance forecasting ($W/m^2$) using Solcast and clear-sky models.
    * Models PV panel efficiency loss due to ambient temperature ($-0.4\%$ efficiency per $^\circ C$ above $25^\circ C$).
    * Time-of-day multipliers (Night off-peak $1.8\times$ vs Midday solar surplus $0.88\times$).
    * Seasonal pricing adjustments (Winter $1.25\times$ vs Summer $0.90\times$).
  * **Cryptographic Carbon Offset Certificate Authority (`/api/certificates/*`):**
    * Calculates carbon offsets: $1\text{ kWh Renewable Energy} = 0.85\text{ kg } CO_2\text{ Offset}$.
    * Generates, signs (RSA-2048 private key), and verifies digital green certificates.
    * Tracks immutable certificate transfer history between producers and industrial buyers.
  * **Virtual Grid Energy Pool (`/api/virtual-grid-pool/*`):**
    * Aggregates micro-solar exports into virtual energy pools for bulk industrial claiming.

---

## 3. Comparative Matrix: Legacy vs. Current Architecture

| Architectural Dimension | Legacy Implementation (`legacy/`) | Current Modern Stack (`implementation-phase1/`) | Unified Target Platform |
| :--- | :--- | :--- | :--- |
| **Primary Value Prop** | P2P Energy Trading, Tenders, Carbon Credits | High-Frequency Smart Meter IoT, 99.5% AI Theft Detection, Tamper Auditing | **Full-Cycle DePIN Smart Grid & Energy Market OS** |
| **Blockchain** | Solana (Manual Phantom Wallet popups per transaction) | EVM / Ethereum (Relayer signing with `EnergyAudit.sol`) | **Solana DePIN Network (with Embedded Gasless Smart Wallet)** |
| **Transaction Fees** | Low (Solana SPL) | Gas fees on EVM nodes | **Sub-Cent ($0.00025) Solana Micro-Transactions** |
| **AI Architecture** | Flask + Solar Weather & Dynamic Pricing formulas | FastAPI + Scikit-Learn (RandomForest 99.5% Acc on STPI dataset) | **Unified FastAPI Engine (Anomaly Detection + Solar Weather Pricing)** |
| **User Experience** | Dark Purple/Black Tailwind v3 | Ultra-Premium Glassmorphic Light-Mode (`Outfit`, `Plus Jakarta Sans`, `JetBrains Mono`) | **Ultra-Premium Light-Mode Glassmorphism across all modules** |
| **Wallet Model** | External Phantom wallet connection | JWT Session authentication | **Embedded Smart Energy Wallet (Auto-Credit on Solar Export & Auto-Debit)** |

---

## 4. Key Architectural Decisions & Strategies

### Decision 1: Transition to Solana DePIN Architecture
* **Rationale:**
  1. **DePIN Leadership:** Solana is the premier blockchain for Decentralized Physical Infrastructure Networks (DePIN) worldwide. Pitching VidyutChain as a *Solana-Powered DePIN Grid* elevates its market positioning and venture appeal.
  2. **High Throughput (65,000 TPS):** Smart meters emit telemetry every 15 minutes across thousands of households. Solana handles high-frequency telemetry hashes effortlessly.
  3. **Sub-Second Finality (~400ms):** Enables instant P2P energy trading and live anti-theft verification without waiting for multi-block Ethereum confirmations.
  4. **Sub-Cent Transaction Costs ($0.00025):** Micro-energy trading (selling 2 kWh for ₹7) is only economically viable on sub-cent fee blockchains like Solana.

---

### Decision 2: Embedded Smart Energy Wallet (Zero User Crypto Friction)
* **The Problem:** Non-technical household consumers and DISCOM operators cannot manage seed phrases, browser extensions (Phantom), or manual transaction approvals for every kWh sold.
* **The Solution:**
  * **Auto-Provisioned Account Wallet:** Upon signup, the backend provisions a dedicated Solana wallet keypair / custodial sub-account.
  * **One-Time "Smart Energy Auto-Settle" Mandate:** The user enables auto-settlement once in their profile settings.
  * **Automatic Solar Credit:** Whenever live meter telemetry detects reverse active power (`exportKwh > 0`), the backend automatically credits the user's embedded wallet balance in real-time.
  * **Automatic P2P Debit:** When purchasing green energy from a peer, funds are seamlessly debited without wallet popups.
  * **Instant Bank / UPI Withdrawal:** Users can withdraw their accumulated solar earnings to their bank account at any time with 1 click.

---

## 5. Unified Integration Plan

```
┌────────────────────────────────────────────────────────────────────────┐
│               VIDYUTCHAIN UNIFIED PLATFORM ARCHITECTURE                 │
├────────────────────────────────────────────────────────────────────────┤
│ 1. EDGE TELEMETRY & HARDWARE (RS485 / Modbus / DLMS Smart Meters)      │
│    ⬇️ Real-Time Readings: Voltage, Current, Power kW, PF, Net kWh       │
├────────────────────────────────────────────────────────────────────────┤
│ 2. CLOUD INGESTION & FASTAPI AI ENGINE                                  │
│    • 5-Class Theft & Tamper Classifier (99.5% Acc - rf-stpi-v1)        │
│    • Solcast Solar Irradiance & Dynamic Weather Pricing Engine         │
├────────────────────────────────────────────────────────────────────────┤
│ 3. SOLANA DePIN SETTLEMENT & AUDIT LAYER                               │
│    • Anti-Theft Cryptographic Memo Auditing (Sub-400ms Finality)        │
│    • SPL Token Escrow for P2P Solar Energy Trading                     │
│    • RSA-Signed Carbon Offset Certificate Registry (0.85 kg CO2/kWh)   │
├────────────────────────────────────────────────────────────────────────┤
│ 4. EMBEDDED SMART WALLET & MARKETPLACE APPS                            │
│    • Embedded Energy Wallet (Auto-Credit on Export, 1-Click Withdraw)  │
│    • P2P Surplus Solar Trading Hub (Consumer-to-Consumer)              │
│    • DISCOM Bulk Tendering & Reverse Auction Bidding                   │
│    • Industrial Virtual Grid Green Energy Pool                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Implementation Milestones:

1. **Phase A — Solana DePIN Client & Telemetry Hashing:**
   * Integrate `@solana/web3.js` into the Node.js backend.
   * Write server-side authority relayer to record telemetry anomaly digests onto Solana Devnet/Localnet with sub-second confirmation.
2. **Phase B — Embedded Smart Energy Wallet Module:**
   * Build `wallet.routes.js` with auto-provisioning, balance inquiries, deposit simulation, and UPI/Bank payout hooks.
   * Build modern glassmorphic Smart Energy Wallet UI with live passbook ledger.
3. **Phase C — P2P Energy Trading Marketplace:**
   * Port legacy `EnergyTrading.jsx` into the ultra-modern light-mode design system.
   * Connect live meter solar export (`exportKwh`) directly to active market listings.
4. **Phase D — Carbon Offset Registry & Virtual Grid Pool:**
   * Integrate $0.85\text{ kg } CO_2/\text{kWh}$ offset calculation on all solar exports.
   * Render downloadable, cryptographically verifiable Green Energy Certificates.
5. **Phase E — DISCOM Tenders & Microgrid Bidding:**
   * Port `GridTendering.jsx` into the operator control room console.

---

*Authored by the VidyutChain Engineering Team • August 2026*
