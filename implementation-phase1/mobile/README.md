# VidyutChain Mobile Client (PWA & Mobile Strategy)

## Phase 1 MVP: Progressive Web Application (PWA)

For the **Phase 1 Software MVP**, mobile access is delivered through the built-in **Progressive Web Application (PWA)** integrated into the frontend dashboard:

- **Technology:** Vite PWA (`vite-plugin-pwa`), Workbox Service Worker, Web App Manifest (`manifest.webmanifest`).
- **Mobile Compatibility:** Fully responsive UI with mobile navigation drawer, touch-friendly metric cards, and responsive charts.
- **Standalone Mobile Installation:** Open `http://<HOST-IP>:5173` on Android Chrome or iOS Safari and tap **"Add to Home Screen"** / **"Install App"** for a full-screen, native-feeling app experience without app store overhead.
- **Shared API Contract:** Consumes the exact same authenticated REST APIs (`/api/auth`, `/api/meters`, `/api/telemetry`, `/api/alerts`) as the command center.

---

## Mobile Features Available in Phase 1 PWA

1. **Live Usage & Status:** Real-time electrical metrics (Voltage, Current, Power kW, Power Factor) with color-coded status badges.
2. **AI Anomaly & Theft Alerts:** Mobile notifications and alert inbox with continuous risk scores (0–1) and severity tags.
3. **Usage Breakdown:** Hourly and daily consumption trends with import/export net metering visibility.
4. **Blockchain Proof:** Direct link to verify tamper-evident energy audit records on the local EVM blockchain.

---

## Phase 2 Roadmap: Native Mobile App

- Native React Native / Expo Go client with push notifications (FCM / APNs) and Bluetooth/Wi-Fi provisioning for Phase 2 hardware edge gateways (ESP32).
