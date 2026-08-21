import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor';
import { TOKEN_2022_PROGRAM_ID, getAccount, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferInstruction } from '@solana/spl-token';
import { Buffer } from 'buffer';
import axios from 'axios';
import Navbar from './Navbar';
import { programId } from './blockchain/program_id';

// Fix for browser environment
window.Buffer = Buffer;

// Program ID from your contract
const PROGRAM_ID = new PublicKey(programId);

// VidyutChain token mint address
const VC_TOKEN_MINT = new PublicKey("B3TDYUdCtu5xCTiWHgLUXRkWGifiTMe8ahmq75NRSFm9");

// IDL for the marketplace program - could be imported from ./blockchain/idl.json
const IDL = {"version":"0.1.0","name":"marketplace","instructions":[{"name":"listProduct","accounts":[{"name":"seller","isMut":true,"isSigner":true},{"name":"product","isMut":true,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[{"name":"productName","type":"string"},{"name":"price","type":"u64"}]},{"name":"buyProduct","accounts":[{"name":"buyer","isMut":true,"isSigner":true},{"name":"product","isMut":true,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[]}],"accounts":[{"name":"Product","type":{"kind":"struct","fields":[{"name":"seller","type":"publicKey"},{"name":"buyer","type":{"option":"publicKey"}},{"name":"productName","type":"string"},{"name":"price","type":"u64"},{"name":"isSold","type":"bool"}]}}],"errors":[{"code":6000,"name":"AlreadySold","msg":"Product has already been sold."}]};

const EnergyTrading = () => {
  const wallet = useWallet();
  const { publicKey, connected, sendTransaction } = wallet;
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });
  
  // Blockchain state
  const [connection, setConnection] = useState(null);
  const [program, setProgram] = useState(null);
  const [balance, setBalance] = useState(0);
  const [vcBalance, setVcBalance] = useState(0);
  const [energyListings, setEnergyListings] = useState([]);
  const [certificateListings, setCertificateListings] = useState([]);
  
  // Track wallet address for change detection
  const [currentWalletAddress, setCurrentWalletAddress] = useState(null);

  // Form state for selling energy
  const [energyAmount, setEnergyAmount] = useState('');
  const [energyPrice, setEnergyPrice] = useState('');
  const [suggestedPrice, setSuggestedPrice] = useState(null);
  const [useManualPrice, setUseManualPrice] = useState(false);

  // Modal state
  const [showCreateOfferModal, setShowCreateOfferModal] = useState(false);
  const [selectedTradingMethod, setSelectedTradingMethod] = useState(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  // State for showing price changes
  const [priceChanges, setPriceChanges] = useState({});

  // Token transfer state
  const [tokenTransferLoading, setTokenTransferLoading] = useState(false);
  const [tokenTransferError, setTokenTransferError] = useState(null);

  // Base price per kWh in VC
  const BASE_PRICE_PER_KWH = 3.0;

  // Add state for active tab
  const [activeTab, setActiveTab] = useState('p2p'); // 'p2p' or 'virtual'
  
  // Tab switching function
  const switchTab = (tab) => {
    setActiveTab(tab);
  };

  // Detect wallet changes and refresh user data or log out
  useEffect(() => {
    if (publicKey) {
      const newWalletAddress = publicKey.toString();
      
      // If we have a previous wallet address and it's different from the current one
      if (currentWalletAddress && currentWalletAddress !== newWalletAddress) {
        console.log("Wallet address changed from", currentWalletAddress, "to", newWalletAddress);
        
        // Force a complete refresh of user data when wallet changes
        handleWalletChange(newWalletAddress);
      }
      
      // Update current wallet address
      setCurrentWalletAddress(newWalletAddress);
    } else {
      setCurrentWalletAddress(null);
    }
  }, [publicKey, connected]);

  // Handle wallet change with proper refresh or logout
  const handleWalletChange = async (newWalletAddress) => {
    try {
      setLoading(true);
      showNotification('Wallet changed - updating account information...', 'info');
      
      // Clear existing user data immediately to prevent UI showing old data
      setUserData(null);
      
      // Make a request to validate the new wallet and get associated user
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/wallet-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: newWalletAddress
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        // If the server rejected the wallet, force logout
        console.error("Wallet authentication failed - logging out");
        showNotification('Wallet changed - please login again with your new wallet', 'error');
        navigate('/');
        return;
      }
      
      // Get the refreshed user data
      const userData = await fetchUserData(true);
      
      // If we couldn't get valid user data, force logout
      if (!userData) {
        console.error("Couldn't fetch user data for new wallet - logging out");
        showNotification('Wallet changed - please login again with your new wallet', 'error');
        navigate('/');
        return;
      }
      
      // Refresh the connection and balances for the new wallet
      if (connection) {
        // Refresh SOL balance
        const walletBalance = await connection.getBalance(publicKey);
        setBalance(walletBalance / LAMPORTS_PER_SOL);
        
        // Refresh VC token balance
        await fetchVCTokenBalance(connection, publicKey);
        
        // Refresh listings
        await fetchEnergyListings(connection, program, publicKey);
      }
      
      showNotification(`Successfully switched to account: ${userData.email}`, 'success');
    } catch (error) {
      console.error("Error handling wallet change:", error);
      showNotification('Error updating account information - please log out and back in', 'error');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // Separate fetchUserData function for reusability
  const fetchUserData = async (isWalletChange = false) => {
    try {
      if (!isWalletChange) {
        setLoading(true);
      }
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/profile`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          navigate('/');
          return null;
        }
        throw new Error('Failed to load user data');
      }
      
      const data = await response.json();
      if (data.success) {
        setUserData(data.user);
        return data.user;
      } else {
        throw new Error(data.error || 'Failed to load user data');
      }
    } catch (error) {
      console.error('Energy Trading error:', error);
      setError(error.message || 'Failed to load user data');
      
      // If we can't fetch user data, log them out
      if (isWalletChange) {
        return null;
      } else {
        navigate('/');
      }
    } finally {
      if (!isWalletChange) {
        setLoading(false);
      }
    }
    return null;
  };

  // Update original useEffect to use the fetchUserData function
  useEffect(() => {
    fetchUserData();
  }, [navigate]);

  // Initialize Solana connection and program
  useEffect(() => {
    const initSolanaConnection = async () => {
      if (!connected || !publicKey) return;
      
      try {
        // Setup connection to devnet
        const conn = new Connection(clusterApiUrl('devnet'), 'confirmed');
        setConnection(conn);

        // Create provider and program
        const provider = new AnchorProvider(
          conn,
          wallet,
          { preflightCommitment: 'confirmed' }
        );

        const prog = new Program(IDL, PROGRAM_ID, provider);
        setProgram(prog);

        // Get wallet balance
        const walletBalance = await conn.getBalance(publicKey);
        setBalance(walletBalance / LAMPORTS_PER_SOL);

        // Fetch VC token balance
        await fetchVCTokenBalance(connection, publicKey);
        
        // Fetch certificates
        await fetchCertificates();

        showNotification('Wallet connected successfully!', 'success');
        fetchEnergyListings(conn, prog, publicKey);
      } catch (error) {
        console.error('Solana connection error:', error);
        showNotification('Failed to connect to Solana.', 'error');
      }
    };

    initSolanaConnection();
  }, [connected, publicKey, wallet]);

  // Check if user is connected and authenticated
  useEffect(() => {
    if (!connected) {
      navigate('/');
    }
  }, [connected, navigate]);

  // Automatically suggest price when energy amount changes
  useEffect(() => {
    if (energyAmount && energyAmount > 0) {
      fetchSuggestedPrice(energyAmount);
    } else {
      setSuggestedPrice(null);
    }
  }, [energyAmount]);

  // Fetch suggested price from the AI API
  const fetchSuggestedPrice = async (amount) => {
    try {
      // Fetch city from user data or use default
      const city = userData?.city || "Mumbai";
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/predict-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          energy_kwh: parseFloat(amount),
          city: city
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get price suggestion');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Start with base price: energy amount * 3 VC
        const basePrice = parseFloat(amount) * BASE_PRICE_PER_KWH;
        
        // Add dynamic component from AI prediction (converted to VC)
        // The AI prediction gives price in Rs, and 1 VC = 1 Rs
        const dynamicComponent = data.price - basePrice;
        
        // Ensure minimum base price
        const priceInVC = Math.max(basePrice, basePrice + dynamicComponent);
        
        console.log(`Price calculation: ${amount} kWh × ${BASE_PRICE_PER_KWH} VC = ${basePrice} VC base + ${dynamicComponent.toFixed(2)} VC adjustment = ${priceInVC.toFixed(2)} VC total`);
        
        setSuggestedPrice(priceInVC);
        
        // Set the price if not using manual price
        if (!useManualPrice) {
          setEnergyPrice(priceInVC.toFixed(3));
        }
      } else {
        throw new Error('Price prediction failed');
      }
    } catch (error) {
      console.error('Error fetching suggested price:', error);
      // Provide a fallback price based on amount: Base price + 10-20% dynamic component
      const basePrice = parseFloat(amount) * BASE_PRICE_PER_KWH;
      const randomFactor = 1 + (Math.random() * 0.2); // Random factor between 1.0 and 1.2
      const fallbackPrice = basePrice * randomFactor;
      
      console.log(`Fallback price calculation: ${amount} kWh × ${BASE_PRICE_PER_KWH} VC × ${randomFactor.toFixed(2)} = ${fallbackPrice.toFixed(2)} VC`);
      
      setSuggestedPrice(fallbackPrice);
      
      if (!useManualPrice) {
        setEnergyPrice(fallbackPrice.toFixed(3));
      }
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 5000);
  };

  const fetchEnergyListings = async (conn, prog, userPublicKey) => {
    if (!conn || !prog) return;

    setLoading(true);
    try {
      // Get all product accounts from the program
      const accounts = await prog.account.product.all();
      
      // Transform them into energy listings
      const listings = accounts.map(account => ({
        ...account.account,
        publicKey: account.publicKey.toString(),
        seller: account.account.seller.toString(),
        buyer: account.account.buyer ? account.account.buyer.toString() : null,
        productName: account.account.productName, // This contains energy amount info (e.g., "5kWh")
        price: account.account.price,
        isMine: account.account.seller.toString() === userPublicKey.toString(),
        energyAmount: parseEnergyAmount(account.account.productName),
        pricePerKwh: calculatePricePerKwh(account.account.price, parseEnergyAmount(account.account.productName))
      }));
      
      setEnergyListings(listings);
    } catch (error) {
      console.error('Error fetching energy listings:', error);
      showNotification('Failed to fetch energy listings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper to parse energy amount from product name (e.g., "5kWh" -> 5)
  const parseEnergyAmount = (productName) => {
    const match = productName.match(/(\d+)kWh/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Helper to calculate price per kWh
  const calculatePricePerKwh = (totalPrice, energyAmount) => {
    if (!energyAmount) return 0;
    // Convert from lamports to VC and calculate price per kWh
    const pricePerKwh = (totalPrice / LAMPORTS_PER_SOL) / energyAmount;
    // Ensure the price is at least the BASE_PRICE_PER_KWH (3.0)
    return Math.max(pricePerKwh, BASE_PRICE_PER_KWH);
  };

  const openCreateOfferModal = () => {
    setShowCreateOfferModal(true);
    // Reset form fields
    setEnergyAmount('');
    setEnergyPrice('');
    setSuggestedPrice(null);
    setSelectedTradingMethod(null);
    setUseManualPrice(false);
  };

  const closeCreateOfferModal = () => {
    setShowCreateOfferModal(false);
  };

  const selectTradingMethod = (method) => {
    setSelectedTradingMethod(method);
  };

  const handlePriceInputChange = (e) => {
    setUseManualPrice(true);
    
    // Get the entered value
    let value = e.target.value;
    
    // If energy amount is set, enforce the minimum base price
    if (energyAmount && parseFloat(energyAmount) > 0) {
      const minPrice = parseFloat(energyAmount) * BASE_PRICE_PER_KWH;
      // Only enforce if the field is not empty and has a numeric value
      if (value && !isNaN(parseFloat(value))) {
        value = Math.max(parseFloat(value), minPrice).toFixed(3);
      }
    }
    
    setEnergyPrice(value);
  };

  const listEnergy = async (e) => {
    e.preventDefault();
    if (!publicKey || !energyAmount || !energyPrice || !selectedTradingMethod) {
      showNotification('Please fill all fields and select a trading method.', 'error');
      return;
    }

    setLoading(true);
    try {
      // Handle Virtual Grid Pool option differently
      if (selectedTradingMethod === 'pool') {
        // Show confirmation dialog
        if (!window.confirm(`Are you sure you want to list ${energyAmount} kWh for ${energyPrice} VC in the Virtual Grid Pool? This will generate a certificate that can be claimed by industry/company users.`)) {
          setLoading(false);
          return;
        }
        
        // Create a transaction to sign - this will trigger the wallet popup
        const transaction = new Transaction();
        
        // Add a simple system instruction as a placeholder to trigger wallet popup
        // You could modify this to include a meaningful memo or other data
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: publicKey, // Transfer to self (0 lamports)
            lamports: 0, // No actual SOL is transferred
          })
        );
        
        // Sign the transaction to get wallet confirmation
        try {
          const signature = await sendTransaction(transaction, connection);
          console.log("Transaction confirmed with signature:", signature);
          
          // Now that user has confirmed via wallet, make the API call
          const response = await axios.post(`${import.meta.env.VITE_BACKEND_AI_URL}/api/virtual-grid-pool/list-energy`, {
            energy_amount: parseFloat(energyAmount),
            producer_wallet: publicKey.toString(),
            producer_name: userData?.name || 'Anonymous Producer',
            pricing: {
              amount: parseFloat(energyPrice),
              currency: 'VC'
            },
            transaction_signature: signature // Send the signature as proof
          });

          if (response.data.success) {
            showNotification(`Energy successfully listed in Virtual Grid Pool with certificate ID: ${response.data.certificate.certificate_id.substring(0, 8)}...`, 'success');
            setEnergyAmount('');
            setEnergyPrice('');
            setSelectedTradingMethod(null);
            setShowCreateOfferModal(false);
            
            // Refresh certificates list and balances
            await fetchCertificates();
            await refreshBalances();
          } else {
            throw new Error(response.data.error || 'Failed to list energy in Virtual Grid Pool');
          }
        } catch (error) {
          console.error("Transaction error:", error);
          throw new Error(`Transaction failed: ${error.message}`);
        }
      } else {
        // Original P2P Direct Trade via blockchain
      // Create a product name in the format "10kWh"
      const productName = `${energyAmount}kWh`;
      
      // Calculate product PDA (same as in your contract)
      const [productPDA] = await web3.PublicKey.findProgramAddress(
        [
          Buffer.from(productName),
          publicKey.toBuffer()
        ],
        program.programId
      );

      // Execute the listProduct instruction
      const tx = await program.rpc.listProduct(
        productName,
        new BN(parseFloat(energyPrice) * LAMPORTS_PER_SOL),
        {
          accounts: {
            seller: publicKey,
            product: productPDA,
            systemProgram: web3.SystemProgram.programId,
          },
        }
      );

      showNotification(`Energy listed successfully! Tx: ${tx.substring(0, 8)}...`, 'success');
      setEnergyAmount('');
      setEnergyPrice('');
      setSelectedTradingMethod(null);
      setShowCreateOfferModal(false);

        // Refresh energy listings and balances
      await fetchEnergyListings(connection, program, publicKey);
        await refreshBalances();
      }
    } catch (error) {
      console.error('Error listing energy:', error);
      let errorMessage = error.message || 'Unknown error occurred';
      
      // Handle specific error types
      if (error.response && error.response.data) {
        errorMessage = error.response.data.error || errorMessage;
      } else if (typeof error === 'object' && error.code) {
        errorMessage = `Transaction failed: code ${error.code}`;
      }
      
      showNotification(`Failed to list energy: ${errorMessage}`, 'error');
    }
    setLoading(false);
  };

  const buyEnergy = async (listing) => {
    if (!program || !publicKey) {
      showNotification('Please connect wallet first.', 'error');
      return;
    }

    const priceInVC = listing.price / LAMPORTS_PER_SOL; // Convert from lamports to VC
    
    // Check if user has enough VC balance
    if (vcBalance < priceInVC) {
      showNotification(`Insufficient VC balance. You need ${priceInVC.toFixed(4)} VC to make this purchase.`, 'error');
      return;
    }

    setLoading(true);
    setTokenTransferLoading(true);
    setTokenTransferError(null);
    
    try {
      // First transfer VC tokens from buyer to seller
      const sellerAddress = new PublicKey(listing.seller);
      
      // Transfer tokens
      const transferSignature = await transferVCTokens(
        sellerAddress, 
        priceInVC
      );
      
      if (!transferSignature) {
        throw new Error("Token transfer failed");
      }
      
      // After successful token transfer, update the listing
      const tx = await program.rpc.buyProduct(
        {
          accounts: {
            buyer: publicKey,
            product: new PublicKey(listing.publicKey),
            systemProgram: web3.SystemProgram.programId,
          },
        }
      );

      showNotification(`Energy purchased successfully! Token transfer: ${transferSignature.substring(0, 8)}...`, 'success');

      // Refresh energy listings and balances
      await fetchEnergyListings(connection, program, publicKey);
      await refreshBalances();
    } catch (error) {
      console.error('Error buying energy:', error);
      setTokenTransferError(error.message);
      showNotification(`Failed to buy energy: ${error.message}`, 'error');
    } finally {
      setLoading(false);
      setTokenTransferLoading(false);
    }
  };

  // Function to transfer VC tokens
  const transferVCTokens = async (recipientAddress, amount) => {
    try {
      // Get the associated token accounts for sender and recipient
      const senderTokenAccount = await getAssociatedTokenAddress(
        VC_TOKEN_MINT,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      
      const recipientTokenAccount = await getAssociatedTokenAddress(
        VC_TOKEN_MINT,
        recipientAddress,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      // Create transaction
      const transaction = new Transaction();
      
      // Check if recipient token account exists, if not create it
      try {
        await getAccount(
          connection,
          recipientTokenAccount,
          'confirmed',
          TOKEN_2022_PROGRAM_ID
        );
      } catch (error) {
        // Account doesn't exist, create it
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            recipientTokenAccount,
            recipientAddress,
            VC_TOKEN_MINT,
            TOKEN_2022_PROGRAM_ID
          )
        );
      }
      
      // Calculate amount in token units (considering decimals)
      const tokenDecimals = 9; // Assuming VC has 9 decimals, adjust if different
      const tokenAmount = Math.floor(amount * Math.pow(10, tokenDecimals));
      
      // Add transfer instruction
      transaction.add(
        createTransferInstruction(
          senderTokenAccount,
          recipientTokenAccount,
          publicKey,
          tokenAmount,
          [],
          TOKEN_2022_PROGRAM_ID
        )
      );
      
      // Send and confirm transaction
      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      
      return signature;
    } catch (error) {
      console.error("Error transferring tokens:", error);
      throw new Error(`Token transfer failed: ${error.message}`);
    }
  };

  // Check if user is a producer
  const isProducer = userData?.role === 'producer';

  // Simulate price fluctuations (in a real app, this would come from blockchain/backend)
  useEffect(() => {
    if (energyListings.length === 0) return;
    
    // Update prices every 30 seconds
    const interval = setInterval(() => {
      const newPriceChanges = { ...priceChanges };
      
      energyListings.forEach(listing => {
        if (listing.isSold) return;
        
        // Random price fluctuation between -5% and +5%
        const changePercent = (Math.random() * 10 - 5) / 100;
        
        // Only update if the listing exists in our state
        if (!newPriceChanges[listing.publicKey]) {
          newPriceChanges[listing.publicKey] = {
            original: listing.price / LAMPORTS_PER_SOL,
            current: listing.price / LAMPORTS_PER_SOL,
            percentChange: 0,
            direction: 'neutral',
            lastUpdated: new Date()
          };
        } else {
          const current = newPriceChanges[listing.publicKey].current;
          const newPrice = current * (1 + changePercent);
          const percentChange = ((newPrice / newPriceChanges[listing.publicKey].original) - 1) * 100;
          
          newPriceChanges[listing.publicKey] = {
            ...newPriceChanges[listing.publicKey],
            current: newPrice,
            percentChange: percentChange,
            direction: changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'neutral',
            lastUpdated: new Date()
          };
        }
      });
      
      setPriceChanges(newPriceChanges);
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [energyListings]);

  // Fetch VC token balance
  const fetchVCTokenBalance = async (conn, walletPublicKey) => {
    try {
      console.log("Fetching VC token balance for wallet:", walletPublicKey.toString());
      
      // Get the associated token account for this wallet
      const tokenAccount = await getAssociatedTokenAddress(
        VC_TOKEN_MINT,
        walletPublicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      console.log("Token account address:", tokenAccount.toString());

      try {
        // Get account info - this will throw if the account doesn't exist
        const tokenAccountInfo = await getAccount(
          conn,
          tokenAccount,
          'confirmed',
          TOKEN_2022_PROGRAM_ID
        );
        
        // Set token balance - divide by 10^decimals to get the actual amount
        const balance = Number(tokenAccountInfo.amount) / Math.pow(10, tokenAccountInfo.decimals || 9);
        console.log("VC token balance fetched:", balance);
        setVcBalance(balance);
      } catch (error) {
        // If account doesn't exist, set balance to 0
        console.log("Token account doesn't exist or other error:", error);
        setVcBalance(0);
      }
    } catch (error) {
      console.error("Error fetching VC token balance:", error);
      setVcBalance(0);
    }
  };

  // Add additional call to fetch balance when user logs in
  useEffect(() => {
    if (connection && publicKey && userData) {
      // Refresh balances when userData is loaded
      fetchVCTokenBalance(connection, publicKey);
    }
  }, [connection, publicKey, userData]);

  // Function to buy VC tokens
  const buyVCTokens = async () => {
    if (!connection || !publicKey) {
      showNotification('Please connect wallet first.', 'error');
      return;
    }
    
    // Show input dialog for token amount
    const amount = prompt('Enter amount of VC tokens to buy:');
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      showNotification('Please enter a valid amount.', 'error');
      return;
    }
    
    const vcAmount = parseFloat(amount);
    
    // Calculate SOL cost (1 VC = 0.0001 SOL)
    const exchangeRate = 0.0001; // SOL per 1 VC
    const solCost = vcAmount * exchangeRate;
    
    // Check if user has enough SOL
    if (balance < solCost) {
      showNotification(`Insufficient SOL balance. You need ${solCost.toFixed(4)} SOL to buy ${vcAmount.toFixed(0)} VC.`, 'error');
      return;
    }
    
    setLoading(true);
    try {
      // Confirm purchase
      if (!window.confirm(`Purchase ${vcAmount.toFixed(0)} VC tokens for ${solCost.toFixed(4)} SOL?`)) {
        setLoading(false);
        return;
      }
      
      // Get the VC token mint authority (for demo purposes, we'll use a fixed authority)
      // In production, this would be securely managed
      const mintAuthority = new PublicKey("B3TDYUdCtu5xCTiWHgLUXRkWGifiTMe8ahmq75NRSFm9");
      
      // Get the associated token account for this wallet
      const tokenAccount = await getAssociatedTokenAddress(
        VC_TOKEN_MINT,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      
      // Create transaction
      const transaction = new Transaction();
      
      // Check if token account exists, if not create it
      try {
        await getAccount(
          connection,
          tokenAccount,
          'confirmed',
          TOKEN_2022_PROGRAM_ID
        );
      } catch (error) {
        // Account doesn't exist, create it
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            tokenAccount,
            publicKey,
            VC_TOKEN_MINT,
            TOKEN_2022_PROGRAM_ID
          )
        );
      }
      
      // Send SOL to the mint authority
      transaction.add(
        web3.SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: mintAuthority,
          lamports: solCost * LAMPORTS_PER_SOL
        })
      );
      
      // Send and confirm transaction
      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      
      // Refresh balances
      const walletBalance = await connection.getBalance(publicKey);
      setBalance(walletBalance / LAMPORTS_PER_SOL);
      
      // Update VC balance (simulate minting - in real implementation, the mint authority would mint tokens)
      // For this demo, we'll just update the displayed balance
      setVcBalance(vcBalance + vcAmount);
      
      showNotification(`Successfully purchased ${vcAmount.toFixed(0)} VC tokens!`, 'success');
    } catch (error) {
      console.error('Error buying VC tokens:', error);
      showNotification(`Failed to buy VC tokens: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update the fetchCertificates function for better debugging and reliability
  const fetchCertificates = async () => {
    if (!publicKey) return;
    
    try {
      // First clear the current listings to avoid stale data
      setCertificateListings([]);
      console.log("Fetching certificates for wallet:", publicKey.toString());
      console.log("User role:", userData?.role);
      
      // Get user-owned certificates
      const ownedResponse = await axios.get(`${import.meta.env.VITE_BACKEND_AI_URL}/api/certificates/by-owner/${publicKey.toString()}`);
      
      let userCertificates = [];
      if (ownedResponse.data.success) {
        userCertificates = ownedResponse.data.certificates || [];
        console.log("User owned certificates:", userCertificates.length);
      }
      
      // For all users who should see certificates, fetch all available
      let availableCertificates = [];
      if (userData?.role === 'industry' || userData?.role === 'company' || userData?.role === 'producer') {
        try {
          console.log("Fetching available certificates for user");
          const availableResponse = await axios.get(`${import.meta.env.VITE_BACKEND_AI_URL}/api/virtual-grid-pool/available-certificates`);
          
          if (availableResponse.data.success) {
            // Filter out certificates the user already owns
            const userCertIds = new Set(userCertificates.map(cert => cert.certificate_id));
            availableCertificates = (availableResponse.data.certificates || []).filter(
              cert => !userCertIds.has(cert.certificate_id)
            );
            console.log("Available certificates:", availableCertificates.length);
          }
        } catch (error) {
          console.error('Error fetching available certificates:', error);
        }
      }
      
      // Combine both sets and set state
      const combinedCertificates = [...userCertificates, ...availableCertificates];
      console.log("Combined certificates:", combinedCertificates.length);
      setCertificateListings(combinedCertificates);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    }
  };

  // Function to view certificate details
  const viewCertificateDetails = (certificate) => {
    setSelectedCertificate(certificate);
    setShowCertificateModal(true);
  };

  // Improve the claimCertificate function 
  const claimCertificate = async (certificate) => {
    if (!publicKey) {
      showNotification('Please connect wallet first.', 'error');
      return;
    }

    // Verify user has the right role
    if (userData?.role !== 'industry' && userData?.role !== 'company') {
      showNotification('Only industry or company users can claim certificates.', 'error');
      return;
    }

    setLoading(true);
    try {
      // Confirm claim with more details
      if (!window.confirm(
        `Are you sure you want to claim this certificate for ${certificate.energy_amount} kWh from ${certificate.producer_name || 'Anonymous Producer'}?\n\n` +
        `This will offset ${certificate.carbon_offset.toFixed(2)} kg of CO₂ emissions.`
      )) {
        setLoading(false);
        return;
      }
      
      // Create a transaction to sign - this will trigger the wallet popup for confirmation
      const transaction = new Transaction();
      
      // Add a simple system instruction as a placeholder
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: publicKey, // Transfer to self (0 lamports)
          lamports: 0, // No actual SOL is transferred
        })
      );
      
      // Sign the transaction to get wallet confirmation
      try {
        console.log("Sending transaction for signing...");
        const signature = await sendTransaction(transaction, connection);
        console.log("Transaction confirmed with signature:", signature);
        
        // Now call API to claim certificate
        console.log("Claiming certificate:", certificate.certificate_id);
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_AI_URL}/api/virtual-grid-pool/claim-certificate`, {
          certificate_id: certificate.certificate_id,
          claimer_wallet: publicKey.toString(),
          user_role: userData?.role,
          transaction_signature: signature // Include the signature
        });

        if (response.data.success) {
          showNotification(`Certificate claimed successfully! This offsets ${certificate.carbon_offset.toFixed(2)} kg of CO₂.`, 'success');
          // Refresh certificates
          await fetchCertificates();
        } else {
          throw new Error(response.data.error || 'Failed to claim certificate');
        }
      } catch (error) {
        console.error("Transaction or claiming error:", error);
        throw new Error(`Transaction failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error claiming certificate:', error);
      let errorMessage = error.message || 'Unknown error occurred';
      
      if (error.response && error.response.data) {
        errorMessage = error.response.data.error || errorMessage;
      }
      
      showNotification(`Failed to claim certificate: ${errorMessage}`, 'error');
    }
    setLoading(false);
  };

  // Add this useEffect to fetch certificates when userData changes
  useEffect(() => {
    if (publicKey && (userData?.role === 'industry' || userData?.role === 'company')) {
      fetchCertificates();
    }
  }, [publicKey, userData]);

  // Add a refresh function for balances
  const refreshBalances = async () => {
    if (!connection || !publicKey) return;
    
    try {
      // Refresh SOL balance
      const walletBalance = await connection.getBalance(publicKey);
      setBalance(walletBalance / LAMPORTS_PER_SOL);
      
      // Refresh VC token balance
      await fetchVCTokenBalance(connection, publicKey);
      
      console.log("Balances refreshed successfully");
    } catch (error) {
      console.error("Error refreshing balances:", error);
    }
  };

  if (loading && !userData && energyListings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-72px)]">
          <div className="text-white">Loading energy trading data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Power to the People – 5 Ways to Trade Energy</h2>
          
          {isProducer && (
            <button
              onClick={openCreateOfferModal}
              className="bg-blue-600 hover:bg-blue-500 text-white py-3 px-6 rounded-lg text-md font-medium"
            >
              Create Sale
            </button>
          )}
        </div>
        
        {notification.message && (
          <div className={`p-4 mb-6 rounded-lg ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {notification.message}
          </div>
        )}
        
        {error ? (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-400">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Account Information */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Account Information</h3>
                <button 
                  onClick={refreshBalances}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 p-1 rounded"
                  title="Refresh Balances"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              {userData && (
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400 text-sm">Email</p>
                    <p className="text-white">{userData.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Role</p>
                    <p className="text-white capitalize">{userData.role}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Wallet</p>
                    <p className="text-white font-mono text-sm truncate">
                      {userData.walletAddress || publicKey?.toString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">SOL Balance</p>
                    <p className="text-white font-mono text-sm">
                      {balance.toFixed(4)} SOL
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">VidyutChain (VC) Balance</p>
                    <p className="text-white font-mono text-sm">
                      {vcBalance !== null ? vcBalance.toFixed(4) : "Loading..."} VC
                    </p>
                  </div>
                </div>
              )}
              <div className="mt-6 flex flex-col space-y-2">
                <button
                  onClick={() => navigate('/profile')}
                  className="bg-purple-600 hover:bg-purple-500 text-white py-2 px-4 rounded text-sm"
                >
                  Edit Profile
                </button>
                <button
                  onClick={buyVCTokens}
                  className="bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded text-sm flex items-center justify-center"
                  disabled={loading || !connected}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Buy VC Tokens (1 VC = 0.0001 SOL)
                </button>
              </div>
            </div>
            
            {/* Market Overview */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 md:col-span-2">
              <h3 className="text-xl font-semibold text-white mb-4">Market Overview</h3>
              
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 mb-4">
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-yellow-300 text-sm">
                    <span className="font-medium">Dynamic Pricing: </span> 
                    Energy prices fluctuate based on real-time supply and demand, just like a stock market. Your listed offers may change in price after listing as market conditions evolve.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-700 p-4 rounded">
                  <h4 className="text-white font-medium">Current Prices</h4>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Average Price</span>
                      <span className="text-white text-sm">
                        {energyListings.length > 0 
                          ? (energyListings
                              .filter(listing => !listing.isSold) // Only consider unsold listings
                              .reduce((sum, listing) => 
                                sum + listing.pricePerKwh, 0) / 
                                Math.max(energyListings.filter(listing => !listing.isSold).length, 1)
                             ).toFixed(4) 
                          : '0.000'} VC/kWh
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Available Energy</span>
                      <span className="text-white text-sm">
                        {energyListings
                          .filter(listing => !listing.isSold)
                          .reduce((sum, listing) => sum + listing.energyAmount, 0)} kWh
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Active Listings</span>
                      <span className="text-white text-sm">
                        {energyListings.filter(listing => !listing.isSold).length}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-700 p-4 rounded">
                  <h4 className="text-white font-medium">Your Statistics</h4>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Energy Sold</span>
                      <span className="text-white text-sm">
                        {energyListings
                          .filter(listing => listing.isMine && listing.isSold)
                          .reduce((sum, listing) => sum + listing.energyAmount, 0)} kWh
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Energy Bought</span>
                      <span className="text-white text-sm">
                        {energyListings
                          .filter(listing => listing.buyer === publicKey?.toString())
                          .reduce((sum, listing) => sum + listing.energyAmount, 0)} kWh
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Active Listings</span>
                      <span className="text-white text-sm">
                        {energyListings.filter(listing => listing.isMine && !listing.isSold).length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Price Volatility</span>
                  <span className="text-white text-sm">
                    Medium (±5% daily)
                  </span>
                </div>
              </div>
            </div>

            {/* Energy Listings */}
            <div className="md:col-span-3 bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Energy Marketplace</h3>
                <div className="flex space-x-2">
                  <button 
                    className={`${activeTab === 'p2p' ? 'bg-blue-600' : 'bg-gray-600'} text-white px-4 py-2 rounded-lg text-sm`}
                    onClick={() => switchTab('p2p')}
                  >
                    P2P Listings
                  </button>
                  {(userData?.role === 'industry' || userData?.role === 'company' || userData?.role === 'producer') && (
                    <button 
                      className={`${activeTab === 'virtual' ? 'bg-purple-600' : 'bg-gray-600'} text-white px-4 py-2 rounded-lg text-sm`}
                      onClick={() => switchTab('virtual')}
                    >
                      Virtual Grid Pool
                    </button>
                  )}
                </div>
              </div>
              
              {/* Show different content based on active tab */}
              {activeTab === 'p2p' ? (
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">P2P Direct Trade Listings</h4>
              {loading && energyListings.length === 0 ? (
                <div className="flex justify-center items-center h-40">
                  <div className="text-white">Loading energy listings...</div>
                </div>
              ) : energyListings.filter(listing => !listing.isSold).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {energyListings
                    .filter(listing => !listing.isSold)
                    .map((listing) => (
                      <div
                        key={listing.publicKey}
                        className="bg-gray-700 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-medium text-white">{listing.energyAmount} kWh</h4>
                            <p className="text-sm text-gray-400 mt-1">
                              {listing.pricePerKwh.toFixed(4)} VC/kWh
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              Seller: {listing.seller.substring(0, 8)}...
                            </p>
                            {priceChanges[listing.publicKey] && (
                              <div className="flex items-center mt-1">
                                {priceChanges[listing.publicKey].direction === 'up' && (
                                  <svg className="w-3 h-3 text-green-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {priceChanges[listing.publicKey].direction === 'down' && (
                                  <svg className="w-3 h-3 text-red-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                                <span className={`text-xs ${
                                  priceChanges[listing.publicKey].direction === 'up' 
                                    ? 'text-green-400' 
                                    : priceChanges[listing.publicKey].direction === 'down' 
                                    ? 'text-red-400' 
                                    : 'text-gray-400'
                                }`}>
                                  {priceChanges[listing.publicKey].percentChange.toFixed(2)}%
                                </span>
                                <span className="text-gray-500 text-xs ml-2">
                                  Updated {new Date(priceChanges[listing.publicKey].lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-lg text-green-400">
                              {priceChanges[listing.publicKey] 
                                ? priceChanges[listing.publicKey].current.toFixed(4) 
                                : (listing.price / LAMPORTS_PER_SOL).toFixed(4)} VC
                            </p>
                            
                            {!listing.isMine ? (
                              <button
                                className={`mt-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm ${
                                  tokenTransferLoading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                onClick={() => buyEnergy(listing)}
                                disabled={loading || !connected || tokenTransferLoading}
                              >
                                {tokenTransferLoading ? 'Processing...' : 'Buy Now'}
                              </button>
                            ) : (
                              <span className="inline-block mt-2 bg-purple-900/30 text-purple-400 px-3 py-1 rounded-lg text-sm">
                                Your Listing
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex justify-center items-center h-40">
                      <p className="text-gray-400">No P2P energy listings available.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h4 className="text-lg font-medium text-white mb-4">Virtual Grid Pool Certificates</h4>
                  {loading && certificateListings.length === 0 ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="text-white">Loading certificates...</div>
                    </div>
                  ) : certificateListings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {certificateListings.map((certificate) => {
                        const isOwnedByUser = certificate.current_owner === publicKey?.toString();
                        const isProducedByUser = certificate.producer_wallet === publicKey?.toString();
                        const isClaimable = certificate.current_owner === certificate.producer_wallet && 
                                          (userData?.role === 'industry' || userData?.role === 'company');
                        
                        return (
                          <div
                            key={certificate.certificate_id}
                            className={`bg-gray-700 rounded-lg p-4 border ${isClaimable ? 'border-green-500/30' : 'border-purple-500/30'}`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center">
                                  <span className="bg-purple-900/50 text-purple-400 text-xs px-2 py-1 rounded mr-2">Virtual Grid</span>
                                  <h4 className="text-lg font-medium text-white">{certificate.energy_amount} kWh</h4>
                                </div>
                                <p className="text-sm text-gray-400 mt-1">
                                  Carbon Offset: {certificate.carbon_offset.toFixed(2)} kg CO₂
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                  Certificate ID: {certificate.certificate_id.substring(0, 8)}...
                                </p>
                                <p className="text-xs text-gray-500">
                                  {isProducedByUser ? (
                                    <span className="text-purple-400">You are the producer</span>
                                  ) : (
                                    `Producer: ${certificate.producer_name || 'Anonymous'}`
                                  )}
                                </p>
                                {isOwnedByUser && !isProducedByUser && (
                                  <p className="text-xs text-green-400 mt-1">You own this certificate</p>
                                )}
                                {isClaimable && (
                                  <p className="text-xs text-green-400 mt-1">Available for claiming</p>
                                )}
                              </div>
                              <div className="text-right">
                                <button
                                  className="mt-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm"
                                  onClick={() => viewCertificateDetails(certificate)}
                                >
                                  View Details
                                </button>
                                
                                {isClaimable && (
                                  <button
                                    className="mt-2 ml-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm"
                                    onClick={() => claimCertificate(certificate)}
                                  >
                                    Claim Certificate
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-40">
                      <p className="text-gray-400">No Virtual Grid Pool certificates available.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Transaction History */}
            <div className="md:col-span-3 bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
              <h3 className="text-xl font-semibold text-white mb-4">Transaction History</h3>
              
              {energyListings.filter(listing => listing.isSold).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-white">
                    <thead className="text-xs text-gray-400 uppercase border-b border-gray-700">
                      <tr>
                        <th className="px-4 py-3">Energy Amount</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Seller</th>
                        <th className="px-4 py-3">Buyer</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {energyListings
                        .filter(listing => listing.isSold)
                        .map((listing) => (
                          <tr key={listing.publicKey} className="border-b border-gray-700">
                            <td className="px-4 py-3">{listing.energyAmount} kWh</td>
                            <td className="px-4 py-3">{(listing.price / LAMPORTS_PER_SOL).toFixed(4)} VC</td>
                            <td className="px-4 py-3 font-mono text-xs">
                              {listing.seller.substring(0, 8)}...
                              {listing.isMine && <span className="ml-2 text-purple-400">(You)</span>}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs">
                              {listing.buyer.substring(0, 8)}...
                              {listing.buyer === publicKey?.toString() && <span className="ml-2 text-blue-400">(You)</span>}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 text-xs rounded-full bg-green-900/30 text-green-400">
                                Completed
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex justify-center items-center h-40">
                  <p className="text-gray-400">No completed transactions.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Offer Modal */}
      {showCreateOfferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md relative">
            <button 
              onClick={closeCreateOfferModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Choose How You Sell Energy</h3>
              
              {!selectedTradingMethod ? (
                <div className="space-y-4">
                  {/* P2P Direct Trade */}
                  <div 
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => selectTradingMethod('p2p')}
                  >
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-full mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">P2P Direct Trade</h4>
                        <p className="text-gray-600 text-sm">Sell directly to buyers on-chain via smart contracts</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Grid Dump */}
                  <div 
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50 opacity-80 relative"
                  >
                    <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-bl-lg rounded-tr-lg">
                      Coming Soon
                    </div>
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-full mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">Grid Dump</h4>
                        <p className="text-gray-600 text-sm">Offload surplus to nearest authorized microgrid</p>
                        <p className="text-yellow-700 text-xs mt-1">Grid integration in progress. Available soon.</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Virtual Grid Pool - only visible for producers */}
                  {userData?.role === 'producer' && (
                  <div 
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => selectTradingMethod('pool')}
                  >
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-full mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">Virtual Grid Pool</h4>
                        <p className="text-gray-600 text-sm">Stake to pooled vault with dynamic AMM pricing</p>
                          <p className="text-green-700 text-xs mt-1">Generates certificates for industry users</p>
                      </div>
                    </div>
                  </div>
                  )}
                  
                  <button 
                    onClick={closeCreateOfferModal}
                    className="w-full py-2 text-gray-600 hover:text-gray-800 text-center mt-4"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <form onSubmit={listEnergy}>
                  <div className="mb-4">
                    <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mb-4">
                      {selectedTradingMethod === 'p2p' && 'P2P Direct Trade'}
                      {selectedTradingMethod === 'grid' && 'Grid Dump'}
                      {selectedTradingMethod === 'pool' && 'Virtual Grid Pool'}
                    </div>
                    
                    <label className="block text-gray-700 text-sm font-medium mb-2">Energy Amount (kWh)</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={energyAmount}
                      onChange={(e) => setEnergyAmount(e.target.value)}
                      placeholder="Enter energy amount"
                      required
                    />
                  </div>

                  <div className="mb-2">
                    <label className="block text-gray-700 text-sm font-medium mb-2">Price (VC)</label>
                    
                    {suggestedPrice && (
                      <div className="mb-2 text-sm text-gray-600">
                        Suggested price: {suggestedPrice.toFixed(3)} VC
                      </div>
                    )}
                    
                    {energyAmount && parseFloat(energyAmount) > 0 && (
                      <div className="mb-2 text-sm text-gray-600">
                        Minimum price: {(parseFloat(energyAmount) * BASE_PRICE_PER_KWH).toFixed(3)} VC 
                        <span className="text-xs text-gray-500"> (Base rate: {BASE_PRICE_PER_KWH} VC/kWh)</span>
                      </div>
                    )}
                    
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id="useManualPrice"
                        checked={useManualPrice}
                        onChange={() => setUseManualPrice(!useManualPrice)}
                        className="mr-2"
                      />
                      <label htmlFor="useManualPrice" className="text-sm text-gray-700">
                        Set price manually
                      </label>
                    </div>
                    
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={energyPrice}
                      onChange={handlePriceInputChange}
                      placeholder="Enter price in VC"
                      required
                    />
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg mb-6">
                    <p className="text-xs text-blue-700">
                      <span className="font-semibold">Note:</span> Energy prices are dynamic and may fluctuate after listing based on market conditions, similar to stock markets. Base price will be your listing price. Payments are made in VidyutChain (VC) tokens.
                    </p>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setSelectedTradingMethod(null)}
                      className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Back
                    </button>
                    
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-lg disabled:bg-gray-400"
                      disabled={loading || !connected}
                    >
                      {loading ? 'Processing...' : 'List Energy'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Certificate Details Modal */}
      {showCertificateModal && selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg relative">
            <button 
              onClick={() => setShowCertificateModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Certificate Details</h3>
              
              <div className="bg-purple-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Certificate ID:</span>
                  <span className="text-sm font-mono text-gray-900">{selectedCertificate.certificate_id}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Energy Amount:</span>
                  <span className="text-sm text-gray-900">{selectedCertificate.energy_amount} kWh</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Carbon Offset:</span>
                  <span className="text-sm text-gray-900">{selectedCertificate.carbon_offset.toFixed(2)} kg CO₂</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Date Issued:</span>
                  <span className="text-sm text-gray-900">{new Date(selectedCertificate.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Producer:</span>
                  <span className="text-sm font-mono text-gray-900">
                    {selectedCertificate.producer_name} ({selectedCertificate.producer_wallet.substring(0, 8)}...)
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Current Owner:</span>
                  <span className="text-sm font-mono text-gray-900">{selectedCertificate.current_owner.substring(0, 8)}...</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Status:</span>
                  <span className="text-sm text-green-700 bg-green-100 px-2 py-0.5 rounded">
                    {selectedCertificate.status.charAt(0).toUpperCase() + selectedCertificate.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Claimable By:</span>
                  <span className="text-sm text-gray-900">{selectedCertificate.claimable_by.join(', ')}</span>
                </div>
              </div>
              
              {selectedCertificate.transfer_history.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Transfer History</h4>
                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                    {selectedCertificate.transfer_history.map((transfer, index) => (
                      <div key={index} className="mb-2 pb-2 border-b border-gray-200 last:border-0">
                        <div>From: {transfer.from.substring(0, 8)}...</div>
                        <div>To: {transfer.to.substring(0, 8)}...</div>
                        <div>Date: {new Date(transfer.timestamp).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowCertificateModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Close
                </button>
                
                {(userData?.role === 'industry' || userData?.role === 'company') && 
                 selectedCertificate.current_owner === selectedCertificate.producer_wallet && (
                  <button
                    onClick={() => {
                      setShowCertificateModal(false);
                      claimCertificate(selectedCertificate);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500"
                  >
                    Claim Certificate
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnergyTrading; 