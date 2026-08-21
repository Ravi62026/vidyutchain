import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../model/user.js';
import verifySignature from '../utils/verifySignature.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret_for_development';
// Admin wallet address - replace with your admin wallet address
const ADMIN_WALLET_ADDRESS = process.env.ADMIN_WALLET_ADDRESS || '68Hj862Xinvu4XEtoEPEsFjbuKguNmCVm1mGCevYgy67';

// Cookie options (cross-site compatible in production)
const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  secure: isProduction, // must be true for SameSite=None
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
};
if (process.env.COOKIE_DOMAIN) {
  cookieOptions.domain = process.env.COOKIE_DOMAIN;
}

// Active user sessions
// This helps prevent duplicate logins with same wallet address
const activeSessions = new Map(); // walletAddress -> { userId, timestamp }

const signup = async (req, res) => {
  try {
    const { email, password, walletAddress, signature, role } = req.body;

    // Validate all required fields
    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (!password) return res.status(400).json({ error: 'Password is required' });
    if (!walletAddress) return res.status(400).json({ error: 'Wallet address is required' });
    if (!signature) return res.status(400).json({ error: 'Wallet signature is required' });

    // If user is trying to register as admin, check if wallet matches admin wallet
    if (role === 'admin') {
      return res.status(403).json({
        error: 'Unauthorized registration',
        details: 'Admin accounts can only be created through the admin creation process'
      });
    }

    // Prevent registration with admin wallet address
    if (walletAddress.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()) {
      return res.status(403).json({
        error: 'Registration not allowed',
        details: 'This wallet address is reserved for administrative use only.'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) return res.status(400).json({ error: 'Email already registered' });

    // Check if wallet already exists
    const walletExists = await User.findOne({ walletAddress });
    if (walletExists) return res.status(400).json({ error: 'Wallet already registered' });

    // Create message that should have been signed
    const message = `Sign up to VidyutChain: ${email}`;

    // Verify wallet signature
    if (!verifySignature(message, signature, walletAddress)) {
      return res.status(400).json({
        error: 'Invalid wallet signature',
        details: 'The signature verification failed. Please try signing the message again.'
      });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with appropriate role
    const userData = {
      email,
      passwordHash,
      walletAddress,
      isAdmin: false
    };

    // If role is provided and it's valid, set it
    if (role && role !== 'admin') {
      userData.role = role;
    }

    const user = await User.create(userData);

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, walletAddress, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' } // 7 days to match cookie expiration
    );

    // Set JWT as HTTP-only cookie
    res.cookie('token', token, cookieOptions);

    // Track active session
    activeSessions.set(walletAddress, {
      userId: user._id.toString(),
      timestamp: Date.now()
    });

    // Send success response
    res.status(201).json({
      success: true,
      user: {
        email,
        walletAddress,
        role: user.role,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      error: 'Server error during signup',
      details: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, walletAddress, signature } = req.body;

    // Validate all required fields
    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (!password) return res.status(400).json({ error: 'Password is required' });
    if (!walletAddress) return res.status(400).json({ error: 'Wallet address is required' });
    if (!signature) return res.status(400).json({ error: 'Wallet signature is required' });

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Verify password
    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordCorrect) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Verify wallet ownership - ensure the wallet address matches the one registered with the account
    if (user.walletAddress !== walletAddress) {
      return res.status(400).json({
        error: 'Wallet address mismatch',
        details: 'This account is linked to a different wallet address. If you changed your wallet, please logout and register again.'
      });
    }

    // Check if wallet address is already in an active session for a different user
    const existingSession = activeSessions.get(walletAddress);
    if (existingSession && existingSession.userId !== user._id.toString()) {
      return res.status(403).json({
        error: 'Wallet address already in use',
        details: 'This wallet address is already logged in with a different account. Please use a different wallet or log out from the other session.'
      });
    }

    // Create message that should have been signed
    const message = `Log in to VidyutChain: ${email}`;

    // Verify wallet signature
    if (!verifySignature(message, signature, walletAddress)) {
      return res.status(400).json({
        error: 'Invalid wallet signature',
        details: 'The signature verification failed. Please try signing the message again.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, walletAddress, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' } // 7 days to match cookie expiration
    );

    // Set JWT as HTTP-only cookie
    res.cookie('token', token, cookieOptions);

    // Track active session
    activeSessions.set(walletAddress, {
      userId: user._id.toString(),
      timestamp: Date.now()
    });

    // Send success response
    res.status(200).json({
      success: true,
      user: {
        email,
        walletAddress,
        role: user.role,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Server error during login',
      details: error.message
    });
  }
};

// Logout user by clearing the cookie
const logout = (req, res) => {
  try {
    // Get token from cookies
    const token = req.cookies.token;

    // If token exists, try to remove from active sessions
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded && decoded.walletAddress) {
          activeSessions.delete(decoded.walletAddress);
        }
      } catch (err) {
        // Invalid token, just proceed with logout
      }
    }

    // Clear cookie with same options that were set
    res.clearCookie('token', cookieOptions);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error during logout' });
  }
};

// Verify if wallet address matches with the token
const verifyWalletMatch = async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Get token from cookies
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        walletChanged: false
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Find user in database
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          error: 'User not found',
          shouldLogout: true
        });
      }

      // Check if wallet address in token matches the current wallet
      // We're checking against the database wallet address, not the token wallet address
      const walletMatches = user.walletAddress === walletAddress;

      // Log the mismatch but don't force logout
      if (!walletMatches) {
        console.warn(`Wallet mismatch during verification: User ${user._id} has wallet ${user.walletAddress} but connected with ${walletAddress}`);
      }

      res.status(200).json({
        success: true,
        walletMatches,
        // Don't force logout even if wallets don't match
        shouldLogout: false
      });
    } catch (jwtError) {
      // If token is invalid, clear it and suggest logout
      res.clearCookie('token');
      return res.status(401).json({
        error: 'Invalid authentication token',
        shouldLogout: true
      });
    }
  } catch (error) {
    console.error('Wallet verification error:', error);
    res.status(500).json({
      error: 'Server error during wallet verification',
      details: error.message
    });
  }
};

// Create admin user
const createAdmin = async (req, res) => {
  try {
    // This endpoint should be secured with extra protection in production
    const { email, password, signature, adminSecret } = req.body;

    // Admin wallet address is automatically used
    const walletAddress = ADMIN_WALLET_ADDRESS;

    // Check admin secret - this should be a secure, environment-specific secret
    const correctAdminSecret = process.env.ADMIN_SECRET || 'admin_secret_for_development';

    if (adminSecret !== correctAdminSecret) {
      return res.status(403).json({ error: 'Invalid admin secret' });
    }

    // Validate required fields
    if (!email || !password || !signature) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if admin already exists
    const adminExists = await User.findOne({ isAdmin: true });
    if (adminExists) {
      return res.status(400).json({ error: 'Admin account already exists' });
    }

    // Create message that should have been signed
    const message = `Create admin for VidyutChain: ${email}`;

    // Verify the signature was made with admin wallet
    if (!verifySignature(message, signature, walletAddress)) {
      return res.status(400).json({
        error: 'Invalid admin wallet signature',
        details: 'The signature must be created with the designated admin wallet'
      });
    }

    // Hash password and create admin
    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await User.create({
      email,
      passwordHash,
      walletAddress,
      role: 'admin',
      isAdmin: true
    });

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      adminWalletAddress: walletAddress
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      error: 'Server error during admin creation',
      details: error.message
    });
  }
};

// Admin login function
const adminLogin = async (req, res) => {
  try {
    const { email, walletAddress, password, signature } = req.body;

    // Validate all required fields
    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (!walletAddress) return res.status(400).json({ error: 'Wallet address is required' });
    if (!password) return res.status(400).json({ error: 'Password is required' });
    if (!signature) return res.status(400).json({ error: 'Wallet signature is required' });

    // Verify this is the admin wallet
    if (walletAddress !== ADMIN_WALLET_ADDRESS) {
      return res.status(403).json({
        error: 'Unauthorized wallet',
        details: 'Only the admin wallet can access this endpoint'
      });
    }

    // Find admin user by email and wallet address
    const admin = await User.findOne({ email, walletAddress, isAdmin: true });
    if (!admin) {
      return res.status(404).json({
        error: 'Admin not found',
        details: 'No admin account exists with these credentials'
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, admin.passwordHash);
    if (!validPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        details: 'The password is incorrect'
      });
    }

    // Create message that should have been signed
    const message = `Admin login to VidyutChain: ${email}`;

    // Verify wallet signature
    if (!verifySignature(message, signature, walletAddress)) {
      return res.status(400).json({
        error: 'Invalid wallet signature',
        details: 'The signature verification failed. Please try signing the message again.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, walletAddress, email: admin.email, role: admin.role, isAdmin: admin.isAdmin },
      JWT_SECRET,
      { expiresIn: '7d' } // 7 days to match cookie expiration
    );

    // Set JWT as HTTP-only cookie
    res.cookie('token', token, cookieOptions);

    // Track active session
    activeSessions.set(walletAddress, {
      userId: admin._id.toString(),
      timestamp: Date.now()
    });

    // Send success response
    res.status(200).json({
      success: true,
      user: {
        email: admin.email,
        walletAddress,
        role: admin.role,
        isAdmin: admin.isAdmin
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      error: 'Server error during admin login',
      details: error.message
    });
  }
};

// Clean up expired sessions (utility function that can be called periodically)
const cleanExpiredSessions = () => {
  const now = Date.now();
  const expiryTime = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds (1 week)

  for (const [walletAddress, session] of activeSessions.entries()) {
    if (now - session.timestamp > expiryTime) {
      activeSessions.delete(walletAddress);
    }
  }
};

// Set up a timer to clean expired sessions every day
setInterval(cleanExpiredSessions, 24 * 60 * 60 * 1000); // Run once a day

export { signup, login, logout, verifyWalletMatch, createAdmin, adminLogin };
