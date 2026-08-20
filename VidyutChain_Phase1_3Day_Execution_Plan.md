# VIDYUTCHAIN — Phase 1: 3-Day Execution Plan

**Prepared:** August 19, 2026
**Deadline:** 3 working days (~30–36 focused hours)
**Scope:** Complete Phase 1 software MVP — backend, blockchain, AI analytics, web dashboard, mobile app, integration, security testing, documentation — ALL on simulated meter data
**Reference:** `VidyutChain_Phase1_Deliverables.md` (62 tracked items)

---

## 1. Honest Feasibility Verdict

### ✅ YES — Possible, under these conditions:

1. **Demo-grade MVP depth, not production depth.** Every module works end-to-end, but nothing is hardened for scale/high availability.
2. **Full-time execution** — ~10–12 focused hours per day, AI assistant (ZCode) generates the bulk of code, you review/test/demo.
3. **Pragmatic tech decisions** (Section 3) — one database instead of two, Expo for mobile, lightweight blockchain.
4. **STPI folder reuse** — dataset, anomaly labels, feature engineering, and charts are ALREADY DONE. This saves roughly half a day of AI module work.

### Current implementation checkpoint — August 20, 2026

- ✅ Local MongoDB Community Edition is running and connected (`mongodb://127.0.0.1:27017/vidyutchain`).
- ✅ Day 1 vertical slice is 100% complete (Simulator → Express API → MongoDB → History/Aggregation).
- ✅ AI classification (FastAPI + RandomForest) is active with 99.5% accuracy and connected to telemetry ingestion.
- ✅ The Solidity `EnergyAudit` contract runs on a local EVM private chain and stores hash-only meter/anomaly evidence.
- ✅ Meter registration and AI anomaly events are submitted through ethers.js with nonce-safe serialized writes.
- ✅ `GET /api/telemetry/audit/:telemetryId` verifies database evidence against on-chain hashes and detects tampering.
- ✅ React 19 + Vite web dashboard is live on `http://127.0.0.1:5173`.


### ❌ What will NOT happen in 3 days (accept now, document as roadmap):
- No Hyperledger Fabric production network (use local/private chain or hash-ledger instead)
- No real InfluxDB cluster (MongoDB time-series collections instead)
- No app-store releases (Expo Go instant demo; APK only if time permits)
- No load-tested, penetration-tested security (basic security pass + documented checklist instead)
- No polished UI/UX design system (clean functional admin-style UI)

**Bottom line:** The Phase 1 GLA milestone says *"completion of software MVP"* — an MVP is exactly what 3 days delivers. This is defensible.

---

## 2. Survival Strategy (Rules of the Sprint)

1. **One repo, one machine.** No microservices, no Docker orchestration on Day 1. Everything runs locally via `npm run dev`. Docker only if trivially easy on Day 3.
2. **Vertical slices, not layers.** Every few hours, something must be *demoable* — not "auth is 80% done".
3. **P0 → P1 → P2 priority discipline** (Section 5). When a block overruns its timebox, ship P0 and move on.
4. **Reuse everything:** STPI dataset & generator, the H1 report for docs, template scaffolds.
5. **Freeze scope at end of Day 2.** Day 3 is only: mobile + integration + polish + docs. No new backend features on Day 3.
6. **If anything catastrophic breaks → fallback options** (Section 8) are pre-decided. No mid-sprint debates.

---

## 3. Final Tech Stack (Speed-Optimized)

| Layer | Choice | Why (3-day logic) |
|---|---|---|
| Repo layout | Single folder `vidyutchain/` with `backend/ ai/ simulator/ dashboard/ mobile/ blockchain/ docs/` | Zero monorepo tooling overhead |
| Backend | Node.js + Express + Mongoose + JWT + Socket.IO + Zod validation + helmet + express-rate-limit | One process, fastest to build |
| Database | **MongoDB only** — with native **time-series collections** (Mongo 5.0+) for telemetry | One DB instead of two. InfluxDB documented as Phase 2 scale-out path |
| Meter Simulator | Python script adapted from STPI `generate_data.py` → POSTs telemetry to backend every 15s (1 sim-second = 15 real-minutes, configurable) | Already written; just add HTTP client + import/export kWh fields |
| AI Service | Python + FastAPI + scikit-learn (RandomForest classifier + IsolationForest) trained on `meter_data_6months_20meters.csv`; simple seasonal-naive forecast | Dataset pre-labeled; training is minutes, not hours |
| Blockchain | **Primary:** local private Ethereum chain (Hardhat/Anvil) + one `EnergyAudit.sol` contract + ethers.js (timebox: 4 hrs). **Fallback:** hash-chained append-only ledger service in Node (each record = hash of previous; live tamper-detection demo) | Real chain is more credible; hash-chain is nearly fail-proof. Switch at hour 4 if stuck |
| Web Dashboard | Vite + React + **Ant Design** + ECharts | Admin components + charts out of the box; fastest credible dashboard |
| Mobile App | **React Native + Expo** (managed) + React Native Paper | Demo instantly on your phone via Expo Go — no Android Studio, no signing. EAS build for APK only if time remains |
| Real-time | Socket.IO (backend → dashboard live tiles) | 1–2 hours of work, huge demo value |
| Docs | Markdown, assembled from H1 report + code comments | No fancy tooling |

