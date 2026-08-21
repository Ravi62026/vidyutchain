import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import bs58 from 'bs58';

// Configure ed25519 to use the proper SHA-512 implementation
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

/**
 * Validates a signature from a Solana wallet
 * @param {string} walletAddress - The Solana wallet address
 * @param {string} message - The original message that was signed
 * @param {string} signature - The signature in base58 format
 * @returns {Promise<boolean>} - Whether the signature is valid
 */
export const validateSignature = async (walletAddress, message, signature) => {
  try {
    if (!walletAddress || !message || !signature) {
      console.log('Missing required parameters:', { walletAddress: !!walletAddress, message: !!message, signature: !!signature });
      return false;
    }

    console.log('Validating signature:');
    console.log('- Wallet:', walletAddress);
    console.log('- Message:', message);
    console.log('- Signature:', signature);

    // Convert wallet address from base58 to Uint8Array
    const publicKeyBytes = bs58.decode(walletAddress);
    
    // Convert signature from base58 to Uint8Array
    const signatureBytes = bs58.decode(signature);
    
    // Convert message to Uint8Array
    const messageBytes = new TextEncoder().encode(message);
    
    // Verify the signature using ed25519
    const isValid = await ed.verify(signatureBytes, messageBytes, publicKeyBytes);
    
    console.log('Signature validation result:', isValid);
    return isValid;
  } catch (error) {
    console.error('Error validating signature:', error);
    return false;
  }
};

/**
 * Creates a message to sign for different operations
 * @param {string} operation - The operation being performed (create, update, delete)
 * @param {string} entityType - The type of entity (grid, tender, bid)
 * @param {string} entityId - The ID of the entity (optional, for update/delete)
 * @returns {string} - The message to be signed
 */
export const createSignatureMessage = (operation, entityType, entityId = '') => {
  const timestamp = new Date().toISOString();
  return `${operation.toUpperCase()} ${entityType.toUpperCase()} ${entityId} at ${timestamp}`;
}; 