import Bid from '../model/bid.js';
import Tender from '../model/tender.js';
import User from '../model/user.js';
import { validateSignature } from '../utils/walletUtils.js';

// Create a new bid
export const createBid = async (req, res) => {
  try {
    const { 
      tenderId, 
      amount, 
      description, 
      deliveryTimeline, 
      termsAndConditions,
      transactionSignature,
      message,
      walletAddress
    } = req.body;
    
    // Verify wallet signature
    const isValidSignature = await validateSignature(walletAddress, message, transactionSignature);
    if (!isValidSignature) {
      return res.status(401).json({ success: false, message: 'Invalid wallet signature' });
    }

    // Find user by wallet address or create a new one
    let user = await User.findOne({ walletAddress });
    
    if (!user) {
      // Create a new user with basic info if not found
      user = new User({
        walletAddress,
        email: `${walletAddress.substring(0, 8)}@example.com`, // Temporary email
        passwordHash: 'wallet-auth-user', // Default passwordHash for wallet-authenticated users
        role: 'bidder', // Set role to bidder for bid creation
        isAdmin: false
      });
      await user.save();
      console.log('Created new user for wallet:', walletAddress);
    }

    // Only bidders can create bids
    if (user.role !== 'bidder') {
      return res.status(403).json({ success: false, message: 'Only bidders can create bids' });
    }

    // Check if tender exists and is open
    const tender = await Tender.findById(tenderId);
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    if (tender.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Tender is not open for bidding' });
    }

    // Check if bidder already placed a bid for this tender
    const existingBid = await Bid.findOne({ tender: tenderId, bidder: user._id });
    if (existingBid) {
      return res.status(400).json({ success: false, message: 'You have already placed a bid for this tender' });
    }

    const bid = new Bid({
      tender: tenderId,
      bidder: user._id,
      amount,
      description,
      deliveryTimeline,
      termsAndConditions: termsAndConditions || '',
      transactionSignature
    });

    await bid.save();
    res.status(201).json({ success: true, data: bid });
  } catch (error) {
    console.error('Bid creation error:', error); 
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all bids for a tender
export const getBidsByTenderId = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if tender exists
    const tender = await Tender.findById(id);
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    // Only admin or creator can view all bids
    if (!req.user.isAdmin && req.user.role !== 'admin' && 
        tender.createdBy && tender.createdBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view all bids' });
    }

    const bids = await Bid.find({ tender: id })
      .populate('bidder', 'email walletAddress')
      .populate('tender', 'title basePrice');

    res.status(200).json({ success: true, data: bids });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get bids by bidder
export const getBidsByBidder = async (req, res) => {
  try {
    const bids = await Bid.find({ bidder: req.user.id })
      .populate('tender', 'title basePrice status')
      .populate('bidder', 'email walletAddress');

    res.status(200).json({ success: true, data: bids });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get a single bid
export const getBidById = async (req, res) => {
  try {
    console.log(`Fetching bid with ID: ${req.params.id}`);
    
    const bid = await Bid.findById(req.params.id)
      .populate('bidder', 'email walletAddress')
      .populate('tender', 'title basePrice status');

    if (!bid) {
      console.log(`Bid not found with ID: ${req.params.id}`);
      return res.status(404).json({ success: false, message: 'Bid not found' });
    }

    console.log(`Found bid: ${bid._id} for tender: ${bid.tender._id}`);

    // Only admin, creator of the tender, or the bidder can view the bid
    const tender = await Tender.findById(bid.tender._id || bid.tender);
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }
    
    console.log(`Checking authorization for user: ${req.user.id}`);
    
    // Extract the bidder ID properly, handling populated or non-populated cases
    const bidderId = bid.bidder._id ? bid.bidder._id.toString() : bid.bidder.toString();
    console.log(`Bidder ID: ${bidderId}`);
    
    // Extract tender creator
    const tenderCreatorId = tender.createdBy ? tender.createdBy.toString() : null;
    console.log(`Tender creator: ${tenderCreatorId}`);
    
    // Check if the user is the bidder
    const isUserBidder = req.user.id.toString() === bidderId;
    
    // Check if user is admin
    const isAdmin = req.user.isAdmin || req.user.role === 'admin';
    
    // Check if user is tender creator
    const isTenderCreator = tenderCreatorId && (tenderCreatorId === req.user.id.toString());
    
    console.log(`Is admin: ${isAdmin}, Is tender creator: ${isTenderCreator}, Is bidder: ${isUserBidder}`);

    if (!isAdmin && !isTenderCreator && !isUserBidder) {
      console.log(`Unauthorized access attempt by user: ${req.user.id}`);
      return res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to view this bid'
      });
    }

    console.log(`Successfully authorized access for user: ${req.user.id}`);
    res.status(200).json({ success: true, data: bid });
  } catch (error) {
    console.error('Error in getBidById:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update a bid
export const updateBid = async (req, res) => {
  try {
    const { 
      amount, 
      description, 
      deliveryTimeline, 
      termsAndConditions,
      transactionSignature,
      message
    } = req.body;
    
    // Verify wallet signature
    const isValidSignature = await validateSignature(req.user.walletAddress, message, transactionSignature);
    if (!isValidSignature) {
      return res.status(401).json({ success: false, message: 'Invalid wallet signature' });
    }

    const bid = await Bid.findById(req.params.id);
    if (!bid) {
      return res.status(404).json({ success: false, message: 'Bid not found' });
    }

    // Only the bidder can update their bid
    if (bid.bidder.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only update your own bids' });
    }

    // Check if tender is still open
    const tender = await Tender.findById(bid.tender);
    if (tender.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Cannot update bid as tender is no longer open' });
    }

    // Update fields
    bid.amount = amount || bid.amount;
    bid.description = description || bid.description;
    bid.deliveryTimeline = deliveryTimeline || bid.deliveryTimeline;
    bid.termsAndConditions = termsAndConditions || bid.termsAndConditions;
    bid.transactionSignature = transactionSignature;

    await bid.save();
    res.status(200).json({ success: true, data: bid });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete a bid
export const deleteBid = async (req, res) => {
  try {
    const { transactionSignature, message } = req.body;
    
    // Verify wallet signature
    const isValidSignature = await validateSignature(req.user.walletAddress, message, transactionSignature);
    if (!isValidSignature) {
      return res.status(401).json({ success: false, message: 'Invalid wallet signature' });
    }

    const bid = await Bid.findById(req.params.id);
    if (!bid) {
      return res.status(404).json({ success: false, message: 'Bid not found' });
    }

    // Only the bidder can delete their bid
    if (bid.bidder.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own bids' });
    }

    // Check if tender is still open
    const tender = await Tender.findById(bid.tender);
    if (tender.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Cannot delete bid as tender is no longer open' });
    }

    await Bid.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Bid deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Award a bid
export const awardBid = async (req, res) => {
  try {
    const { transactionSignature, message } = req.body;
    
    // Verify wallet signature
    const isValidSignature = await validateSignature(req.user.walletAddress, message, transactionSignature);
    if (!isValidSignature) {
      return res.status(401).json({ success: false, message: 'Invalid wallet signature' });
    }

    // Only admin can award bids
    if (!req.user.isAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can award bids' });
    }

    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    if (tender.status !== 'closed') {
      return res.status(400).json({ success: false, message: 'Tender must be closed before awarding a bid' });
    }

    // Get all bids for this tender
    const bids = await Bid.find({ tender: tender._id })
      .sort({ amount: -1 }) // Sort by amount in descending order
      .populate('bidder', 'email walletAddress');
    
    if (bids.length === 0) {
      return res.status(400).json({ success: false, message: 'No bids found for this tender' });
    }
    
    // Select the highest bid
    const highestBid = bids[0];
    console.log(`Awarding tender to highest bid: ${highestBid._id} with amount: ${highestBid.amount}`);

    // Update tender
    tender.status = 'awarded';
    tender.awardedTo = highestBid._id;
    tender.transactionSignature = transactionSignature;
    await tender.save();

    // Update highest bid
    highestBid.status = 'accepted';
    highestBid.transactionSignature = transactionSignature;
    await highestBid.save();

    // Update all other bids to rejected
    await Bid.updateMany(
      { 
        tender: tender._id, 
        _id: { $ne: highestBid._id } 
      },
      { 
        status: 'rejected',
      }
    );

    res.status(200).json({ 
      success: true, 
      data: { 
        tender, 
        awardedBid: highestBid,
        bidderEmail: highestBid.bidder.email,
        bidderWallet: highestBid.bidder.walletAddress,
        amount: highestBid.amount
      },
      message: 'Bid awarded successfully to highest bidder' 
    });
  } catch (error) {
    console.error('Error awarding bid:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get a user's bid for a specific tender
export const getUserBidForTender = async (req, res) => {
  try {
    const { userId, tenderId } = req.params;
    
    // Check if tender exists
    const tender = await Tender.findById(tenderId);
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    // Make sure req.user exists
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Verify authorization - users can only view their own bids unless admin
    // Convert both IDs to strings to ensure proper comparison
    const isRequestingOwnBid = req.user.id.toString() === userId.toString();
    const isAdmin = req.user.isAdmin || req.user.role === 'admin';
    const isTenderCreator = tender.createdBy && tender.createdBy.toString() === req.user.id.toString();
    
    if (!isRequestingOwnBid && !isAdmin && !isTenderCreator) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this bid' });
    }

    // Find the bid matching both user and tender
    const bid = await Bid.findOne({ 
      bidder: userId, 
      tender: tenderId 
    })
    .populate('bidder', 'email walletAddress')
    .populate('tender', 'title basePrice status');

    if (!bid) {
      return res.status(404).json({ success: false, message: 'No bid found for this user and tender' });
    }

    res.status(200).json({ success: true, data: bid });
  } catch (error) {
    console.error('Error fetching user bid:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all bids with pagination, filtering, and search
export const getAllBids = async (req, res) => {
  try {
    // Make sure req.user exists
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    // Check if user is admin
    if (!req.user.isAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can view all bids' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const search = req.query.search;
    
    // Build the query
    let query = {};
    
    // Add status filter if provided
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Add search filter if provided
    if (search) {
      // We need to join with the tender and bidder collections for search
      const tenders = await Tender.find({ 
        title: { $regex: search, $options: 'i' } 
      }).select('_id');
      
      const tenderIds = tenders.map(tender => tender._id);
      
      const users = await User.find({ 
        email: { $regex: search, $options: 'i' } 
      }).select('_id');
      
      const userIds = users.map(user => user._id);
      
      // Add OR conditions to the query
      query.$or = [
        { tender: { $in: tenderIds } },
        { bidder: { $in: userIds } }
      ];
    }

    // Get total count for pagination
    const total = await Bid.countDocuments(query);
    
    // Fetch bids with pagination
    const bids = await Bid.find(query)
      .populate('bidder', 'email walletAddress')
      .populate('tender', 'title basePrice status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({ 
      success: true, 
      data: bids, 
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching all bids:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Process payout for an accepted bid
export const processBidPayout = async (req, res) => {
  try {
    const { transactionSignature, message, paymentSignature, tokenMint } = req.body;
    
    // Verify wallet signature
    const isValidSignature = await validateSignature(req.user.walletAddress, message, transactionSignature);
    if (!isValidSignature) {
      return res.status(401).json({ success: false, message: 'Invalid wallet signature' });
    }

    const bid = await Bid.findById(req.params.id);
    if (!bid) {
      return res.status(404).json({ success: false, message: 'Bid not found' });
    }

    // Only the bidder can request payout for their own bid
    if (bid.bidder.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only request payout for your own bids' });
    }

    // Check if bid is accepted
    if (bid.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Only accepted bids are eligible for payout' });
    }

    // Update bid with payout information
    bid.isPaidOut = true;
    bid.payoutTransactionSignature = transactionSignature;
    bid.paymentTransactionSignature = paymentSignature || '';
    bid.paymentTokenMint = tokenMint || '';
    bid.payoutTimestamp = new Date();
    
    await bid.save();
    
    res.status(200).json({ 
      success: true, 
      data: bid, 
      message: 'Payout processed successfully' 
    });
  } catch (error) {
    console.error('Error processing payout:', error);
    res.status(400).json({ success: false, message: error.message });
  }
}; 