import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, TOKEN_2022_PROGRAM_ID, createAssociatedTokenAccountInstruction, createTransferInstruction } from '@solana/spl-token';
import axios from 'axios';
import bs58 from 'bs58';
import { Buffer } from 'buffer';
import Navbar from './Navbar';

// PayoutModal component for token selection and transfer
const PayoutModal = ({ show, onClose, bidAmount, bidId, onSuccess }) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [tokens, setTokens] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState('');
  const adminWalletAddress = '68Hj862Xinvu4XEtoEPEsFjbuKguNmCVm1mGCevYgy67';

  // Fetch user's token accounts when modal opens
  useEffect(() => {
    const fetchTokenAccounts = async () => {
      if (!publicKey || !show) return;
      
      try {
        setLoading(true);
        const response = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { programId: TOKEN_2022_PROGRAM_ID }
        );
        
        const tokensData = response.value.map(accountInfo => {
          const parsedAccountInfo = accountInfo.account.data.parsed.info;
          const mintAddress = parsedAccountInfo.mint;
          const tokenBalance = parsedAccountInfo.tokenAmount.uiAmount;
          const tokenDecimals = parsedAccountInfo.tokenAmount.decimals;
          
          return {
            mintAddress,
            balance: tokenBalance,
            decimals: tokenDecimals,
          };
        }).filter(token => token.balance > 0);
        
        setTokens(tokensData);
        if (tokensData.length > 0) {
          setSelectedToken(tokensData[0]);
        }
      } catch (error) {
        console.error('Error fetching token accounts:', error);
        setError('Failed to fetch tokens from your wallet');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTokenAccounts();
  }, [publicKey, connection, show]);

  const handleTokenSelect = (token) => {
    setSelectedToken(token);
  };

  const handleTransferTokens = async () => {
    if (!selectedToken) {
      setError('Please select a token first');
      return;
    }

    if (selectedToken.balance < bidAmount) {
      setError(`Insufficient balance. You need at least ${bidAmount} tokens.`);
      return;
    }

    setTransferring(true);
    setError('');
    
    try {
      // Convert inputs to appropriate types
      const mintPublicKey = new PublicKey(selectedToken.mintAddress);
      const recipientPublicKey = new PublicKey(adminWalletAddress);
      const amountToTransfer = parseInt(parseFloat(bidAmount) * Math.pow(10, selectedToken.decimals));
      
      // Get source token account (sender)
      const sourceTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      
      // Get or create destination token account (recipient)
      const destinationTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        recipientPublicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      
      const transaction = new Transaction();
      
      // Check if the destination token account exists
      const destinationAccountInfo = await connection.getAccountInfo(destinationTokenAccount);
      
      // If destination token account doesn't exist, create it
      if (!destinationAccountInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey, // payer
            destinationTokenAccount, // ata address
            recipientPublicKey, // owner
            mintPublicKey, // mint
            TOKEN_2022_PROGRAM_ID // program id
          )
        );
      }
      
      // Add the transfer instruction
      transaction.add(
        createTransferInstruction(
          sourceTokenAccount, // source
          destinationTokenAccount, // destination
          publicKey, // owner
          amountToTransfer, // amount
          [], // multisigners
          TOKEN_2022_PROGRAM_ID // program id
        )
      );
      
      // Send the transaction
      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      // After successful transfer, call the API to update the payout status
      await processBidPayout(bidId, signature);
      
      toast.success(`Transfer successful! Signature: ${signature.substring(0, 8)}...`);
      onSuccess(signature);
      onClose();
    } catch (error) {
      console.error('Error transferring tokens:', error);
      setError(`Transfer failed: ${error.message}`);
    } finally {
      setTransferring(false);
    }
  };

  const processBidPayout = async (bidId, signature) => {
    try {
      // Generate a message to sign
      const message = `Payout for bid: ${bidId} with transaction: ${signature}`;
      const encodedMessage = new TextEncoder().encode(message);
      
      // Sign the message with the wallet
      const messageSignature = await window.solana.signMessage(encodedMessage, 'utf8');
      const signatureBase58 = bs58.encode(messageSignature.signature);
      
      // Send payout request to the API
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/bids/${bidId}/payout`,
        {
          message,
          transactionSignature: signatureBase58,
          paymentSignature: signature,
          tokenMint: selectedToken.mintAddress
        },
        { withCredentials: true }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to process payout on server');
      }
    } catch (error) {
      console.error('Error processing payout on server:', error);
      throw error;
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Complete Payout</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-300 mb-2">Payout Amount: <span className="font-bold text-white">{bidAmount} tokens</span></p>
          <p className="text-gray-300 mb-2">Admin Wallet: <span className="text-white text-sm font-mono">{adminWalletAddress.substring(0, 8)}...{adminWalletAddress.substring(adminWalletAddress.length - 8)}</span></p>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : tokens.length === 0 ? (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 text-yellow-400 mb-4">
            <p>No tokens found in your wallet.</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h3 className="text-white font-semibold mb-2">Select Token</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {tokens.map((token) => (
                  <div 
                    key={token.mintAddress} 
                    className={`p-3 rounded-lg cursor-pointer border ${selectedToken?.mintAddress === token.mintAddress ? 'border-purple-500 bg-purple-900/30' : 'border-gray-700 bg-gray-700/50'}`}
                    onClick={() => handleTokenSelect(token)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-mono text-gray-300">{token.mintAddress.substring(0, 6)}...{token.mintAddress.substring(token.mintAddress.length - 6)}</div>
                      <div className="text-white font-semibold">{token.balance}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {error && (
              <div className="mb-4 bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-400">
                <p>{error}</p>
              </div>
            )}
            
            <div className="flex justify-between">
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleTransferTokens}
                className={`px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg ${transferring ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={transferring || !selectedToken}
              >
                {transferring ? 'Processing...' : 'Transfer Tokens'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// TokenBalances component to display user's token balances
const TokenBalances = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTokenAccounts = async () => {
      if (!publicKey) return;
      
      try {
        setLoading(true);
        const response = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { programId: TOKEN_2022_PROGRAM_ID }
        );
        
        const tokensData = response.value.map(accountInfo => {
          const parsedAccountInfo = accountInfo.account.data.parsed.info;
          const mintAddress = parsedAccountInfo.mint;
          const tokenBalance = parsedAccountInfo.tokenAmount.uiAmount;
          const tokenDecimals = parsedAccountInfo.tokenAmount.decimals;
          
          return {
            mintAddress,
            balance: tokenBalance,
            decimals: tokenDecimals,
          };
        }).filter(token => token.balance > 0);
        
        setTokens(tokensData);
      } catch (error) {
        console.error('Error fetching token accounts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTokenAccounts();
  }, [publicKey, connection]);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <p className="text-gray-400 text-center">No tokens found in your wallet</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-3">Your Token Balances</h3>
      <div className="divide-y divide-gray-700">
        {tokens.map(token => (
          <div key={token.mintAddress} className="py-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-mono text-sm">{token.mintAddress.substring(0, 6)}...{token.mintAddress.substring(token.mintAddress.length - 6)}</span>
              <span className="text-white font-medium">{token.balance}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Placeholder components for now - we'll gradually replace these with real ones
const TenderList = () => {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/tenders`, {
          withCredentials: true
        });
        
        if (response.data.success) {
          setTenders(response.data.data);
        } else {
          setError('Failed to load tenders');
        }
      } catch (error) {
        console.error('Error fetching tenders:', error);
        setError(error.response?.data?.message || 'Failed to load tenders');
      } finally {
        setLoading(false);
      }
    };

    fetchTenders();
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-900/50 text-gray-400';
      case 'open':
        return 'bg-green-900/50 text-green-400';
      case 'closed':
        return 'bg-yellow-900/50 text-yellow-400';
      case 'awarded':
        return 'bg-blue-900/50 text-blue-400';
      case 'cancelled':
        return 'bg-red-900/50 text-red-400';
      default:
        return 'bg-gray-900/50 text-gray-400';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
  return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  if (tenders.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Available Tenders</h2>
        <div className="border border-gray-700 bg-gray-800/50 p-6 rounded-lg text-center">
          <p className="text-gray-300">No tenders available at the moment.</p>
          <button 
            onClick={() => navigate('/grid-tendering/grids/register')}
            className="mt-4 bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
          >
            Register a Grid
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">Available Tenders</h2>
      <div className="space-y-4">
        {tenders.map(tender => (
          <div 
            key={tender._id} 
            className="border border-gray-700 bg-gray-800/50 p-4 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-all duration-200"
            onClick={() => navigate(`/grid-tendering/tenders/${tender._id}`)}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-white">{tender.title}</h3>
              <span className={`${getStatusBadgeClass(tender.status)} text-xs px-3 py-1 rounded-full flex items-center`}>
                <span className={`w-2 h-2 rounded-full mr-1 ${
                  tender.status === 'open' ? 'bg-green-400' : 
                  tender.status === 'closed' ? 'bg-yellow-400' :
                  tender.status === 'awarded' ? 'bg-blue-400' :
                  tender.status === 'cancelled' ? 'bg-red-400' :
                  'bg-gray-400'
                }`}></span>
                {tender.status.charAt(0).toUpperCase() + tender.status.slice(1)}
              </span>
          </div>
            <p className="text-gray-300 mt-2">{tender.description.substring(0, 100)}...</p>
            <div className="mt-3 text-sm text-gray-400">
              <div className="flex flex-wrap gap-4">
                <p><span className="font-medium text-gray-300">Grid:</span> {tender.grid?.name || 'Unknown'}</p>
                <p><span className="font-medium text-gray-300">Location:</span> {tender.grid?.location || 'Unknown'}</p>
                <p><span className="font-medium text-gray-300">Capacity:</span> {tender.grid?.capacity || 0} MW</p>
          </div>
              <div className="flex flex-wrap gap-4 mt-2">
                <p><span className="font-medium text-gray-300">Base Price:</span> {tender.basePrice} USDC</p>
                <p><span className="font-medium text-gray-300">Start:</span> {formatDate(tender.startDate)}</p>
                <p><span className="font-medium text-gray-300">End:</span> {formatDate(tender.endDate)}</p>
        </div>
          </div>
          </div>
        ))}
        </div>
      </div>
  );
};

const CreateTender = ({ gridId, onCancel }) => {
  const navigate = useNavigate();
  const wallet = useWallet();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    basePrice: '',
    requirements: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [dateError, setDateError] = useState('');

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prevState => {
      const newState = { ...prevState, [id]: value };
      
      // Validate dates whenever start or end date changes
      if (id === 'startDate' || id === 'endDate') {
        if (newState.startDate && newState.endDate) {
          const start = new Date(newState.startDate);
          const end = new Date(newState.endDate);
          
          if (start >= end) {
            setDateError('Start date/time must be earlier than end date/time');
          } else {
            setDateError('');
          }
        }
      }
      
      return newState;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!wallet.connected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    // Validate dates before submission
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    
    if (start >= end) {
      setDateError('Start date/time must be earlier than end date/time');
      return;
    }

    setIsLoading(true);
    try {
      // Check if Phantom wallet is available
      const { solana } = window;
      if (!solana?.isPhantom) {
        toast.error('Phantom wallet is not installed');
        setIsLoading(false);
        return;
      }

      // Get connected wallet
      const publicKey = wallet.publicKey.toString();
      
      // Create message to sign
      const message = `CREATE TENDER FOR GRID ${gridId} at ${new Date().toISOString()}`;
      const encodedMessage = new TextEncoder().encode(message);

      // Request signature from wallet
      const signatureResponse = await solana.signMessage(encodedMessage, 'utf8');
      
      // Convert signature to base58 as expected by backend
      const signatureBase58 = bs58.encode(signatureResponse.signature);
      
      console.log('Public Key:', publicKey);
      console.log('Message:', message);
      console.log('Signature:', signatureBase58);

      // Submit tender data with signature
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/tenders`, {
        title: formData.title,
        gridId: gridId,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        basePrice: Number(formData.basePrice),
        requirements: formData.requirements,
        transactionSignature: signatureBase58,
        message,
        walletAddress: publicKey
      }, { withCredentials: true });

      console.log(response.data);
      if (response.data.success) {
        toast.success('Tender created successfully');
        navigate('/grid-tendering/tenders');
      } else {
        toast.error(response.data.message || 'Failed to create tender');
      }
    } catch (error) {
      console.error('Error creating tender:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        toast.error(error.response.data.message || `Authentication error: ${error.response.status}`);
      } else {
        toast.error('Connection error - please check your network');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Create Tender for New Grid</h2>
        <button 
          className="text-gray-400 hover:text-gray-200"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="title">Tender Title</label>
          <input 
            className="bg-gray-800 shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:border-purple-500" 
            id="title" 
            type="text" 
            value={formData.title}
            onChange={handleChange}
            placeholder="Tender Title" 
            required
          />
          </div>
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="description">Description</label>
          <textarea 
            className="bg-gray-800 shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:border-purple-500" 
            id="description" 
            value={formData.description}
            onChange={handleChange}
            placeholder="Description" 
            rows="3"
            required
          ></textarea>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="startDate">Start Date and Time</label>
            <input 
              className="bg-gray-800 shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:border-purple-500" 
              id="startDate" 
              type="datetime-local" 
              value={formData.startDate}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="endDate">End Date and Time</label>
            <input 
              className="bg-gray-800 shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:border-purple-500" 
              id="endDate" 
              type="datetime-local" 
              value={formData.endDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        {dateError && (
          <div className="text-red-400 text-sm">
            {dateError}
          </div>
        )}
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="basePrice">Base Price (USDC)</label>
          <input 
            className="bg-gray-800 shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:border-purple-500" 
            id="basePrice" 
            type="number" 
            value={formData.basePrice}
            onChange={handleChange}
            placeholder="Base Price" 
            required
          />
        </div>
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="requirements">Requirements</label>
          <textarea 
            className="bg-gray-800 shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:border-purple-500" 
            id="requirements" 
            value={formData.requirements}
            onChange={handleChange}
            placeholder="Tender Requirements" 
            rows="3"
            required
          ></textarea>
        </div>
        <div className="flex items-center justify-between">
          <button 
            className={`bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-purple-600/30 ${isLoading || dateError ? 'opacity-50 cursor-not-allowed' : ''}`} 
            type="submit"
            disabled={isLoading || dateError}
          >
            {isLoading ? 'Creating...' : 'Create Tender'}
          </button>
          <div className="text-sm text-gray-400">Requires wallet signature</div>
      </div>
      </form>
    </div>
  );
};

// AdminRoute component to protect admin-only routes
const AdminRoute = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user/profile`, {
          withCredentials: true
        });
        
        if (response.data.success) {
          const userData = response.data.user;
          setUser(userData);
          
          if (!userData.isAdmin && userData.role !== 'admin') {
            toast.error('Access denied. Admin privileges required.');
            navigate('/grid-tendering/tenders');
          }
        } else {
          navigate('/grid-tendering/tenders');
        }
      } catch (error) {
        console.error('Admin check error:', error);
        navigate('/grid-tendering/tenders');
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Only render children if user is admin
  return (user?.isAdmin || user?.role === 'admin') ? children : null;
};

const GridRegistration = () => {
  const navigate = useNavigate();
  const wallet = useWallet();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [createdGridId, setCreatedGridId] = useState(null);
  const [showTenderForm, setShowTenderForm] = useState(false);
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user is admin
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user/profile`, {
          withCredentials: true
        });
        
        if (response.data.success) {
          const userData = response.data.user;
          setUser(userData);
          
          // Redirect if not admin
          if (!userData.isAdmin && userData.role !== 'admin') {
            toast.error('Only administrators can register grids');
            navigate('/grid-tendering/tenders');
          }
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        toast.error('Authentication error');
        navigate('/grid-tendering/tenders');
      } finally {
        setCheckingAuth(false);
      }
    };

    if (wallet.connected) {
      checkUserRole();
    } else {
      setCheckingAuth(false);
    }
  }, [wallet.connected, navigate]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prevState => ({ ...prevState, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!wallet.connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      // Check if Phantom wallet is available
      const { solana } = window;
      if (!solana?.isPhantom) {
        toast.error('Phantom wallet is not installed');
        setIsLoading(false);
        return;
      }

      // Get connected wallet
      const publicKey = wallet.publicKey.toString();
      
      // Create message to sign
      const message = `CREATE GRID ${formData.name} at ${new Date().toISOString()}`;
      const encodedMessage = new TextEncoder().encode(message);

      // Request signature from wallet
      const signatureResponse = await solana.signMessage(encodedMessage, 'utf8');
      
      // Convert signature to base58 as expected by backend
      const signatureBase58 = bs58.encode(signatureResponse.signature);

      console.log('Public Key:', publicKey);
      console.log('Message:', message);
      console.log('Signature:', signatureBase58);

      // Submit grid data with signature
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/grids`, {
        name: formData.name,
        location: formData.location,
        capacity: Number(formData.capacity),
        description: formData.description,
        specifications: {},
        status: 'active',
        transactionSignature: signatureBase58,
        message,
        walletAddress: publicKey
      }, { withCredentials: true });

      console.log(response.data);
      if (response.data.success) {
        toast.success('Grid registered successfully');
        setCreatedGridId(response.data.data._id);
        setShowTenderForm(true);
      } else {
        toast.error(response.data.message || 'Failed to register grid');
      }
    } catch (error) {
      console.error('Error registering grid:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        toast.error(error.response.data.message || `Authentication error: ${error.response.status}`);
      } else {
        toast.error('Connection error - please check your network');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelTender = () => {
    setShowTenderForm(false);
    navigate('/grid-tendering/grids/register');
  };

  if (checkingAuth) {
  return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (showTenderForm && createdGridId) {
    return <CreateTender gridId={createdGridId} onCancel={handleCancelTender} />;
  }

  return (
        <div>
      <h2 className="text-2xl font-bold text-white mb-4">Register New Grid</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="name">Grid Name</label>
          <input 
            className="bg-gray-800 shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:border-purple-500" 
            id="name" 
            type="text" 
            value={formData.name}
            onChange={handleChange}
            placeholder="Grid Name" 
            required
          />
        </div>
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="location">Location</label>
          <input 
            className="bg-gray-800 shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:border-purple-500" 
            id="location" 
            type="text" 
            value={formData.location}
            onChange={handleChange}
            placeholder="Location" 
            required
          />
        </div>
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="capacity">Capacity (MW)</label>
          <input 
            className="bg-gray-800 shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:border-purple-500" 
            id="capacity" 
            type="number" 
            value={formData.capacity}
            onChange={handleChange}
            placeholder="Capacity" 
            required
          />
        </div>
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="description">Description</label>
          <textarea 
            className="bg-gray-800 shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:border-purple-500" 
            id="description" 
            value={formData.description}
            onChange={handleChange}
            placeholder="Description" 
            rows="4"
            required
          ></textarea>
        </div>
        <div className="flex items-center justify-between">
          <button 
            className={`bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-purple-600/30 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`} 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Registering...' : 'Register Grid'}
          </button>
          <div className="text-sm text-gray-400">Requires wallet signature</div>
        </div>
      </form>
    </div>
  );
};

const TenderBids = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bids, setBids] = useState([]);
  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch tender details first
        const tenderResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/tenders/${id}`,
          { withCredentials: true }
        );
        
        if (!tenderResponse.data.success) {
          setError('Failed to load tender details');
          return;
        }
        
        setTender(tenderResponse.data.data);
        
        // Fetch bids for this tender
        const bidsResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/bids/tender/${id}`,
          { withCredentials: true }
        );

        if (bidsResponse.data.success) {
          setBids(bidsResponse.data.data);
        } else {
          setError('Failed to load bids');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-900/50 text-yellow-400';
      case 'accepted':
        return 'bg-green-900/50 text-green-400';
      case 'rejected':
        return 'bg-red-900/50 text-red-400';
      default:
        return 'bg-gray-900/50 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-400">
        <p>Tender not found</p>
      </div>
    );
  }

  if (bids.length === 0) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Bids for: {tender.title}</h2>
          <button
            onClick={() => navigate(`/grid-tendering/tenders/${id}`)}
            className="text-gray-400 hover:text-gray-200"
          >
            Back to Tender
          </button>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 text-center">
          <p className="text-gray-300">No bids have been placed for this tender yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Bids for: {tender.title}</h2>
        <button
          onClick={() => navigate(`/grid-tendering/tenders/${id}`)}
          className="text-gray-400 hover:text-gray-200"
        >
          Back to Tender
        </button>
      </div>

      <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-gray-400">Tender Status: </span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              tender.status === 'open' ? 'bg-green-900/50 text-green-400' : 
              tender.status === 'closed' ? 'bg-yellow-900/50 text-yellow-400' :
              tender.status === 'awarded' ? 'bg-blue-900/50 text-blue-400' :
              tender.status === 'cancelled' ? 'bg-red-900/50 text-red-400' :
              'bg-gray-900/50 text-gray-400'
            }`}>
              {tender.status.charAt(0).toUpperCase() + tender.status.slice(1)}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Base Price: </span>
            <span className="text-white font-medium">{tender.basePrice} USDC</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {bids.map((bid) => (
          <div
            key={bid._id}
            className="border border-gray-700 bg-gray-800/50 p-4 rounded-lg hover:bg-gray-700/50 transition-all duration-200"
          >
            <div className="flex flex-col md:flex-row justify-between mb-2">
              <div>
                <h3 className="font-semibold text-white">
                  Bidder: {bid.bidder?.email || bid.bidder?.walletAddress || 'Unknown'}
                </h3>
                <p className="text-sm text-gray-400">
                  Bid ID: {bid._id}
                </p>
              </div>
              <div className="mt-2 md:mt-0">
                <span className={`px-3 py-1 rounded-full text-xs ${getStatusBadge(bid.status)}`}>
                  {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              <div>
                <p className="text-gray-400 text-sm">Amount</p>
                <p className="text-white font-semibold">{bid.amount} USDC</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Delivery Timeline</p>
                <p className="text-white">{formatDate(bid.deliveryTimeline)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Submitted</p>
                <p className="text-white">{formatDate(bid.createdAt)}</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-gray-400 text-sm">Description</p>
              <p className="text-gray-300 mt-1">{bid.description}</p>
            </div>

            {bid.termsAndConditions && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-gray-400 text-sm">Terms & Conditions</p>
                <p className="text-gray-300 mt-1">{bid.termsAndConditions}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const TenderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBidder, setIsBidder] = useState(false);
  const [userBid, setUserBid] = useState(null);
  const [bidLoading, setBidLoading] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const wallet = useWallet();

  // Function to handle bid payout
  const handleBidPayout = async (bidId) => {
    if (!wallet.connected) {
      toast.error('Please connect your wallet to request a payout');
      return;
    }
    
    // Show token selection modal instead of directly processing payout
    setShowPayoutModal(true);
  };

  // Handle successful token transfer and payout
  const handlePayoutSuccess = (signature) => {
    // Update the local userBid state with payout info
    setUserBid({
      ...userBid,
      isPaidOut: true,
      payoutTransactionSignature: signature,
      payoutTimestamp: new Date()
    });
    
    toast.success('Payment successful! Your tokens have been transferred.');
  };

  // Fetch tender details
  useEffect(() => {
    const fetchTenderDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/tenders/${id}`, {
          withCredentials: true
        });
        
        if (response.data.success) {
          setTender(response.data.data);
          console.log(response.data.data);
          // Remove the conditional fetch for awarded bid details since it's included
        } else {
          setError('Failed to load tender details');
        }
      } catch (error) {
        console.error('Error fetching tender details:', error);
        setError(error.response?.data?.message || 'Failed to load tender details');
      } finally {
        setLoading(false);
      }
    };

    // Remove the fetchAwardedBidDetails function since it's no longer needed

    fetchTenderDetails();
  }, [id]);

  // Fetch user data and then user's bid if they're a bidder
  useEffect(() => {
    const fetchUserDataAndBid = async () => {
      try {
        setUserLoading(true);
        console.log('Fetching user profile data...');
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user/profile`, {
          withCredentials: true
        });
        console.log('User profile API response:', response.data);
        
        if (response.data.success) {
          const userData = response.data.user;
          console.log('User data received:', userData);
          
          // Check if userData has the required properties
          if (!userData || !userData.id) {
            console.error('Invalid user data received:', userData);
            setUserLoading(false);
            return;
          }
          
          // Set user data
          setUser(userData);
          
          // Set isAdmin based on user data
          setIsAdmin(userData.isAdmin || userData.role === 'admin');
          
          // Set isBidder based on the fetched user data
          const userIsBidder = userData.role === 'bidder';
          setIsBidder(userIsBidder);
          
          // Only fetch bid if user is a bidder and we have a tender ID
          if (userIsBidder && id) {
            console.log(`User is a bidder. Fetching bid for user: ${userData.id} and tender: ${id}`);
            try {
              setBidLoading(true);
              const bidResponse = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/bids/user/${userData.id}/tender/${id}`,
                { withCredentials: true }
              );
              
              console.log('Bid API Response:', bidResponse.data);
              
              if (bidResponse.data.success) {
                setUserBid(bidResponse.data.data);
              }
            } catch (error) {
              // Not showing error as the user might not have a bid yet
              console.log('Error fetching bid:', error.response?.status);
              if (error.response?.status === 404) {
                // This is expected if user hasn't placed a bid yet
                console.log('No bid found for this user and tender');
              } else {
                // Other errors might be authorization issues or server problems
                console.log('Error details:', error.response?.data || error.message);
              }
            } finally {
              setBidLoading(false);
            }
          } else {
            console.log('User is not a bidder or no tender ID. Skipping bid fetch.');
            setBidLoading(false);
          }
        } else {
          console.error('Failed to get user profile:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUserDataAndBid();
  }, [id]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-900/50 text-gray-400';
      case 'open':
        return 'bg-green-900/50 text-green-400';
      case 'closed':
        return 'bg-yellow-900/50 text-yellow-400';
      case 'awarded':
        return 'bg-blue-900/50 text-blue-400';
      case 'cancelled':
        return 'bg-red-900/50 text-red-400';
      default:
        return 'bg-gray-900/50 text-gray-400';
    }
  };

  if (loading || userLoading || bidLoading) {
  return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-400">
        <p>{error}</p>
        </div>
    );
  }

  if (!tender) {
    return (
      <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-400">
        <p>Tender not found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Add PayoutModal */}
      <PayoutModal 
        show={showPayoutModal}
        onClose={() => setShowPayoutModal(false)}
        bidAmount={userBid?.amount || 0}
        bidId={userBid?._id}
        onSuccess={handlePayoutSuccess}
      />
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">{tender.title}</h2>
        <button 
          onClick={() => navigate('/grid-tendering/tenders')}
          className="text-gray-400 hover:text-gray-200"
        >
          Back to Tenders
        </button>
      </div>

      {/* Add Token Balances display */}
      {wallet.connected && (
        <div className="mb-6">
          <TokenBalances />
        </div>
      )}

      {/* Status Banner */}
      <div className={`mb-4 p-3 rounded-lg flex items-center justify-between ${
        tender.status === 'open' ? 'bg-green-900/30 border border-green-700' : 
        tender.status === 'closed' ? 'bg-yellow-900/30 border border-yellow-700' :
        tender.status === 'awarded' ? 'bg-blue-900/30 border border-blue-700' :
        tender.status === 'cancelled' ? 'bg-red-900/30 border border-red-700' :
        'bg-gray-800/50 border border-gray-600'
      }`}>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            tender.status === 'open' ? 'bg-green-500' : 
            tender.status === 'closed' ? 'bg-yellow-500' :
            tender.status === 'awarded' ? 'bg-blue-500' :
            tender.status === 'cancelled' ? 'bg-red-500' :
            'bg-gray-500'
          }`}></div>
          <span className="text-white font-medium">Status: {tender.status.charAt(0).toUpperCase() + tender.status.slice(1)}</span>
        </div>
        <div>
          {tender.status === 'draft' && (
            <span className="text-gray-300 text-sm">This tender is not yet open for bidding</span>
          )}
          {tender.status === 'open' && (
            <span className="text-green-400 text-sm">Open for bidding</span>
          )}
          {tender.status === 'closed' && (
            <span className="text-yellow-400 text-sm">Bidding closed</span>
          )}
          {tender.status === 'awarded' && (
            <span className="text-blue-400 text-sm">Tender has been awarded</span>
          )}
          {tender.status === 'cancelled' && (
            <span className="text-red-400 text-sm">This tender has been cancelled</span>
          )}
        </div>
      </div>

      {/* Admin View All Bids Button */}
      {isAdmin && (
        <div className="mb-4">
          <button
            onClick={() => navigate(`/grid-tendering/tenders/${id}/bids`)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
          >
            View All Bids
          </button>
        </div>
      )}

      {/* Awarded Bid Section - shown if tender is awarded */}
      {tender && tender.status === 'awarded' && tender.awardedTo && (
        <div className="mb-6 border border-blue-700 bg-blue-900/30 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-white mb-4">
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              This Tender Has Been Awarded
            </span>
          </h3>

          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <p className="text-gray-400 mb-1">Awarded To</p>
                <p className="text-white font-semibold">
                  {tender.awardedTo.bidder?.email || tender.awardedTo.bidder?.walletAddress || 'Unknown Bidder'}
                </p>
                {tender.awardedTo.bidder?.walletAddress && (
                  <p className="text-gray-400 text-sm mt-1 break-all font-mono">
                    {tender.awardedTo.bidder.walletAddress}
                  </p>
                )}
              </div>
              <div>
                <p className="text-gray-400 mb-1">Award Amount</p>
                <p className="text-white font-semibold text-xl">{tender.awardedTo.amount} USDC</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-400 mb-1">Description</p>
              <p className="text-white">{tender.awardedTo.description}</p>
            </div>

            <div className="mb-4">
              <p className="text-gray-400 mb-1">Delivery Timeline</p>
              <p className="text-white">{formatDate(tender.awardedTo.deliveryTimeline)}</p>
            </div>

            {tender.awardedTo.termsAndConditions && (
              <div className="mb-4">
                <p className="text-gray-400 mb-1">Terms & Conditions</p>
                <p className="text-white">{tender.awardedTo.termsAndConditions}</p>
              </div>
            )}

            {tender.transactionSignature && (
              <div>
                <p className="text-gray-400 mb-1">Transaction</p>
                <p className="text-white break-all text-sm font-mono">
                  {tender.transactionSignature === 'auto-awarded' ? 
                    'Automatically awarded by system' : 
                    tender.transactionSignature}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="border border-gray-700 bg-gray-800/50 p-6 rounded-lg mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Tender Details</h3>
          </div>
          <div className="text-right">
            <p className="text-gray-400">Base Price: <span className="text-white font-semibold">{tender.basePrice} USDC</span></p>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4 mb-4">
          <h4 className="text-lg font-medium text-white mb-2">Description</h4>
          <p className="text-gray-300 mb-4">{tender.description}</p>
          
          <h4 className="text-lg font-medium text-white mb-2">Requirements</h4>
          <p className="text-gray-300">{tender.requirements}</p>
        </div>

        <div className="border-t border-gray-700 pt-4 mb-4">
          <h4 className="text-lg font-medium text-white mb-2">Grid Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-400">Name</p>
              <p className="text-white">{tender.grid?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-400">Location</p>
              <p className="text-white">{tender.grid?.location || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-400">Capacity</p>
              <p className="text-white">{tender.grid?.capacity || 0} MW</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-lg font-medium text-white mb-2">Timeline</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400">Start Date</p>
              <p className="text-white">{formatDate(tender.startDate)}</p>
            </div>
            <div>
              <p className="text-gray-400">End Date</p>
              <p className="text-white">{formatDate(tender.endDate)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* User's Existing Bid Section - shown if the user has already placed a bid */}
      {userBid && (
        <div className="border border-purple-700 bg-purple-900/30 p-6 rounded-lg mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">Your Bid</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <p className="text-gray-400 mb-1">Amount</p>
              <p className="text-white font-semibold text-xl">{userBid.amount} USDC</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Status</p>
              <p className="text-white font-medium">
                <span className={`px-2 py-1 rounded-full text-sm
                  ${userBid.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' : 
                    userBid.status === 'accepted' ? 'bg-green-900/50 text-green-400' : 
                    userBid.status === 'rejected' ? 'bg-red-900/50 text-red-400' : 
                    'bg-gray-900/50 text-gray-400'}`
                }>
                  {userBid.status.charAt(0).toUpperCase() + userBid.status.slice(1)}
                </span>
                {userBid.isPaidOut && 
                  <span className="ml-2 bg-blue-900/50 text-blue-400 px-2 py-1 rounded-full text-sm">Paid Out</span>
                }
              </p>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-400 mb-1">Description</p>
            <p className="text-white">{userBid.description}</p>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-400 mb-1">Delivery Timeline</p>
            <p className="text-white">{formatDate(userBid.deliveryTimeline)}</p>
          </div>
          
          {userBid.termsAndConditions && (
            <div className="mb-4">
              <p className="text-gray-400 mb-1">Terms & Conditions</p>
              <p className="text-white">{userBid.termsAndConditions}</p>
            </div>
          )}

          {/* Show payout button only for accepted bids that haven't been paid out yet */}
          {userBid.status === 'accepted' && !userBid.isPaidOut && (
            <div className="mt-4">
              <button 
                onClick={() => handleBidPayout(userBid._id)}
                className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-green-600/30"
              >
                Request Payout
              </button>
            </div>
          )}

          {/* Update Bid Button - only if tender is still open */}
          {tender.status === 'open' && (
            <div className="mt-4">
              <button 
                onClick={() => navigate(`/grid-tendering/tenders/${tender._id}/bid/update/${userBid._id}`)}
                className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-purple-600/30"
              >
                Update Bid
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bid section - shown only if tender is open AND user is a bidder AND has not placed a bid yet */}
      {tender.status === 'open' && isBidder && !userBid && (
        <div className="mt-6 text-center">
          <button 
            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-purple-600/30"
            onClick={() => navigate(`/grid-tendering/tenders/${tender._id}/bid`)}
          >
            Place Bid
          </button>
        </div>
      )}
    </div>
  );
};

// Bid service - following single responsibility principle
const BidService = {
  createBid: async (bidData, walletAddress, signature, message) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/bids`, 
        {
          ...bidData,
          walletAddress,
          transactionSignature: signature,
          message
        },
        { withCredentials: true }
      );
      console.log(response.data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getBidsByTender: async (tenderId) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/tenders/${tenderId}/bids`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// BidForm component - following single responsibility and interface segregation principles
const BidForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const wallet = useWallet();
  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    tenderId: id,
    amount: '',
    description: '',
    deliveryTimeline: '',
    termsAndConditions: ''
  });

  useEffect(() => {
    const fetchTenderDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/tenders/${id}`, {
          withCredentials: true
        });
        
        if (response.data.success) {
          setTender(response.data.data);
        } else {
          setError('Failed to load tender details');
        }
      } catch (error) {
        console.error('Error fetching tender details:', error);
        setError(error.response?.data?.message || 'Failed to load tender details');
      } finally {
        setLoading(false);
      }
    };

    fetchTenderDetails();
  }, [id]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prevState => ({ ...prevState, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!wallet.connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setSubmitting(true);
    try {
      // Check if Phantom wallet is available
      const { solana } = window;
      if (!solana?.isPhantom) {
        toast.error('Phantom wallet is not installed');
        setSubmitting(false);
        return;
      }

      // Get connected wallet
      const publicKey = wallet.publicKey.toString();
      
      // Create message to sign
      const message = `PLACE BID on TENDER ${id} for AMOUNT ${formData.amount} at ${new Date().toISOString()}`;
      const encodedMessage = new TextEncoder().encode(message);

      // Request signature from wallet
      const signatureResponse = await solana.signMessage(encodedMessage, 'utf8');
      
      // Convert signature to base58 as expected by backend
      const signatureBase58 = bs58.encode(signatureResponse.signature);
      
      console.log('Public Key:', publicKey);
      console.log('Message:', message);
      console.log('Signature:', signatureBase58);

      // Use the BidService to create bid
      const response = await BidService.createBid(
        {
          tenderId: id,
          amount: Number(formData.amount),
          description: formData.description,
          deliveryTimeline: formData.deliveryTimeline,
          termsAndConditions: formData.termsAndConditions
        },
        publicKey,
        signatureBase58,
        message
      );

      if (response.success) {
        toast.success('Bid placed successfully');
        navigate(`/grid-tendering/tenders/${id}`);
      } else {
        toast.error(response.message || 'Failed to place bid');
      }
    } catch (error) {
      console.error('Error placing bid:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        toast.error(error.response.data.message || `Error: ${error.response.status}`);
      } else {
        toast.error('Connection error - please check your network');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-400">
        <p>Tender not found</p>
      </div>
    );
  }

  // Don't allow bidding if tender is not open
  if (tender.status !== 'open') {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Place Bid</h2>
          <button 
            onClick={() => navigate(`/grid-tendering/tenders/${id}`)}
            className="text-gray-400 hover:text-gray-200"
          >
            Back to Tender
          </button>
        </div>

        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-6 text-yellow-400 text-center">
          <p>This tender is not currently open for bidding.</p>
          <button 
            onClick={() => navigate('/grid-tendering/tenders')}
            className="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            View All Tenders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Place Bid for: {tender.title}</h2>
        <button 
          onClick={() => navigate(`/grid-tendering/tenders/${id}`)}
          className="text-gray-400 hover:text-gray-200"
        >
          Back to Tender
        </button>
      </div>

      <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 mb-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-white mb-2">Tender Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400">Grid Name</p>
              <p className="text-white">{tender.grid?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-400">Base Price</p>
              <p className="text-white">{tender.basePrice} USDC</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="amount">
            Bid Amount (USDC)
          </label>
          <input
            className="bg-gray-800 shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:border-purple-500"
            id="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            placeholder="Enter your bid amount"
            required
          />
          {Number(formData.amount) < Number(tender.basePrice) && (
            <p className="text-red-400 text-xs mt-1">Bid amount must be at least the base price ({tender.basePrice} USDC)</p>
          )}
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="description">
            Bid Description
          </label>
          <textarea
            className="bg-gray-800 shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:border-purple-500"
            id="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your bid in detail"
            required
          ></textarea>
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="deliveryTimeline">
            Delivery Timeline
          </label>
          <input
            className="bg-gray-800 shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:border-purple-500"
            id="deliveryTimeline"
            type="date"
            value={formData.deliveryTimeline}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="termsAndConditions">
            Terms and Conditions (Optional)
          </label>
          <textarea
            className="bg-gray-800 shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:border-purple-500"
            id="termsAndConditions"
            rows="3"
            value={formData.termsAndConditions}
            onChange={handleChange}
            placeholder="Any additional terms or conditions"
          ></textarea>
        </div>

        <div className="flex items-center justify-between">
          <button
            className={`bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-purple-600/30 ${
              submitting || Number(formData.amount) < Number(tender.basePrice) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            type="submit"
            disabled={submitting || Number(formData.amount) < Number(tender.basePrice)}
          >
            {submitting ? 'Submitting...' : 'Place Bid'}
          </button>
          <p className="text-sm text-gray-400">Requires wallet signature</p>
        </div>
      </form>
    </div>
  );
};

// UpdateBid component for modifying existing bids
const UpdateBid = () => {
  const { id, bidId } = useParams();
  const navigate = useNavigate();
  const wallet = useWallet();
  const [tender, setTender] = useState(null);
  const [existingBid, setExistingBid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    deliveryTimeline: '',
    termsAndConditions: ''
  });

  // Fetch tender and existing bid data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log(`Fetching data for tender ${id} and bid ${bidId}`);
        
        // Fetch tender details
        const tenderResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/tenders/${id}`, 
          { withCredentials: true }
        );
        
        if (!tenderResponse.data.success) {
          setError('Failed to load tender details');
          return;
        }
        
        setTender(tenderResponse.data.data);
        
        // Fetch existing bid - ensure bidId is valid and remove any trailing colons or numbers
        const cleanBidId = bidId.split(':')[0]; // Remove any trailing :1 or similar
        console.log(`Fetching bid with ID: ${cleanBidId}`);
        
        const bidResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/bids/${cleanBidId}`,
          { withCredentials: true }
        );
        
        if (!bidResponse.data.success) {
          setError('Failed to load bid details');
          return;
        }
        
        const bid = bidResponse.data.data;
        setExistingBid(bid);
        
        // Initialize form with existing bid data
        setFormData({
          amount: bid.amount.toString(),
          description: bid.description,
          deliveryTimeline: new Date(bid.deliveryTimeline).toISOString().split('T')[0],
          termsAndConditions: bid.termsAndConditions || ''
        });
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, bidId]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prevState => ({ ...prevState, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!wallet.connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setSubmitting(true);
    try {
      // Check if Phantom wallet is available
      const { solana } = window;
      if (!solana?.isPhantom) {
        toast.error('Phantom wallet is not installed');
        setSubmitting(false);
        return;
      }

      // Get connected wallet
      const publicKey = wallet.publicKey.toString();
      
      // Ensure clean bidId without any trailing parts
      const cleanBidId = bidId.split(':')[0];
      
      // Create message to sign
      const message = `UPDATE BID ${cleanBidId} on TENDER ${id} for AMOUNT ${formData.amount} at ${new Date().toISOString()}`;
      const encodedMessage = new TextEncoder().encode(message);

      // Request signature from wallet
      const signatureResponse = await solana.signMessage(encodedMessage, 'utf8');
      
      // Convert signature to base58 as expected by backend
      const signatureBase58 = bs58.encode(signatureResponse.signature);
      
      // Update the bid
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/bids/${cleanBidId}`,
        {
          amount: Number(formData.amount),
          description: formData.description,
          deliveryTimeline: formData.deliveryTimeline,
          termsAndConditions: formData.termsAndConditions,
          transactionSignature: signatureBase58,
          message
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('Bid updated successfully');
        navigate(`/grid-tendering/tenders/${id}`);
      } else {
        toast.error(response.data.message || 'Failed to update bid');
      }
    } catch (error) {
      console.error('Error updating bid:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        toast.error(error.response.data.message || `Error: ${error.response.status}`);
      } else {
        toast.error('Connection error - please check your network');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  if (!tender || !existingBid) {
    return (
      <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-400">
        <p>Tender or bid not found</p>
      </div>
    );
  }

  // Don't allow updating if tender is not open
  if (tender.status !== 'open') {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Update Bid</h2>
          <button 
            onClick={() => navigate(`/grid-tendering/tenders/${id}`)}
            className="text-gray-400 hover:text-gray-200"
          >
            Back to Tender
          </button>
        </div>

        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-6 text-yellow-400 text-center">
          <p>This tender is not currently open for bidding. You cannot update your bid.</p>
          <button 
            onClick={() => navigate(`/grid-tendering/tenders/${id}`)}
            className="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            View Tender
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Update Bid for: {tender.title}</h2>
        <button 
          onClick={() => navigate(`/grid-tendering/tenders/${id}`)}
          className="text-gray-400 hover:text-gray-200"
        >
          Back to Tender
        </button>
      </div>

      <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 mb-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-white mb-2">Tender Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400">Grid Name</p>
              <p className="text-white">{tender.grid?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-400">Base Price</p>
              <p className="text-white">{tender.basePrice} USDC</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="amount">
            Bid Amount (USDC)
          </label>
          <input
            className="bg-gray-800 shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:border-purple-500"
            id="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            placeholder="Enter your bid amount"
            required
          />
          {Number(formData.amount) < Number(tender.basePrice) && (
            <p className="text-red-400 text-xs mt-1">Bid amount must be at least the base price ({tender.basePrice} USDC)</p>
          )}
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="description">
            Bid Description
          </label>
          <textarea
            className="bg-gray-800 shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:border-purple-500"
            id="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your bid in detail"
            required
          ></textarea>
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="deliveryTimeline">
            Delivery Timeline
          </label>
          <input
            className="bg-gray-800 shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:border-purple-500"
            id="deliveryTimeline"
            type="date"
            value={formData.deliveryTimeline}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="termsAndConditions">
            Terms and Conditions (Optional)
          </label>
          <textarea
            className="bg-gray-800 shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:border-purple-500"
            id="termsAndConditions"
            rows="3"
            value={formData.termsAndConditions}
            onChange={handleChange}
            placeholder="Any additional terms or conditions"
          ></textarea>
        </div>

        <div className="flex items-center justify-between">
          <button
            className={`bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-purple-600/30 ${
              submitting || Number(formData.amount) < Number(tender.basePrice) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            type="submit"
            disabled={submitting || Number(formData.amount) < Number(tender.basePrice)}
          >
            {submitting ? 'Updating...' : 'Update Bid'}
          </button>
          <p className="text-sm text-gray-400">Requires wallet signature</p>
        </div>
      </form>
    </div>
  );
};

// AdminBids component to display all bids in the system
const AdminBids = () => {
  const navigate = useNavigate();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllBids = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/bids/all`,
          { withCredentials: true }
        );

        if (response.data.success) {
          setBids(response.data.data);
        } else {
          setError('Failed to load bids');
        }
      } catch (error) {
        console.error('Error fetching bids:', error);
        setError(error.response?.data?.message || 'Failed to load bids');
      } finally {
        setLoading(false);
      }
    };

    fetchAllBids();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-900/50 text-yellow-400';
      case 'accepted':
        return 'bg-green-900/50 text-green-400';
      case 'rejected':
        return 'bg-red-900/50 text-red-400';
      default:
        return 'bg-gray-900/50 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  if (bids.length === 0) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">All Bids</h2>
          <button
            onClick={() => navigate('/grid-tendering/tenders')}
            className="text-gray-400 hover:text-gray-200"
          >
            Back to Tenders
          </button>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 text-center">
          <p className="text-gray-300">No bids have been placed yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">All Bids</h2>
        <button
          onClick={() => navigate('/grid-tendering/tenders')}
          className="text-gray-400 hover:text-gray-200"
        >
          Back to Tenders
        </button>
      </div>

      <div className="space-y-4">
        {bids.map((bid) => (
          <div
            key={bid._id}
            className="border border-gray-700 bg-gray-800/50 p-4 rounded-lg"
          >
            <div className="flex flex-col md:flex-row justify-between mb-2">
              <div>
                <h3 className="font-semibold text-white">
                  Bid for: {bid.tender?.title || 'Unknown Tender'}
                </h3>
                <p className="text-sm text-gray-400">
                  Bidder: {bid.bidder?.email || bid.bidder?.walletAddress || 'Unknown'}
                </p>
              </div>
              <div className="mt-2 md:mt-0">
                <span className={`px-3 py-1 rounded-full text-xs ${getStatusBadge(bid.status)}`}>
                  {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              <div>
                <p className="text-gray-400 text-sm">Amount</p>
                <p className="text-white font-semibold">{bid.amount} USDC</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Delivery Timeline</p>
                <p className="text-white">{formatDate(bid.deliveryTimeline)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Submitted</p>
                <p className="text-white">{formatDate(bid.createdAt)}</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-gray-400 text-sm">Description</p>
              <p className="text-gray-300 mt-1">{bid.description}</p>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={() => navigate(`/grid-tendering/tenders/${bid.tender?._id}`)}
                className="text-purple-400 hover:text-purple-300 text-sm"
              >
                View Tender Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const GridTendering = () => {
  const { connected } = useWallet();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      if (!connected) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user/profile`, {
          withCredentials: true
        });
        
        if (response.data.success) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [connected]);

  // Check if user is admin
  const isAdmin = user?.isAdmin || user?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Toaster position="top-right" />
        
        {!connected ? (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-400 mb-6">
            <p>Please connect your wallet to interact with the grid tendering system.</p>
          </div>
        ) : (
          <>
            <div className="relative mb-8">
              {/* Background elements */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-3xl blur-xl"></div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/30 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl"></div>
              
              {/* Content */}
              <div className="relative z-10 p-8 rounded-3xl bg-gray-800/50 backdrop-blur-sm border border-gray-700">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className="text-left mb-6 md:mb-0">
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-500 to-blue-400 bg-clip-text text-transparent mb-2">
                      Grid Tendering System
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl">
                      Create and manage grid tenders, register new grids and place bids
                    </p>
              </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Only show Register Grid button to admins */}
                    {isAdmin && (
                      <>
                <Link 
                  to="/grid-tendering/grids/register" 
                          className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center transition-all duration-200 hover:shadow-lg hover:shadow-purple-600/30"
                >
                  Register Grid
                </Link>
                        <Link 
                          to="/grid-tendering/admin-bids" 
                          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/30"
                        >
                          View All Bids
                        </Link>
                      </>
                    )}
                <Link 
                  to="/grid-tendering/tenders" 
                      className="border border-gray-600 hover:border-purple-500 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center transition-all duration-200 hover:bg-gray-700/50"
                >
                  View Tenders
                </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <Routes>
          <Route path="/" element={<TenderList />} />
          <Route path="/tenders" element={<TenderList />} />
          <Route path="/tenders/:id" element={<TenderDetails />} />
          <Route path="/tenders/:id/bids" element={
            <AdminRoute>
              <TenderBids />
            </AdminRoute>
          } />
          <Route path="/tenders/:id/bid" element={<BidForm />} />
          <Route path="/tenders/:id/bid/update/:bidId" element={<UpdateBid />} />
          <Route path="/grids/register" element={
            <AdminRoute>
              <GridRegistration />
            </AdminRoute>
          } />
          <Route path="/admin-bids" element={
            <AdminRoute>
              <AdminBids />
            </AdminRoute>
          } />
        </Routes>
        </div>
      </div>
    </div>
  );
};

export default GridTendering;