---

## 4. What We Reuse from STPI Folder

| STPI Asset | Reused As | Deliverable Items Covered |
|---|---|---|
| `meter_data_6months_20meters.csv` (10K records, 22 cols, labeled) | AI training + evaluation dataset; seed data for backend | 4.2 ✅, 4.3 (mostly), 2.11 (partial) |
| `generate_data.py` (UCI baseline + 4-class anomaly injection) | Core of the live Meter Simulator (add HTTP POST + import/export fields) | 2.11 |
| Feature engineering (rolling stats, ratios) | Backend/AI feature pipeline reference | 4.3 |
| 6 PNG visualizations | Reports, docs, demo backup slides | 8.6 (partial) |
| Anomaly taxonomy (LOAD_THEFT, METER_TAMPERING, REVERSE_ENERGY, COMM_FAILURE) | AI module's classification schema | 4.5, 4.6 |

**Estimated time saved: ~6–8 hours (half of Day 1's data work is already done).**

---

## 5. Prioritization of All 62 Items

### P0 — Demo-critical (MUST work by end of Day 2) — 26 items
These are the spine of the end-to-end demo:
**Simulator & Backend:** 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.11
**AI:** 4.1, 4.4, 4.5, 4.6, 4.7, 4.9
**Dashboard:** 5.1, 5.2, 5.3, 5.4, 5.7
**Mobile:** 6.1, 6.2, 6.3, 6.4
**Integration:** 7.1
**Docs:** 8.1, 8.2

### P1 — Important (MVP depth, done if on schedule) — 21 items
**Requirements:** 1.1–1.7 (condensed: ONE architecture doc + ONE API spec + schemas — drafted from H1 report, ~2 hrs total)
**Backend:** 2.8, 2.9, 2.10
**Blockchain:** 3.1–3.5
**Dashboard:** 5.5, 5.6, 5.8, 5.9
**Mobile:** 6.5, 6.6
**Security:** 7.2, 7.3, 7.4

### P2 — Minimal / roadmap-note (end of Day 3 if time) — 15 items
**Backend:** 2.12 (basic request logging only)
**AI:** 4.8 (seasonal-naive forecast, not ML-heavy)
**Mobile:** 6.7 (Expo Go demo suffices; APK = stretch)
**Testing:** 7.5 (light simulator load-run), 7.6 (bugfix buffer)
**Docs:** 8.3 (README quick-start), 8.4 (short user guide), 8.5, 8.6
**Blockchain:** 3.6 (covered by 7.1 demo if 3.1–3.5 done)

### Item Disposition Summary

| Category | Count | Treatment |
|---|---|---|
| P0 demo-critical | 26 | Fully working |
| P1 important | 21 | Working at MVP depth |
| P2 minimal | 15 | Basic version OR documented roadmap note |

---

## 6. Day-by-Day Schedule (Hour Blocks)

### ☀️ DAY 1 — Foundation & Data Flow (target: data flows end-to-end by night)

| Time | Block | Work | Deliverable IDs |
|---|---|---|---|
| Hr 0–1 | **Environment + repo setup** | Verify Node 20+, Python 3.11+, MongoDB running (local or Atlas free tier). Create `vidyutchain/` folder structure, git init | 2.1 |
| Hr 1–3 | **Backend skeleton** | Express app, config, Mongoose models: User, Device/Meter, Telemetry (time-series coll), Alert. Error handling, request logging | 2.1, 2.2, 2.3 |
| Hr 3–5 | **Auth + registries** | JWT auth (register/login/me), role middleware (admin/consumer), device & meter registry CRUD APIs, Zod validation | 2.4, 2.5, 2.6 |
| Hr 5–7 | **Telemetry ingestion** | POST `/api/telemetry` (single + batch), validation, write to time-series collection, device last-seen update | 2.7 |
| Hr 7–9 | **Meter Simulator** | Adapt STPI `generate_data.py`: add `import_kwh`/`export_kwh` (negative-power rows → export), HTTP POST loop every N seconds per meter, seed users+devices script | 2.11 |
| Hr 9–10 | **History + aggregation APIs** | Aggregation endpoints: hourly/daily/weekly/monthly per meter, latest-reading endpoint | 2.8 |
| Hr 10–11 | **Checkpoint: FIRST VERTICAL SLICE** | Simulator running → data in Mongo → queryable via API with JWT. Test with curl/Postman | — |
| Hr 11–12 | **Arch docs draft** | Condensed architecture doc + API spec skeleton (from H1 report) while simulator generates history | 1.1–1.7 |

**Day 1 Exit Criteria:** Telemetry flows simulator→backend→DB→API. Auth works. ~1hr+ of history accumulated.

---

### ☀️ DAY 2 — AI + Blockchain + Dashboard (target: full web demo by night)

| Time | Block | Work | Deliverable IDs |
|---|---|---|---|
| Hr 0–1 | **AI service setup** | FastAPI skeleton, load STPI CSV, train/test split | 4.1 |
| Hr 1–3 | **Anomaly + theft models** | RandomForest (5-class: NORMAL/LOAD_THEFT/METER_TAMPERING/REVERSE_ENERGY/COMM_FAILURE) + risk-score output (class probability blend). Evaluate: accuracy, per-class F1 — record metrics | 4.5, 4.6, 4.7, 4.4 |
| Hr 3–4 | **AI ↔ backend integration** | Backend calls AI service on new telemetry (or AI polls), writes anomaly results + risk scores, creates Alerts | 4.9, 2.10 (partial) |
| Hr 4–8 | **Blockchain layer** ⏱ *timebox 4h* | PRIMARY: Hardhat local chain + `EnergyAudit.sol` (registerMeter, logEnergyCheckpoint → returns tx hash; verify by re-reading). Backend integration: on meter registration + on anomaly events + periodic checkpoints. **If stuck at hour 4 → switch to hash-chain fallback** (append-only `LedgerRecord` with prev-hash; `/verify` endpoint) | 3.1–3.5 |
| Hr 8–11 | **Web Dashboard core** | Vite+React+AntD: login, live monitoring page (poll/Socket.IO: V, I, kW, PF, import/export, status), historical charts (ECharts line/bar daily-weekly-monthly) | 5.1, 5.2, 5.3, 2.9 |
| Hr 11–12 | **Dashboard: AI + alerts pages** | Anomaly list with type/severity/risk score, alert feed | 5.4, 5.7 |

**Day 2 Exit Criteria:** Open dashboard → see live meters updating → AI flags injected anomalies → events visible on chain/ledger.

---

### ☀️ DAY 3 — Mobile + Integration + Security + Docs (target: shippable)

| Time | Block | Work | Deliverable IDs |
|---|---|---|---|
| Hr 0–1 | **Mobile setup** | Expo app scaffold, API client, JWT login screen | 6.1 |
| Hr 1–3 | **Mobile core screens** | Live usage screen, history screen, alerts screen (reuse same APIs) | 6.2, 6.3, 6.4, 6.5 |
| Hr 3–4 | **Mobile extras** | Device list/status screen, notification stub | 6.6 |
| Hr 4–6 | **Integration pass** | Full-chain demo run: Simulator → Backend → DB → AI → Alert → Blockchain → Dashboard + Mobile. Fix breaks. Dashboard leftovers: meter health page, multi-meter view, audit-trail view | 7.1, 5.5, 5.6, 5.9, 5.8 |
| Hr 6–8 | **Security pass** | helmet, rate limiting, input validation audit, auth-flow test matrix (unauthorized access, expired token, role checks), TLS note (local demo = HTTP; document production HTTPS). Write security test summary | 7.2, 7.3, 7.4 |
| Hr 8–10 | **Documentation sprint** | Finalize: architecture doc, full API reference (from route defs), quick-start/deploy guide, user manual (dashboard+mobile), AI methodology (with metrics + STPI charts), blockchain audit framework doc | 8.1–8.6, 1.x final |
| Hr 10–11 | **Freeze + polish + forecast (if time)** | P2 items: naive forecast endpoint, light load-run with simulator at max speed | 4.8, 7.5, 2.12 |
| Hr 11–12 | **DEMO REHEARSAL** | Run the Section 9 demo script end-to-end. Record backup video of the full flow | — |

**Day 3 Exit Criteria:** All P0 working. P1 mostly working. Video backup recorded. Docs complete.

---

## 7. Definition of "Done" at MVP Depth (so expectations are clear)

| Module | Production depth | Our 3-day depth (acceptable for MVP) |
|---|---|---|
| Backend | Scaled, clustered, CI/CD | Single process, all core APIs, validated inputs, JWT |
| Database | Dedicated TSDB cluster | MongoDB time-series collections |
| AI | Continuously retrained, drift monitoring | Trained once on labeled data, served live, metrics recorded |
| Blockchain | Fabric network, multiple orgs | Local private chain (or hash-ledger), audit events verifiable |
| Dashboard | Designed UX, responsive | Clean AntD admin UI, all views functional |
| Mobile | Store-ready, push infra | Expo app demoable on phone via Expo Go |
| Security | Pen-tested, audited | Secured endpoints, auth matrix tested, checklist documented |
| Docs | Full suite | Complete but concise markdown set |

---

## 8. Risks & Pre-Decided Fallbacks

| # | Risk | Trigger | Fallback (pre-decided, no debate) |
|---|---|---|---|
| 1 | Hardhat/contract integration eats time | > 4 hrs on Day 2 | Switch to hash-chained ledger service (2 hrs, bulletproof) |
| 2 | MongoDB time-series quirks | > 1 hr fighting | Plain collection + compound index on (meter_id, timestamp) |
| 3 | Expo/network issues on phone | > 45 min | Demo mobile on iOS simulator / Android emulator screenshots |
| 4 | AI model weak on some class | F1 low on COMM_FAILURE | Accept + document (NaN handling heuristic as rule-based backstop) |
| 5 | Day 2 dashboard slips | Dashboard core > 3 hrs over | Cut 5.8/5.9 to simple list pages; keep charts |
| 6 | Machine/env breaks | Any blocking env issue | MongoDB Atlas free tier + cloud-ready config |
| 7 | Everything slips | Day 3 morning behind | Freeze: ship P0 only, record video demo, P1 → "roadmap" section of docs |

**Golden rule: a working end-to-end demo beats a half-finished everything. Protect the P0 spine ruthlessly.**

---

## 9. Final Demo Script (the Phase 1 money-moment)

1. **Show the simulator running** — "20 virtual meters streaming live telemetry, derived from real UCI household data"
2. **Login to web dashboard** — live tiles updating in real time (V, I, kW, PF, import/export)
3. **Inject an anomaly** (trigger button in simulator: night-theft pattern) — within seconds: consumption drops on chart → AI classifies LOAD_THEFT with risk score → alert appears on dashboard
4. **Open mobile app** (Expo Go on phone) — same alert visible in consumer alerts screen
5. **Open audit trail** — the anomaly event + energy checkpoint written to chain; verify record hash/tx on the ledger/chain explorer
6. **Show tamper-evidence** — try editing a record in DB → verification endpoint flags mismatch ("blockchain detects tampering")
7. **Show historical analytics** — daily/weekly charts, multi-meter view, meter health
8. **Show docs** — architecture, API reference, security test summary, AI methodology with metrics
9. **Close:** "Complete Phase 1 software MVP delivered: cloud backend, AI analytics, blockchain audit, web + mobile interfaces — hardware integration follows in Phase 2 (Aug 2026–Jan 2027)"

---

## 10. What We Start With — Day 1, Hour 1

> Verify environment (Node 20+, Python 3.11+, MongoDB) → create `vidyutchain/` repo structure → Express skeleton with User/Meter/Telemetry models.

**That's the starting line. Everything else follows the schedule above.**

---

## Appendix: Quick Reference — Item → Day Mapping

| Day | Deliverable Items Completed |
|---|---|
| **Day 1** | 2.1–2.8, 2.11, 1.1–1.7 (drafts), 4.2 (reuse) |
| **Day 2** | 4.1, 4.4–4.7, 4.9, 3.1–3.5, 5.1–5.4, 5.7, 2.9, 2.10 |
| **Day 3** | 6.1–6.6, 7.1–7.4, 5.5, 5.6, 5.8, 5.9, 8.1–8.6, 4.8*, 7.5*, 2.12*, 6.7* (*if time) |
