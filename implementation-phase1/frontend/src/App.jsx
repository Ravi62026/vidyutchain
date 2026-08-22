import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { AppLayout } from './components/AppLayout.jsx'
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute.jsx'
import { PublicLayout } from './components/PublicLayout.jsx'
import { DashboardPage } from './pages/DashboardPage.jsx'
import { HomePage } from './pages/HomePage.jsx'

const PlatformPage = lazy(() => import('./pages/PlatformPage.jsx').then(({ PlatformPage }) => ({ default: PlatformPage })))
const EnergyHubPage = lazy(() => import('./pages/EnergyHubPage.jsx').then(({ EnergyHubPage }) => ({ default: EnergyHubPage })))
const ArchitecturePage = lazy(() => import('./pages/ArchitecturePage.jsx').then(({ ArchitecturePage }) => ({ default: ArchitecturePage })))
const AiIntelligencePage = lazy(() => import('./pages/AiIntelligencePage.jsx').then(({ AiIntelligencePage }) => ({ default: AiIntelligencePage })))
const BlockchainAuditPage = lazy(() => import('./pages/BlockchainAuditPage.jsx').then(({ BlockchainAuditPage }) => ({ default: BlockchainAuditPage })))

const AlertsPage = lazy(() => import('./pages/AlertsPage.jsx').then(({ AlertsPage }) => ({ default: AlertsPage })))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage.jsx').then(({ AnalyticsPage }) => ({ default: AnalyticsPage })))
const AuditPage = lazy(() => import('./pages/AuditPage.jsx').then(({ AuditPage }) => ({ default: AuditPage })))
const AuditVerifyPage = lazy(() => import('./pages/AuditVerifyPage.jsx').then(({ AuditVerifyPage }) => ({ default: AuditVerifyPage })))
const CertificatesPage = lazy(() => import('./pages/CertificatesPage.jsx').then(({ CertificatesPage }) => ({ default: CertificatesPage })))
const LiveMonitoringPage = lazy(() => import('./pages/LiveMonitoringPage.jsx').then(({ LiveMonitoringPage }) => ({ default: LiveMonitoringPage })))
const LoginPage = lazy(() => import('./pages/LoginPage.jsx').then(({ LoginPage }) => ({ default: LoginPage })))
const MeterDetailPage = lazy(() => import('./pages/MeterDetailPage.jsx').then(({ MeterDetailPage }) => ({ default: MeterDetailPage })))
const MetersPage = lazy(() => import('./pages/MetersPage.jsx').then(({ MetersPage }) => ({ default: MetersPage })))
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx').then(({ RegisterPage }) => ({ default: RegisterPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx').then(({ SettingsPage }) => ({ default: SettingsPage })))
const SystemHealthPage = lazy(() => import('./pages/SystemHealthPage.jsx').then(({ SystemHealthPage }) => ({ default: SystemHealthPage })))
const TendersPage = lazy(() => import('./pages/TendersPage.jsx').then(({ TendersPage }) => ({ default: TendersPage })))
const TradingPage = lazy(() => import('./pages/TradingPage.jsx').then(({ TradingPage }) => ({ default: TradingPage })))
const WalletPage = lazy(() => import('./pages/WalletPage.jsx').then(({ WalletPage }) => ({ default: WalletPage })))

function RouteLoading() {
  return <div className="grid min-h-screen place-items-center bg-[#f4f7f5] text-sm font-semibold text-[#64736e]">Loading VidyutChain…</div>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteLoading />}>
          <Routes>
            {/* Public Layout & Dedicated Public Explanatory Pages */}
            <Route element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="platform" element={<PlatformPage />} />
              <Route path="architecture" element={<ArchitecturePage />} />
              <Route path="arch" element={<Navigate to="/architecture" replace />} />
              <Route path="ai-intelligence" element={<AiIntelligencePage />} />
              <Route path="ai" element={<Navigate to="/ai-intelligence" replace />} />
              <Route path="blockchain-audit" element={<BlockchainAuditPage />} />
              <Route path="audit-overview" element={<Navigate to="/blockchain-audit" replace />} />

              <Route path="login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
              <Route path="register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
            </Route>

            {/* Protected Console App Routes (Auth Required) */}
            <Route element={<ProtectedRoute />}>
              <Route path="app" element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="live" element={<LiveMonitoringPage />} />
                <Route path="meters" element={<MetersPage />} />
                <Route path="meters/:meterId" element={<MeterDetailPage />} />
                <Route path="wallet" element={<WalletPage />} />
                <Route path="trading" element={<TradingPage />} />
                <Route path="certificates" element={<CertificatesPage />} />
                <Route path="tenders" element={<TendersPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="alerts" element={<AlertsPage />} />
                <Route path="audit" element={<AuditPage />} />
                <Route path="audit/:telemetryId" element={<AuditVerifyPage />} />
                <Route path="health" element={<SystemHealthPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="energy" element={<EnergyHubPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
