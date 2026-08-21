import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';

const TokenBalances = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTokenAccounts = async () => {
      if (!publicKey) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { programId: TOKEN_2022_PROGRAM_ID }
        );
        
        const tokensData = response.value.map(accountInfo => {
          const parsedAccountInfo = accountInfo.account.data.parsed.info;
          const mintAddress = parsedAccountInfo.mint;
          const tokenBalance = parsedAccountInfo.tokenAmount.uiAmount;
          const tokenDecimals = parsedAccountInfo.tokenAmount.decimals;
          
          return {
            mintAddress,
            balance: tokenBalance,
            decimals: tokenDecimals,
          };
        }).filter(token => token.balance > 0);
        
        setTokens(tokensData);
      } catch (error) {
        console.error('Error fetching token accounts:', error);
        setError('Failed to fetch tokens from your wallet');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTokenAccounts();
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

  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-4">Token Balances</h3>
      
      {tokens.length === 0 ? (
        <div className="py-4 text-center text-gray-400">
          <p>No tokens found in your wallet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tokens.map(token => (
            <div key={token.mintAddress} className="bg-gray-700/50 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <div className="font-mono text-sm text-gray-300 overflow-hidden text-ellipsis">
                  {token.mintAddress.substring(0, 6)}...{token.mintAddress.substring(token.mintAddress.length - 6)}
                </div>
                <div className="text-white font-semibold">{token.balance}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TokenBalances; 