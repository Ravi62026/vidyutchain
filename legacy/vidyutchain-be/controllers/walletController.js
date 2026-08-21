import { getWalletBalance } from '../utils/solanaUtils.js';

// Get wallet balance for the authenticated user
export const getBalance = async (req, res) => {
  try {
    // Get wallet address from the authenticated user
    const { walletAddress } = req.user;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'No wallet address associated with this account' });
    }
    
    const balance = await getWalletBalance(walletAddress);
    
    return res.status(200).json({ 
      success: true,
      walletAddress,
      balance
    });
  } catch (error) {
    console.error('Wallet balance error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch wallet balance' 
    });
  }
};

export default {
  getBalance
}; 