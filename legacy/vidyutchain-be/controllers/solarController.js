import SolarProduct from '../model/solarProduct.js';
import SolarInstallation from '../model/solarInstallation.js';
import User from '../model/user.js';

// Product Controllers
export const getAllProducts = async (req, res) => {
  try {
    const products = await SolarProduct.find().populate('seller', 'email walletAddress');
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error('Error fetching solar products:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch solar products' });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await SolarProduct.findById(req.params.id).populate('seller', 'email walletAddress');
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error('Error fetching solar product:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch solar product' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, capacity, price, priceInSOL, panels, features, imageUrl } = req.body;
    
    // Check if user is a solar-seller
    if (req.user.role !== 'solar-seller' && !req.user.isAdmin) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized. Only solar sellers can create products' 
      });
    }
    
    const newProduct = await SolarProduct.create({
      name,
      description,
      capacity,
      price,
      priceInSOL,
      panels,
      features,
      imageUrl,
      seller: req.user.id
    });
    
    res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    console.error('Error creating solar product:', error);
    res.status(500).json({ success: false, error: 'Failed to create solar product' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, description, capacity, price, priceInSOL, panels, features, imageUrl } = req.body;
    
    // Find the product
    const product = await SolarProduct.findById(productId);
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    // Check if user is the seller or admin
    if (product.seller.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized. You can only update your own products' 
      });
    }
    
    // Update the product
    product.name = name || product.name;
    product.description = description || product.description;
    product.capacity = capacity || product.capacity;
    product.price = price || product.price;
    product.priceInSOL = priceInSOL || product.priceInSOL;
    product.panels = panels || product.panels;
    product.features = features || product.features;
    product.imageUrl = imageUrl || product.imageUrl;
    product.updatedAt = Date.now();
    
    await product.save();
    
    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error('Error updating solar product:', error);
    res.status(500).json({ success: false, error: 'Failed to update solar product' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Find the product
    const product = await SolarProduct.findById(productId);
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    // Check if user is the seller or admin
    if (product.seller.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized. You can only delete your own products' 
      });
    }
    
    // Check if there are any pending installations
    const pendingInstallations = await SolarInstallation.countDocuments({
      product: productId,
      status: { $in: ['pending', 'approved'] }
    });
    
    if (pendingInstallations > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete product with pending installations'
      });
    }
    
    // Delete the product
    await SolarProduct.findByIdAndDelete(productId);
    
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting solar product:', error);
    res.status(500).json({ success: false, error: 'Failed to delete solar product' });
  }
};

export const getSellerProducts = async (req, res) => {
  try {
    // If a seller ID is provided, use that, otherwise use the current user's ID
    const sellerId = req.params.sellerId || req.user.id;
    
    // Check if the seller exists and is a solar-seller
    const seller = await User.findById(sellerId);
    
    if (!seller || (seller.role !== 'solar-seller' && !seller.isAdmin)) {
      return res.status(404).json({
        success: false,
        error: 'Seller not found or not authorized to sell solar products'
      });
    }
    
    // Get all products for this seller
    const products = await SolarProduct.find({ seller: sellerId });
    
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error('Error fetching seller products:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch seller products' });
  }
};

// Installation Controllers
export const createInstallationRequest = async (req, res) => {
  try {
    const { productId, installationAddress, contactNumber } = req.body;
    
    // Validate input
    if (!productId || !installationAddress || !contactNumber) {
      return res.status(400).json({
        success: false,
        error: 'Product ID, installation address, and contact number are required'
      });
    }
    
    // Find the product and check if it exists
    const product = await SolarProduct.findById(productId);
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    // Create the installation request
    const installationRequest = await SolarInstallation.create({
      product: productId,
      customer: req.user.id,
      seller: product.seller,
      installationAddress,
      contactNumber,
      status: 'pending',
      paymentStatus: 'pending'
    });
    
    // Populate product and customer details for the response
    const populatedRequest = await SolarInstallation.findById(installationRequest._id)
      .populate('product')
      .populate('customer', 'email walletAddress')
      .populate('seller', 'email walletAddress');
    
    res.status(201).json({ success: true, installationRequest: populatedRequest });
  } catch (error) {
    console.error('Error creating installation request:', error);
    res.status(500).json({ success: false, error: 'Failed to create installation request' });
  }
};

export const getInstallationRequests = async (req, res) => {
  try {
    let query = {};
    
    // If user is a solar-seller, show only their installations
    if (req.user.role === 'solar-seller') {
      query.seller = req.user.id;
    } 
    // If user is a regular customer, show only their requests
    else if (req.user.role !== 'admin') {
      query.customer = req.user.id;
    }
    // Admin can see all installations
    
    const installations = await SolarInstallation.find(query)
      .populate('product')
      .populate('customer', 'email walletAddress')
      .populate('seller', 'email walletAddress')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, installations });
  } catch (error) {
    console.error('Error fetching installation requests:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch installation requests' });
  }
};

export const getInstallationById = async (req, res) => {
  try {
    const installationId = req.params.id;
    
    const installation = await SolarInstallation.findById(installationId)
      .populate('product')
      .populate('customer', 'email walletAddress')
      .populate('seller', 'email walletAddress');
    
    if (!installation) {
      return res.status(404).json({ success: false, error: 'Installation request not found' });
    }
    
    // Check if user has permission to view this installation
    const isCustomer = installation.customer._id.toString() === req.user.id;
    const isSeller = installation.seller._id.toString() === req.user.id;
    
    if (!isCustomer && !isSeller && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized. You can only view your own installation requests'
      });
    }
    
    res.status(200).json({ success: true, installation });
  } catch (error) {
    console.error('Error fetching installation request:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch installation request' });
  }
};

export const updateInstallationStatus = async (req, res) => {
  try {
    const installationId = req.params.id;
    const { status, notes, scheduledDate } = req.body;
    
    // Find the installation
    const installation = await SolarInstallation.findById(installationId);
    
    if (!installation) {
      return res.status(404).json({ success: false, error: 'Installation request not found' });
    }
    
    // Check if user is the seller or admin
    if (installation.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized. Only the seller or admin can update installation status'
      });
    }
    
    // Update the installation
    if (status) installation.status = status;
    if (notes) installation.notes = notes;
    if (scheduledDate) installation.scheduledDate = scheduledDate;
    installation.updatedAt = Date.now();
    
    await installation.save();
    
    // Return the updated installation with populated fields
    const updatedInstallation = await SolarInstallation.findById(installationId)
      .populate('product')
      .populate('customer', 'email walletAddress')
      .populate('seller', 'email walletAddress');
    
    res.status(200).json({ success: true, installation: updatedInstallation });
  } catch (error) {
    console.error('Error updating installation status:', error);
    res.status(500).json({ success: false, error: 'Failed to update installation status' });
  }
};

export const getSolarSellers = async (req, res) => {
  try {
    const sellers = await User.find({ role: 'solar-seller' })
      .select('email walletAddress');
    
    res.status(200).json({ success: true, sellers });
  } catch (error) {
    console.error('Error fetching solar sellers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch solar sellers' });
  }
}; 