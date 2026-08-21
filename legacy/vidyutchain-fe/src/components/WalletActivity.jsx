import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

const WalletActivity = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!publicKey) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Get the recent transaction signatures
        const signatures = await connection.getSignaturesForAddress(
          publicKey,
          { limit: 10 }
        );
        
        if (signatures.length === 0) {
          setTransactions([]);
          setLoading(false);
          return;
        }
        
        // Fetch the actual transaction details
        const txDetails = await Promise.all(
          signatures.map(async (sig) => {
            try {
              const tx = await connection.getTransaction(sig.signature, {
                maxSupportedTransactionVersion: 0,
              });
              
              return {
                signature: sig.signature,
                time: sig.blockTime ? new Date(sig.blockTime * 1000) : new Date(),
                status: tx?.meta?.err ? 'Failed' : 'Confirmed',
                fee: tx?.meta?.fee ? tx.meta.fee / Math.pow(10, 9) : 0, // Convert lamports to SOL
              };
            } catch (err) {
              console.error(`Error fetching transaction ${sig.signature}:`, err);
              return null;
            }
          })
        );
        
        // Filter out failed fetches and set the transactions
        setTransactions(txDetails.filter(tx => tx !== null));
      } catch (error) {
        console.error('Error fetching wallet activity:', error);
        setError('Failed to fetch recent transactions');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, [publicKey, connection]);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  const formatTime = (date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-4">Wallet Activity</h3>
      
      {transactions.length === 0 ? (
        <div className="py-4 text-center text-gray-400">
          <p>No recent transactions found</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {transactions.map(tx => (
            <div key={tx.signature} className="bg-gray-700/50 rounded-lg p-3">
              <div className="flex justify-between items-center mb-1">
                <div className="font-mono text-sm text-gray-300 overflow-hidden text-ellipsis">
                  {tx.signature.substring(0, 6)}...{tx.signature.substring(tx.signature.length - 6)}
                </div>
                <div className={`text-xs px-2 py-1 rounded-full ${tx.status === 'Confirmed' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                  {tx.status}
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{formatTime(tx.time)}</span>
                <span>Fee: {tx.fee} SOL</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WalletActivity; 