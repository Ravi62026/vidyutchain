import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * React component to detect wallet address changes and handle automatic logout
 */
const WalletChangeDetector = ({ apiUrl, walletAddress }) => {
  const navigate = useNavigate();
  const initialWalletRef = useRef(walletAddress);

  // Clear auth tokens and logout
  const logout = () => {
    console.log('Wallet changed, logging out');
    
    // Make logout request to clear server cookies
    fetch(`${apiUrl}/api/logout`, {
      method: 'POST',
      credentials: 'include'
    }).catch(err => console.error('Error during logout:', err));
    
    // Clear local storage items related to auth
    localStorage.removeItem('user');
    localStorage.removeItem('wallet');
    
    // Redirect to login page
    navigate('/');
  };

  // Set up wallet monitoring
  useEffect(() => {
    if (!walletAddress) {
      console.error('No wallet address provided to WalletChangeDetector');
      return;
    }
    
    initialWalletRef.current = walletAddress;
    
    // Set up wallet event listeners for Solana
    const handlePhantomAccountChange = (newPublicKey) => {
      if (!newPublicKey) {
        logout();
        return;
      }
      
      const newAddress = newPublicKey.toString();
      if (initialWalletRef.current !== newAddress) {
        logout();
      }
    };
    
    // Add event listeners
    if (window.solana?.isPhantom) {
      window.solana.on('accountChanged', handlePhantomAccountChange);
    }
    
    // Cleanup function
    return () => {
      // Remove event listeners
      if (window.solana?.isPhantom) {
        window.solana.off('accountChanged', handlePhantomAccountChange);
      }
    };
  }, [walletAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  // This component doesn't render anything
  return null;
};

export default WalletChangeDetector; 