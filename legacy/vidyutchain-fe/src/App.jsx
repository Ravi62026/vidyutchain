import React, { useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Solana wallet imports
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

// Auth provider
import AuthProvider, { RequireAuth } from './components/AuthCheck';

// Import components
import Auth from './components/Auth';
import AdminAuth from './components/AdminAuth';
import AdminDashboard from './components/AdminDashboard';
import Dashboard from './components/Dashboard';
import Home from './components/Home';
import TheftDetection from './components/TheftDetection';
import EnergyTrading from './components/EnergyTrading';
import GridTendering from './components/GridTendering';
import GridRegistration from './components/GridRegistration';
import SolarInstallation from './components/SolarInstallation';
import SolarSellerDashboard from './components/SolarSellerDashboard';
import Profile from './components/Profile';
import Layout from './components/Layout';
import Team from './components/Team';

function App() {
  // You can also provide a custom RPC endpoint
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom endpoint
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Auth />} />
                <Route path="/admin/login" element={<AdminAuth />} />

                {/* Protected routes with navbar */}
                <Route path="/home" element={
                  <RequireAuth>
                    <Home />
                  </RequireAuth>
                } />
                <Route path="/dashboard" element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                } />
                <Route path="/admin/dashboard" element={
                  <RequireAuth>
                    <AdminDashboard />
                  </RequireAuth>
                } />
                <Route path="/theft-detection" element={
                  <RequireAuth>
                    <TheftDetection />
                  </RequireAuth>
                } />
                <Route path="/energy-trading" element={
                  <RequireAuth>
                    <EnergyTrading />
                  </RequireAuth>
                } />
                
                {/* Grid Tendering Routes */}
                <Route path="/grid-tendering/*" element={
                  <RequireAuth>
                    <GridTendering />
                  </RequireAuth>
                } />
                
                <Route path="/solar-installation" element={
                  <RequireAuth>
                    <SolarInstallation />
                  </RequireAuth>
                } />
                <Route path="/solar-seller/dashboard" element={
                  <RequireAuth>
                    <SolarSellerDashboard />
                  </RequireAuth>
                } />
                <Route path="/profile" element={
                  <RequireAuth>
                    <Profile />
                  </RequireAuth>
                } />
                <Route path="/team" element={
                  <RequireAuth>
                    <Team />
                  </RequireAuth>
                } />

                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;