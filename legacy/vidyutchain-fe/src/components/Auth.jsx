import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useNavigate } from 'react-router-dom';
import RoleSelectionModal from './RoleSelectionModal';
import logoFull from '../assets/logo.svg';

const Auth = () => {
  const { publicKey, signMessage, connected } = useWallet();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('consumer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [details, setDetails] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [signatureStep, setSignatureStep] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const navigate = useNavigate();

  // Reset form when switching between login and signup
  useEffect(() => {
    setEmail('');
    setPassword('');
    setRole('consumer');
    setError('');
    setDetails('');
    setStatusMessage('');
    setSignatureStep(false);
    setRegistrationSuccess(false);
  }, [isLogin]);

  // Check if wallet is connected
  useEffect(() => {
    if (connected && publicKey) {
      setStatusMessage('Wallet connected. You can now login or sign up.');
    } else {
      setStatusMessage('Please connect your wallet to continue.');
      setSignatureStep(false);
    }
  }, [connected, publicKey]);

  // Handle role change from RoleSelectionModal
  const handleRoleChange = (newRole) => {
    setRole(newRole);
  };

  // Navigate to admin login
  const navigateToAdminLogin = () => {
    navigate('/admin/login');
  };

  // Step 1: Validate form inputs before requesting signature
  const validateAndPrepareSignature = (e) => {
    e.preventDefault();

    // Reset error states
    setError('');
    setDetails('');

    // Check for wallet connection
    if (!connected || !publicKey) {
      setError('Wallet Connection Required');
      setDetails('Please connect your wallet using the button above.');
      return;
    }

    // Check for required fields
    if (!email) {
      setError('Email Required');
      setDetails('Please enter your email address.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid Email Format');
      setDetails('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Password Required');
      setDetails('Please enter your password.');
      return;
    }

    // If all validations pass, move to signature step
    setSignatureStep(true);
    setStatusMessage(isLogin
      ? 'Click "Sign In" to complete authentication with your wallet'
      : 'Click "Sign Up" to create your account with your wallet');
  };

  // Step 2: Request wallet signature and complete authentication
  const handleWalletSignature = async () => {
    setLoading(true);
    setError('');
    setDetails('');

    try {
      // Create message to sign
      const messageContent = isLogin
        ? `Log in to VidyutChain: ${email}`
        : `Sign up to VidyutChain: ${email}`;

      setStatusMessage('Please approve the signature request in your wallet...');

      // Request signature from wallet
      const encodedMessage = new TextEncoder().encode(messageContent);

      // Check if signMessage is available
      if (!signMessage) {
        throw new Error('Wallet does not support message signing');
      }

      const signature = await signMessage(encodedMessage);
      const signatureString = Buffer.from(signature).toString('base64');

      // Prepare request
      const endpoint = isLogin ? '/api/login' : '/api/signup';

      setStatusMessage(isLogin ? 'Logging in...' : 'Creating your account...');

      // Send to backend
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          role,
          walletAddress: publicKey.toString(),
          signature: signatureString
        }),
        credentials: 'include', // Important for cookies
        mode: 'cors' // Explicitly set CORS mode
      });

      const data = await response.json();

      if (data.success) {
        if (isLogin) {
          // Login successful - redirect to home page
          setStatusMessage('Login successful!');
          setTimeout(() => navigate('/home'), 1000);
        } else {
          // Registration successful - show success message and switch to login
          setStatusMessage('Account created successfully! Please login now.');
          setRegistrationSuccess(true);
          setTimeout(() => {
            setSignatureStep(false);
            setIsLogin(true);
            setEmail('');
            setPassword('');
          }, 2000);
        }
      } else {
        setError(data.error || 'Authentication failed');
        setDetails(data.details || '');
        setSignatureStep(false);
      }
    } catch (error) {
      console.error('Auth error:', error);
      if (error.message.includes('User rejected the request')) {
        setError('Signature Declined');
        setDetails('You declined to sign the message. Please try again.');
      } else {
        setError(error.message || 'Failed to authenticate');
      }
      setSignatureStep(false);
    } finally {
      setLoading(false);
    }
  };

  // If we're in signature step and user clicks back button
  const handleBackToForm = () => {
    setSignatureStep(false);
    setStatusMessage('Wallet connected. You can now login or sign up.');
  };

  // Helper function to display role name
  const getRoleName = (roleId) => {
    switch(roleId) {
      case 'producer': return 'Producer';
      case 'consumer': return 'Consumer';
      case 'bidder': return 'Bidder';
      case 'industry': return 'Industry/Company';
      case 'solar-seller': return 'Solar Seller';
      default: return roleId.charAt(0).toUpperCase() + roleId.slice(1);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-8 space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoFull} alt="VidyutChain Logo" className="h-16" />
          </div>
          <p className="text-gray-400 mt-2">
            {connected
              ? `Connected: ${publicKey.toString().slice(0, 6)}...${publicKey.toString().slice(-4)}`
              : 'Connect your wallet to continue'}
          </p>
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

        {/* Registration Success Message */}
        {registrationSuccess && (
          <div className="text-center text-green-400 text-sm py-2 px-3 bg-green-900/30 rounded animate-pulse">
            Registration successful! You can now login with your credentials.
          </div>
        )}

        {/* Auth Form - Only show if wallet is connected */}
        {connected && (
          <div className="space-y-4">
            {!signatureStep ? (
              /* Step 1: Collect credentials */
              <form onSubmit={validateAndPrepareSignature} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">
                    Password
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

                {/* Role Selection - Only show during signup with button to open modal */}
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Your Role
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm">
                        {getRoleName(role)}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsRoleModalOpen(true)}
                        className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded-md text-sm transition-colors"
                      >
                        Select Role
                      </button>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="bg-red-900/30 border border-red-800 rounded p-3">
                    <h4 className="text-red-400 text-sm font-medium">{error}</h4>
                    {details && <p className="text-red-300 text-xs mt-1">{details}</p>}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                >
                  {isLogin ? 'Continue to Login' : 'Continue to Sign Up'}
                </button>
              </form>
            ) : (
              /* Step 2: Wallet Signature */
              <div className="space-y-4">
                <div className="bg-gray-700 p-4 rounded text-sm">
                  <p className="text-gray-300">
                    {isLogin
                      ? 'To complete login, you need to sign a message with your wallet to verify ownership.'
                      : 'To create your account, you need to sign a message with your wallet to verify ownership.'}
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
                    ) : isLogin ? 'Sign In with Wallet' : 'Sign Up with Wallet'}
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

            {/* Toggle Login/Signup */}
            <div className="text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                disabled={loading || signatureStep}
                className="text-purple-400 hover:text-purple-300 text-sm"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Log in"}
              </button>
            </div>

            {/* Admin Login Option */}
            <div className="pt-4 mt-4 border-t border-gray-700">
              <button
                onClick={navigateToAdminLogin}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition-colors text-sm"
              >
                Admin Login
              </button>
              <p className="text-gray-500 text-xs mt-2 text-center">
                For administrators with the designated admin wallet only
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Role Selection Modal */}
      <RoleSelectionModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        value={role}
        onRoleSelect={handleRoleChange}
      />
    </div>
  );
};

export default Auth;