import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { useNavigate } from 'react-router-dom';
import logoFull from '../assets/logo.svg';
import logoIcon from '../assets/logo.svg';

const Header = () => {
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBalanceAndTokens = async () => {
      if (connected && publicKey) {
        setLoading(true);
        try {
          // Connect to Solana
          const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

          // Fetch SOL balance
          const balance = await connection.getBalance(publicKey);
          setBalance(balance / 1000000000); // Convert lamports to SOL

          // For demonstration, we'll just simulate token fetching
          // In a real app, you would use @solana/spl-token or another library to fetch tokens
          setTimeout(() => {
            setTokens([
              { name: 'Sample Token 1', symbol: 'ST1', amount: 100 },
              { name: 'Sample Token 2', symbol: 'ST2', amount: 50 }
            ]);
            setLoading(false);
          }, 1000);
        } catch (error) {
          console.error('Error fetching wallet data:', error);
          setLoading(false);
        }
      }
    };

    fetchBalanceAndTokens();
  }, [connected, publicKey]);

  const handleLogout = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        navigate('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800 py-4 px-6 flex justify-between items-center">
      <div className="flex items-center">
        <div className="flex items-center mr-6">
          <img src={logoFull} alt="VidyutChain Logo" className="h-10 hidden md:block" />
          <img src={logoIcon} alt="VidyutChain Icon" className="h-10 md:hidden" />
        </div>
        {connected && (
          <div className="text-gray-400 flex items-center space-x-3">
            <span className="bg-gray-800 px-3 py-1 rounded-full text-sm">
              {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
            </span>
            {balance !== null && (
              <span className="bg-indigo-900/50 px-3 py-1 rounded-full text-sm">
                {balance.toFixed(2)} SOL
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {connected && (
          <>
            <div className="relative group">
              <button className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded text-sm flex items-center">
                <span>Tokens</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div className="absolute right-0 mt-2 bg-gray-800 rounded-md shadow-lg overflow-hidden z-20 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                {loading ? (
                  <div className="text-center py-3 px-4 text-gray-400 text-sm">
                    Loading tokens...
                  </div>
                ) : tokens.length > 0 ? (
                  <div>
                    {tokens.map((token, index) => (
                      <div key={index} className="py-2 px-4 hover:bg-gray-700 border-b border-gray-700 last:border-0">
                        <div className="text-white text-sm font-medium">{token.name}</div>
                        <div className="text-gray-400 text-xs">
                          {token.amount} {token.symbol}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3 px-4 text-gray-400 text-sm">
                    No tokens found
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => navigate('/profile')}
              className="bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm"
            >
              Profile
            </button>

            <button
              onClick={handleLogout}
              className="bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              Logout
            </button>
          </>
        )}

        <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
      </div>
    </header>
  );
};

export default Header;