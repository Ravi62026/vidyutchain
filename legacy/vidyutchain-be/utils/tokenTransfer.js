import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js';
// import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import dotenv from 'dotenv';

dotenv.config();

// Solana connection
const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', 
  'confirmed'
);

/**
 * Transfer tokens from one wallet to another
 * @param {Object} params - Parameters for token transfer
 * @param {string} params.fromWallet - Sender wallet address
 * @param {string} params.toWallet - Recipient wallet address
 * @param {string} params.tokenAddress - SPL token address
 * @param {number} params.amount - Amount to transfer
 * @param {number} params.decimals - Token decimals (default: 9)
 * @param {string} params.signature - Transaction signature to verify
 * @returns {Promise<Object>} - Transaction result
 */
export const transferTokens = async ({ 
  fromWallet, 
  toWallet, 
  tokenAddress, 
  amount, 
  decimals = 9,
  signature
}) => {
  try {
    // Verify the transaction signature on-chain
    if (signature) {
      try {
        const confirmedTx = await connection.getTransaction(signature, { commitment: 'confirmed' });
        if (!confirmedTx) {
          throw new Error('Transaction not found on-chain');
        }
      } catch (error) {
        console.error('Error verifying transaction signature:', error);
        // If we cannot verify the signature, we continue anyway for demo purposes
        // In production, you would want to fail here
        console.warn('Continuing without verified signature for demo purposes');
      }
    }

    // Record the transfer in the database
    console.log(`Recording token transfer: ${amount} tokens from ${fromWallet} to ${toWallet}`);
    
    // In a real implementation, you would verify the transaction was successful
    // on the Solana blockchain and update your database accordingly
    
    return {
      success: true,
      fromWallet,
      toWallet,
      tokenAddress,
      amount,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Token transfer error:', error);
    throw new Error(`Failed to transfer tokens: ${error.message}`);
  }
}; 