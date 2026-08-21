import Tender from '../model/tender.js';
import Grid from '../model/grid.js';
import User from '../model/user.js';
import { validateSignature } from '../utils/walletUtils.js';

// Create a new tender
export const createTender = async (req, res) => {
  try {
    const { 
      title, 
      gridId, 
      description, 
      startDate, 
      endDate, 
      basePrice, 
      requirements,
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
        role: 'admin', // Assuming the first user who creates a tender is an admin
        isAdmin: true
      });
      await user.save();
      console.log('Created new user for wallet:', walletAddress);
    }

    // Only admin can create tenders
    if (!user.isAdmin && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can create tenders' });
    }

    // Check if grid exists
    const grid = await Grid.findById(gridId);
    if (!grid) {
      return res.status(404).json({ success: false, message: 'Grid not found' });
    }

    const tender = new Tender({
      title,
      grid: gridId,
      description,
      startDate,
      endDate,
      basePrice,
      requirements,
      status: 'open',
      createdBy: user._id,
      transactionSignature
    });

    await tender.save();
    res.status(201).json({ success: true, data: tender });
  } catch (error) {
    console.error('Tender creation error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all tenders
export const getAllTenders = async (req, res) => {
  try {
    const tenders = await Tender.find()
      .populate('grid', 'name location capacity')
      .populate('createdBy', 'email walletAddress')
      .populate({
        path: 'awardedTo',
        populate: {
          path: 'bidder',
          select: 'email walletAddress'
        }
      });
    
    res.status(200).json({ success: true, data: tenders });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get a single tender
export const getTenderById = async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id)
      .populate('grid', 'name location capacity')
      .populate('createdBy', 'email walletAddress')
      .populate({
        path: 'awardedTo',
        populate: {
          path: 'bidder',
          select: 'email walletAddress'
        }
      });

    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    res.status(200).json({ success: true, data: tender });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update a tender
export const updateTender = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      startDate, 
      endDate, 
      basePrice, 
      requirements,
      status,
      transactionSignature,
      message
    } = req.body;
    
    // Verify wallet signature
    const isValidSignature = await validateSignature(req.user.walletAddress, message, transactionSignature);
    if (!isValidSignature) {
      return res.status(401).json({ success: false, message: 'Invalid wallet signature' });
    }

    // Only admin can update tenders
    if (!req.user.isAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can update tenders' });
    }

    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    // Update fields
    tender.title = title || tender.title;
    tender.description = description || tender.description;
    tender.startDate = startDate || tender.startDate;
    tender.endDate = endDate || tender.endDate;
    tender.basePrice = basePrice || tender.basePrice;
    tender.requirements = requirements || tender.requirements;
    tender.status = status || tender.status;
    tender.transactionSignature = transactionSignature;

    await tender.save();
    res.status(200).json({ success: true, data: tender });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete a tender
export const deleteTender = async (req, res) => {
  try {
    const { transactionSignature, message } = req.body;
    
    // Verify wallet signature
    const isValidSignature = await validateSignature(req.user.walletAddress, message, transactionSignature);
    if (!isValidSignature) {
      return res.status(401).json({ success: false, message: 'Invalid wallet signature' });
    }

    // Only admin can delete tenders
    if (!req.user.isAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can delete tenders' });
    }

    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    await Tender.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Tender deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Open a tender for bidding
export const openTender = async (req, res) => {
  try {
    const { transactionSignature, message } = req.body;
    
    // Verify wallet signature
    const isValidSignature = await validateSignature(req.user.walletAddress, message, transactionSignature);
    if (!isValidSignature) {
      return res.status(401).json({ success: false, message: 'Invalid wallet signature' });
    }

    // Only admin can open tenders
    if (!req.user.isAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can open tenders' });
    }

    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    if (tender.status !== 'draft') {
      return res.status(400).json({ success: false, message: `Tender cannot be opened. Current status: ${tender.status}` });
    }

    tender.status = 'open';
    tender.transactionSignature = transactionSignature;
    await tender.save();

    res.status(200).json({ success: true, data: tender, message: 'Tender opened for bidding' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Close a tender
export const closeTender = async (req, res) => {
  try {
    const { transactionSignature, message } = req.body;
    
    // Verify wallet signature
    const isValidSignature = await validateSignature(req.user.walletAddress, message, transactionSignature);
    if (!isValidSignature) {
      return res.status(401).json({ success: false, message: 'Invalid wallet signature' });
    }

    // Only admin can close tenders
    if (!req.user.isAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can close tenders' });
    }

    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    if (tender.status !== 'open') {
      return res.status(400).json({ success: false, message: `Tender cannot be closed. Current status: ${tender.status}` });
    }

    tender.status = 'closed';
    tender.transactionSignature = transactionSignature;
    await tender.save();

    res.status(200).json({ success: true, data: tender, message: 'Tender closed' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}; 