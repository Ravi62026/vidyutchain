import verifySignature from './verifySignature.js';

const ADMIN_WALLET_ADDRESS = process.env.ADMIN_WALLET_ADDRESS || '68Hj862Xinvu4XEtoEPEsFjbuKguNmCVm1mGCevYgy67';

/**
 * Verifies that a transaction is signed with the admin wallet
 * @param {string} message - The message that was signed
 * @param {string} signature - The signature to verify
 * @returns {boolean} - Whether the signature is valid for the admin wallet
 */
export const verifyAdminSignature = (message, signature) => {
  if (!message || !signature) {
    return false;
  }
  
  return verifySignature(message, signature, ADMIN_WALLET_ADDRESS);
};

/**
 * Middleware to verify admin transaction signatures
 * This middleware should be used after the authMiddleware and adminMiddleware
 */
export const verifyAdminTransactionMiddleware = (req, res, next) => {
  try {
    const { signature, transactionMessage } = req.body;
    
    if (!signature || !transactionMessage) {
      return res.status(400).json({ 
        error: 'Admin signature required',
        details: 'Admin transactions must be signed by the admin wallet'
      });
    }
    
    // Verify the signature was created with the admin wallet
    if (!verifyAdminSignature(transactionMessage, signature)) {
      return res.status(403).json({
        error: 'Invalid admin signature',
        details: 'This transaction must be signed with the admin wallet'
      });
    }
    
    next();
  } catch (error) {
    console.error('Admin transaction verification error:', error);
    return res.status(500).json({ 
      error: 'Server error during admin transaction verification',
      details: error.message
    });
  }
};

export default {
  verifyAdminSignature,
  verifyAdminTransactionMiddleware,
  ADMIN_WALLET_ADDRESS
}; 