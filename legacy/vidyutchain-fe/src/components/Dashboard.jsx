import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import TokenBalances from './TokenBalances';
import WalletActivity from './WalletActivity';

const Dashboard = () => {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/profile`, {
          method: 'GET',
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 401) {
            navigate('/');
            return;
          }
          throw new Error('Failed to load user data');
        }

        const data = await response.json();
        if (data.success) {
          setUserData(data.user);
        } else {
          throw new Error(data.error || 'Failed to load user data');
        }
      } catch (error) {
        console.error('Dashboard error:', error);
        setError(error.message || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  // Check if user is connected and authenticated
  useEffect(() => {
    if (!connected) {
      navigate('/');
    }
  }, [connected, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-72px)]">
          <div className="text-white">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>

        {error ? (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-400">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Account Information</h3>
              {userData && (
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400 text-sm">Email</p>
                    <p className="text-white">{userData.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Role</p>
                    <p className="text-white capitalize">{userData.role}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Wallet</p>
                    <p className="text-white font-mono text-sm truncate">
                      {userData.walletAddress}
                    </p>
                  </div>
                </div>
              )}
              <div className="mt-6 space-y-2">
                <button
                  onClick={() => navigate('/profile')}
                  className="bg-purple-600 hover:bg-purple-500 text-white py-2 px-4 rounded text-sm w-full"
                >
                  Edit Profile
                </button>
                
                {userData && userData.role === 'solar-seller' && (
                  <button
                    onClick={() => navigate('/solar-seller/dashboard')}
                    className="bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded text-sm w-full"
                  >
                    Solar Seller Dashboard
                  </button>
                )}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <TokenBalances />
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <WalletActivity />
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Notifications</h3>
              {userData && userData.role === 'solar-seller' ? (
                <div className="space-y-4">
                  <div className="bg-gray-700/50 rounded p-3 border-l-4 border-purple-500">
                    <p className="text-white text-sm">
                      Welcome to your Solar Seller dashboard! Start by adding your solar products.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/solar-seller/dashboard')}
                    className="bg-purple-600 hover:bg-purple-500 text-white py-2 px-4 rounded text-sm w-full"
                  >
                    Manage Your Products
                  </button>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400">
                  <p>You have no new notifications</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;