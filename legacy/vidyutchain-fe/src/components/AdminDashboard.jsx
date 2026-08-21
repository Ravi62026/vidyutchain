import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import TokenBalances from './TokenBalances';
import WalletActivity from './WalletActivity';

const AdminDashboard = () => {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();

  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check admin authentication status
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/check`, {
          method: 'GET',
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            // Not authenticated or not admin, redirect to login
            navigate('/admin/login');
            return;
          }
          throw new Error('Failed to verify admin status');
        }

        // Get admin profile data
        const profileResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/profile`, {
          method: 'GET',
          credentials: 'include'
        });

        if (!profileResponse.ok) {
          throw new Error('Failed to load admin data');
        }

        const data = await profileResponse.json();
        if (data.success) {
          setAdminData(data.user);
        } else {
          throw new Error(data.error || 'Failed to load admin data');
        }
      } catch (error) {
        console.error('Admin dashboard error:', error);
        setError(error.message || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    if (connected) {
      checkAdminAuth();
    } else {
      navigate('/admin/login');
    }
  }, [connected, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-72px)]">
          <div className="text-white">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-white mb-6">Admin Dashboard</h2>

        {error ? (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-400">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Admin Information</h3>
              {adminData && (
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400 text-sm">Email</p>
                    <p className="text-white">{adminData.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Role</p>
                    <p className="text-white capitalize">{adminData.role}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Wallet</p>
                    <p className="text-white font-mono text-sm truncate">
                      {adminData.walletAddress}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <TokenBalances />
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <WalletActivity />
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Admin Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 px-4 rounded text-sm">
                  Manage Users
                </button>
                <button className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 px-4 rounded text-sm">
                  System Settings
                </button>
                <button className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 px-4 rounded text-sm">
                  View Logs
                </button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">System Status</h3>
              <div className="py-4 text-center text-green-400">
                <p>All systems operational</p>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Server Load</span>
                  <span className="text-white">23%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '23%' }}></div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Database</span>
                  <span className="text-white">45%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
