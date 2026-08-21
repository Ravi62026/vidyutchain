import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useNavigate } from 'react-router-dom';
import logoFull from '../assets/logo.svg';

// Admin authentication component specifically for admin login
const AdminAuth = () => {
  const { publicKey, signMessage, connected } = useWallet();
  const [isCreateAdmin, setIsCreateAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [details, setDetails] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [signatureStep, setSignatureStep] = useState(false);
  const navigate = useNavigate();

  // Admin wallet address from environment (would be set in the backend)
  const ADMIN_WALLET_ADDRESS = process.env.REACT_APP_ADMIN_WALLET_ADDRESS || "68Hj862Xinvu4XEtoEPEsFjbuKguNmCVm1mGCevYgy67";

  // Default admin secret key - matches the backend default
  const DEFAULT_ADMIN_SECRET = "admin_secret_for_development";

  // Check if wallet is connected
  useEffect(() => {
    if (connected && publicKey) {
      // Check if connected wallet is the admin wallet
      if (publicKey.toString() === ADMIN_WALLET_ADDRESS) {
        setStatusMessage(isCreateAdmin
          ? 'Admin wallet connected. You can now create an admin account.'
          : 'Admin wallet connected. You can now proceed with login.');
      } else {
        setStatusMessage('This is not the admin wallet. Please connect the designated admin wallet.');
        setError('Unauthorized Wallet');
        setDetails('The connected wallet is not authorized for admin access.');
      }
    } else {
      setStatusMessage('Please connect your admin wallet to continue.');
      setSignatureStep(false);
    }
  }, [connected, publicKey, isCreateAdmin]);

  // Step 1: Validate admin wallet before requesting signature
  const validateAndPrepareSignature = (e) => {
    e.preventDefault();

    // Reset error states
    setError('');
    setDetails('');

    // Check for wallet connection
    if (!connected || !publicKey) {
      setError('Wallet Connection Required');
      setDetails('Please connect your admin wallet using the button above.');
      return;
    }

    // Verify this is the admin wallet
    if (publicKey.toString() !== ADMIN_WALLET_ADDRESS) {
      setError('Unauthorized Wallet');
      setDetails('This wallet is not authorized for admin access. Please connect the designated admin wallet.');
      return;
    }

    // Email validation for both login and create admin
    if (!email) {
      setError('Email Required');
      setDetails('Please enter an email address.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid Email Format');
      setDetails('Please enter a valid email address.');
      return;
    }

    // Check for password
    if (!password) {
      setError('Password Required');
      setDetails('Please enter the admin password.');
      return;
    }

    // If all validations pass, move to signature step
    setSignatureStep(true);
    setStatusMessage(isCreateAdmin
      ? 'Click "Create Admin Account" to complete setup with your wallet'
      : 'Click "Admin Sign In" to complete authentication with your wallet');
  };

  // Step 2: Request wallet signature and complete admin authentication
  const handleWalletSignature = async () => {
    setLoading(true);
    setError('');
    setDetails('');

    try {
      // Create message to sign based on mode
      const messageContent = isCreateAdmin
        ? `Create admin for VidyutChain: ${email}`
        : `Admin login to VidyutChain: ${email}`;

      setStatusMessage('Please approve the signature request in your wallet...');

      // Request signature from wallet
      const encodedMessage = new TextEncoder().encode(messageContent);

      // Check if signMessage is available
      if (!signMessage) {
        throw new Error('Wallet does not support message signing');
      }

      const signature = await signMessage(encodedMessage);
      const signatureString = Buffer.from(signature).toString('base64');

      setStatusMessage(isCreateAdmin ? 'Creating admin account...' : 'Verifying admin credentials...');

      // Prepare request based on mode
      const endpoint = isCreateAdmin ? '/api/create-admin' : '/api/admin/login';
      const requestBody = isCreateAdmin
        ? {
            email,
            password,
            adminSecret: DEFAULT_ADMIN_SECRET, // Use the default admin secret
            signature: signatureString
          }
        : {
            email,
            walletAddress: publicKey.toString(),
            password,
            signature: signatureString
          };

      // Send to backend
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        credentials: 'include' // Important for cookies
      });

      const data = await response.json();

      if (data.success) {
        if (isCreateAdmin) {
          // Admin creation successful - switch to login mode
          setStatusMessage('Admin account created successfully!');
          setTimeout(() => {
            setIsCreateAdmin(false);
            setSignatureStep(false);
            setPassword('');
          }, 2000);
        } else {
          // Login successful - redirect to home page
          setStatusMessage('Admin login successful!');
          setTimeout(() => navigate('/home'), 1000);
        }
      } else {
        setError(data.error || 'Operation failed');
        setDetails(data.details || 'Please check your inputs and try again.');
        setSignatureStep(false);
      }
    } catch (error) {
      console.error('Admin auth error:', error);
      if (error.message.includes('User rejected the request')) {
        setError('Signature Declined');
        setDetails('You declined to sign the message. Please try again.');
      } else {
        setError(error.message || 'Operation failed');
      }
      setSignatureStep(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle back button
  const handleBackToForm = () => {
    setSignatureStep(false);
    if (publicKey && publicKey.toString() === ADMIN_WALLET_ADDRESS) {
      setStatusMessage(isCreateAdmin
        ? 'Admin wallet connected. You can now create an admin account.'
        : 'Admin wallet connected. You can now proceed with login.');
    } else {
      setStatusMessage('Please connect your admin wallet to continue.');
    }
  };

  // Toggle between login and create admin modes
  const toggleCreateAdminMode = () => {
    setIsCreateAdmin(!isCreateAdmin);
    setError('');
    setDetails('');
    setPassword('');
    setEmail('');
    setSignatureStep(false);

    if (publicKey && publicKey.toString() === ADMIN_WALLET_ADDRESS) {
      setStatusMessage(!isCreateAdmin
        ? 'Admin wallet connected. You can now create an admin account.'
        : 'Admin wallet connected. You can now proceed with login.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-8 space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoFull} alt="VidyutChain Logo" className="h-16" />
          </div>
          <p className="text-purple-400 mt-2 font-medium">Admin Access Only</p>
          {connected && (
            <p className="text-gray-400 mt-2">
              {`Connected: ${publicKey.toString().slice(0, 6)}...${publicKey.toString().slice(-4)}`}
            </p>
          )}
        </div>

        {/* Wallet Connection Button */}
        <div className="flex justify-center">
          <WalletMultiButton className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors" />
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`text-center text-sm py-2 px-3 rounded ${
            statusMessage.includes('successful')
              ? 'text-green-400 bg-green-900/30'
              : 'text-blue-400 bg-blue-900/30'
          }`}>
            {statusMessage}
          </div>
        )}

        {/* Auth Form - Only show if wallet is connected */}
        {connected && (
          <div className="space-y-4">
            {!signatureStep ? (
              /* Step 1: Collect admin credentials */
              <form onSubmit={validateAndPrepareSignature} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
                    Admin Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="admin@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">
                    {isCreateAdmin ? 'Create Password' : 'Admin Password'}
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="••••••••"
                  />
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-900/30 border border-red-800 rounded p-3">
                    <h4 className="text-red-400 text-sm font-medium">{error}</h4>
                    {details && <p className="text-red-300 text-xs mt-1">{details}</p>}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (publicKey && publicKey.toString() !== ADMIN_WALLET_ADDRESS)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                >
                  {isCreateAdmin ? 'Continue to Create Admin' : 'Continue to Admin Login'}
                </button>
              </form>
            ) : (
              /* Step 2: Wallet Signature */
              <div className="space-y-4">
                <div className="bg-gray-700 p-4 rounded text-sm">
                  <p className="text-gray-300">
                    {isCreateAdmin
                      ? 'To create an admin account, you need to sign a message with your wallet to verify ownership.'
                      : 'To complete admin login, you need to sign a message with your wallet to verify ownership.'}
                  </p>
                </div>

                <div className="flex flex-col space-y-3">
                  <button
                    onClick={handleWalletSignature}
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 flex justify-center"
                  >
                    {loading ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : isCreateAdmin ? 'Create Admin Account with Wallet' : 'Admin Sign In with Wallet'}
                  </button>

                  <button
                    onClick={handleBackToForm}
                    disabled={loading}
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    Back to form
                  </button>
                </div>
              </div>
            )}

            {/* Toggle between Login and Create Admin */}
            <div className="text-center">
              <button
                onClick={toggleCreateAdminMode}
                disabled={loading || signatureStep}
                className="text-purple-400 hover:text-purple-300 text-sm"
              >
                {isCreateAdmin
                  ? "Already have an admin account? Log in"
                  : "Need to create an admin account? Sign up"}
              </button>
            </div>

            {/* Back to Regular Login Link */}
            <div className="pt-4 mt-4 border-t border-gray-700">
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition-colors text-sm"
              >
                Back to Regular Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuth;