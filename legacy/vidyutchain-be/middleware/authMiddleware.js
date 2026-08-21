import jwt from 'jsonwebtoken';
import User from '../model/user.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret_for_development';

export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from cookies instead of Authorization header
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Find user in database
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Additional check: ensure wallet address in database matches the one in token
    // But don't force logout, just log the mismatch
    if (user.walletAddress !== decoded.walletAddress) {
      console.warn(`Wallet address mismatch for user ${user._id}: ${user.walletAddress} (DB) vs ${decoded.walletAddress} (token)`);
    }

    // Attach user to request object
    req.user = {
      id: user._id,
      email: user.email,
      walletAddress: user.walletAddress,
      role: user.role,
      isAdmin: user.isAdmin
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    // Clear the invalid token
    res.clearCookie('token');
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to check if user is an admin
export const adminMiddleware = (req, res, next) => {
  // authMiddleware should run before this middleware
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.user.isAdmin || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

export default authMiddleware;
