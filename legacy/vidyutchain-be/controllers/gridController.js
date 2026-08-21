import Grid from '../model/grid.js';
import User from '../model/user.js';
import { validateSignature } from '../utils/walletUtils.js';

// Create a new grid
export const createGrid = async (req, res) => {
  try {
    const { name, location, capacity, description, specifications, status, transactionSignature, message, walletAddress } = req.body;
    
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
        role: 'admin', // Assuming the first user who creates a grid is an admin
        isAdmin: true
      });
      await user.save();
      console.log('Created new user for wallet:', walletAddress);
    }

    // Only admin can create grids
    if (!user.isAdmin && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can create grids' });
    }

    const grid = new Grid({
      name,
      location,
      capacity,
      description,
      specifications: specifications || {},
      status: status || 'active',
      owner: user._id, // User ID from wallet lookup
      transactionSignature
    });

    await grid.save();
    res.status(201).json({ success: true, data: grid });
  } catch (error) {
    console.error('Grid creation error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all grids
export const getAllGrids = async (req, res) => {
  try {
    const grids = await Grid.find().populate('owner', 'email walletAddress');
    res.status(200).json({ success: true, data: grids });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get a single grid
export const getGridById = async (req, res) => {
  try {
    const grid = await Grid.findById(req.params.id).populate('owner', 'email walletAddress');
    if (!grid) {
      return res.status(404).json({ success: false, message: 'Grid not found' });
    }
    res.status(200).json({ success: true, data: grid });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update a grid
export const updateGrid = async (req, res) => {
  try {
    const { name, location, capacity, description, specifications, status, transactionSignature, message } = req.body;
    
    // Verify wallet signature
    const isValidSignature = await validateSignature(req.user.walletAddress, message, transactionSignature);
    if (!isValidSignature) {
      return res.status(401).json({ success: false, message: 'Invalid wallet signature' });
    }

    // Only admin can update grids
    if (!req.user.isAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can update grids' });
    }

    const grid = await Grid.findById(req.params.id);
    if (!grid) {
      return res.status(404).json({ success: false, message: 'Grid not found' });
    }

    // Update fields
    grid.name = name || grid.name;
    grid.location = location || grid.location;
    grid.capacity = capacity || grid.capacity;
    grid.description = description || grid.description;
    grid.specifications = specifications || grid.specifications;
    grid.status = status || grid.status;
    grid.transactionSignature = transactionSignature;

    await grid.save();
    res.status(200).json({ success: true, data: grid });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete a grid
export const deleteGrid = async (req, res) => {
  try {
    const { transactionSignature, message } = req.body;
    
    // Verify wallet signature
    const isValidSignature = await validateSignature(req.user.walletAddress, message, transactionSignature);
    if (!isValidSignature) {
      return res.status(401).json({ success: false, message: 'Invalid wallet signature' });
    }

    // Only admin can delete grids
    if (!req.user.isAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can delete grids' });
    }

    const grid = await Grid.findById(req.params.id);
    if (!grid) {
      return res.status(404).json({ success: false, message: 'Grid not found' });
    }

    await Grid.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Grid deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
