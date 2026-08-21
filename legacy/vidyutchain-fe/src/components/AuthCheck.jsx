import React, { useEffect, createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Create a context to share authentication state
export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Controlled debug logger to silence noisy logs by default
const devLog = (...args) => {
  if (import.meta.env.VITE_DEBUG_LOGS === 'true') {
    console.log(...args);
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { connected, publicKey } = useWallet();
  const navigate = useNavigate();

  // Check authentication status
  const checkAuth = async () => {
    try {
      setLoading(true);
      devLog("Checking authentication...");
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/check-auth`, {
        method: 'GET',
        credentials: 'include',
        mode: 'cors'
      });

      devLog("Auth check response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        devLog("Auth check success:", data);
        if (data.success) {
          setUser(data.user);
          return true;
        }
      } else {
        // If response is not ok, check if it's an authentication error
        const errorData = await response.json();
        devLog('Auth check failed:', errorData);

        // Only clear user if it's a 401 Unauthorized error
        if (response.status === 401) {
          setUser(null);
        }
      }

      // If we get here, authentication failed
      return false;
    } catch (error) {
      console.error('Auth check error:', error);
      // Don't clear user on network errors, as this might be temporary
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include'
      });

      setUser(null);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Check auth on initial load and when wallet connection changes
  useEffect(() => {
    // Always check auth on initial load, regardless of wallet connection
    const initialAuthCheck = async () => {
      const isAuthenticated = await checkAuth();

      // If not authenticated and wallet is connected, try to verify wallet match
      if (!isAuthenticated && connected && publicKey) {
        try {
          devLog("Verifying wallet match...");
          
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/verify-wallet`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            mode: 'cors',
            body: JSON.stringify({
              walletAddress: publicKey.toString()
            })
          });

          devLog("Verify wallet response status:", response.status);
          
          const data = await response.json();
          devLog("Verify wallet result:", data);

          // If wallet doesn't match the one in the token, logout
          if (data.shouldLogout) {
            logout();
          }
        } catch (error) {
          console.error('Wallet verification error:', error);
        }
      }
    };

    initialAuthCheck();
  }, [connected, publicKey]);

  // Set up periodic session check to keep the user logged in
  useEffect(() => {
    // Check auth status every 5 minutes to keep the session alive
    const sessionCheckInterval = setInterval(() => {
      if (user) {
        checkAuth();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(sessionCheckInterval);
  }, [user]);

  // Provide auth context
  return (
    <AuthContext.Provider value={{ user, loading, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Component to protect routes
export const RequireAuth = ({ children }) => {
  const { user, loading, checkAuth } = useAuth();
  const { connected } = useWallet();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      setChecking(true);
      // If user is not loaded yet, try to check auth
      if (!user) {
        await checkAuth();
      }
      setChecking(false);
    };

    verifyAuth();
  }, []);

  useEffect(() => {
    // Only redirect if we're done checking and there's no user
    if (!loading && !checking && !user) {
      navigate('/');
    }
  }, [user, loading, checking, navigate]);

  if (loading || checking) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  // If user is authenticated but wallet is not connected, show a message
  if (user && !connected) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center flex-col">
      <div className="text-white text-xl mb-4">Please connect your wallet to continue</div>
      <div className="mt-4">
        <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
      </div>
    </div>;
  }

  return user ? children : null;
};

export default AuthProvider;
