import { PublicKey } from '@solana/web3.js';

// The admin wallet public key - this should be stored in an environment variable in production
const ADMIN_WALLET_ADDRESS = '68Hj862Xinvu4XEtoEPEsFjbuKguNmCVm1mGCevYgy67'; // Replace with actual admin wallet address

/**
 * Verifies if the connected wallet is the admin wallet
 * @param {string} walletAddress - The connected wallet's public key as a string
 * @returns {boolean} - True if the wallet is the admin wallet
 */
export const isAdminWallet = (walletAddress) => {
  if (!walletAddress) return false;
  
  try {
    // Convert the wallet address to a PublicKey object
    const walletPublicKey = new PublicKey(walletAddress).toString();
    
    // Compare with the admin wallet address
    return walletPublicKey === ADMIN_WALLET_ADDRESS;
  } catch (error) {
    console.error('Error verifying admin wallet:', error);
    return false;
  }
};

/**
 * Store the user's authentication state in local storage
 * @param {object} authState - The authentication state object
 * @param {string} authState.walletAddress - The wallet address
 * @param {boolean} authState.isAdmin - Whether the user is an admin
 * @param {string} authState.role - The user's role
 */
export const storeAuthState = (authState) => {
  localStorage.setItem('authState', JSON.stringify(authState));
};

/**
 * Get the user's authentication state from local storage
 * @returns {object|null} - The authentication state object or null if not authenticated
 */
export const getAuthState = () => {
  const authState = localStorage.getItem('authState');
  return authState ? JSON.parse(authState) : null;
};

/**
 * Clear the user's authentication state from local storage
 */
export const clearAuthState = () => {
  localStorage.removeItem('authState');
};

/**
 * Create an authentication state object
 * @param {string} walletAddress - The wallet address
 * @param {string} role - The user's role
 * @returns {object} - The authentication state object
 */
export const createAuthState = (walletAddress, role = null) => {
  const isAdmin = isAdminWallet(walletAddress);
  
  return {
    walletAddress,
    isAdmin,
    role,
    timestamp: Date.now()
  };
}; 