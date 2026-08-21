/**
 * Sign a message using Phantom wallet
 * @param {string} message - Message to sign
 * @returns {Promise<{signature: string, publicKey: string}>} - Signature and public key
 */
export const signMessageWithPhantom = async (message) => {
  try {
    if (!window.solana || !window.solana.isPhantom) {
      throw new Error('Phantom wallet is not installed');
    }

    // Ensure wallet is connected
    await window.solana.connect();
    
    // Convert message to Uint8Array
    const encodedMessage = new TextEncoder().encode(message);
    
    // Request signature from wallet
    const signResult = await window.solana.signMessage(encodedMessage, 'utf8');
    
    return {
      signature: Array.from(signResult.signature).toString(),
      publicKey: signResult.publicKey.toString()
    };
  } catch (error) {
    console.error('Error signing message with Phantom:', error);
    throw error;
  }
};

/**
 * Create a standardized message for grid tendering operations
 * @param {string} operation - The operation (create, update, delete)
 * @param {string} entityType - The entity type (grid, tender, bid)
 * @param {string} entityId - Optional entity ID for updates or deletions
 * @returns {string} - Formatted message to sign
 */
export const createGridTenderingMessage = (operation, entityType, entityId = '') => {
  const timestamp = new Date().toISOString();
  return `${operation.toUpperCase()} ${entityType.toUpperCase()} ${entityId} at ${timestamp}`;
};

/**
 * Check if the Phantom wallet is installed and connected
 * @returns {Promise<boolean>} - Whether wallet is ready
 */
export const isPhantomWalletReady = async () => {
  if (!window.solana || !window.solana.isPhantom) {
    return false;
  }
  
  try {
    const resp = await window.solana.connect({ onlyIfTrusted: true });
    return !!resp.publicKey;
  } catch (err) {
    return false;
  }
}; 