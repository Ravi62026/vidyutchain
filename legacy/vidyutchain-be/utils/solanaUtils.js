import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

// Configure Solana connection - use mainnet-beta, devnet or testnet as needed
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// Get wallet balance (in lamports)
export const getWalletBalance = async (walletAddress) => {
  try {
    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);
    return { 
      lamports: balance,
      sol: balance / 1000000000 // Convert lamports to SOL (1 SOL = 10^9 lamports)
    };
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    throw new Error('Failed to fetch wallet balance');
  }
};

export default {
  getWalletBalance
}; 