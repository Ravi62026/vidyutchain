import React from 'react';
import { Outlet } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import Navbar from './Navbar';
import WalletChangeDetector from './WalletChangeDetector';

/**
 * Main layout component that wraps authenticated pages
 * Includes the Navbar and wallet change detection
 */
const Layout = ({ children }) => {
  const { publicKey } = useWallet();
  const walletAddress = publicKey ? publicKey.toString() : null;
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <Navbar />
      
      <main className="flex-grow">
        {children || <Outlet />}
      </main>
      
      {/* Wallet Change Detection */}
      {walletAddress && (
        <WalletChangeDetector 
          apiUrl={import.meta.env.VITE_BACKEND_URL}
          walletAddress={walletAddress}
        />
      )}
    </div>
  );
};

export default Layout; 