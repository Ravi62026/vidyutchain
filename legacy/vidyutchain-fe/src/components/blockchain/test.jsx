import React, { useState, useEffect } from 'react';
import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor';
import { Buffer } from 'buffer';

// Fix for browser environment
window.Buffer = Buffer;

// Marketplace program ID from your contract
const PROGRAM_ID = new PublicKey("7qKfy4B4n2jLfwwEsTdrBniqy1vBrbiZAfx51y9Kres8");

// IDL for the marketplace program
const IDL = {"version":"0.1.0","name":"marketplace","instructions":[{"name":"listProduct","accounts":[{"name":"seller","isMut":true,"isSigner":true},{"name":"product","isMut":true,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[{"name":"productName","type":"string"},{"name":"price","type":"u64"}]},{"name":"buyProduct","accounts":[{"name":"buyer","isMut":true,"isSigner":true},{"name":"product","isMut":true,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[]}],"accounts":[{"name":"Product","type":{"kind":"struct","fields":[{"name":"seller","type":"publicKey"},{"name":"buyer","type":{"option":"publicKey"}},{"name":"productName","type":"string"},{"name":"price","type":"u64"},{"name":"isSold","type":"bool"}]}}],"errors":[{"code":6000,"name":"AlreadySold","msg":"Product has already been sold."}]}

function Text() {
  const [wallet, setWallet] = useState(null);
  const [connection, setConnection] = useState(null);
  const [program, setProgram] = useState(null);
  const [balance, setBalance] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });

  // Form state
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');

  // Initialize connection and program
  useEffect(() => {
    const initConnection = async () => {
      if (window.solana && window.solana.isPhantom) {
        try {
          // Connect to Phantom wallet
          await window.solana.connect();
          const phantomWallet = window.solana;
          setWallet(phantomWallet);

          // Setup connection
          const conn = new Connection(clusterApiUrl('devnet'), 'confirmed');
          setConnection(conn);

          // Create provider and program
          const provider = new AnchorProvider(
            conn,
            phantomWallet,
            { preflightCommitment: 'confirmed' }
          );

          const prog = new Program(IDL, PROGRAM_ID, provider);
          setProgram(prog);

          // Get wallet balance
          const walletBalance = await conn.getBalance(new PublicKey(phantomWallet.publicKey.toString()));
          setBalance(walletBalance / LAMPORTS_PER_SOL);

          showNotification('Wallet connected successfully!', 'success');
          fetchProducts(conn, prog, phantomWallet.publicKey);
        } catch (error) {
          console.error('Connection error:', error);
          showNotification('Failed to connect wallet.', 'error');
        }
      } else {
        showNotification('Phantom wallet not found. Please install it.', 'error');
      }
    };

    initConnection();
  }, []);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 5000);
  };

  const fetchProducts = async (conn, prog, publicKey) => {
    if (!conn || !prog) return;

    setLoading(true);
    try {
      // This is a simplified approach - in a real app, you'd likely need to use getProgramAccounts with filters
      // to efficiently fetch products
      const accounts = await prog.account.product.all();
      setProducts(accounts.map(account => ({
        ...account.account,
        publicKey: account.publicKey.toString(),
        seller: account.account.seller.toString(),
        buyer: account.account.buyer ? account.account.buyer.toString() : null,
        isMine: account.account.seller.toString() === publicKey.toString()
      })));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      showNotification('Failed to fetch products.', 'error');
      setLoading(false);
    }
  };

  const listProduct = async (e) => {
    e.preventDefault();
    if (!program || !wallet || !productName || !price) {
      showNotification('Please fill all fields and connect wallet.', 'error');
      return;
    }

    setLoading(true);
    try {
      // Calculate product PDA (same as in your contract)
      const [productPDA] = await web3.PublicKey.findProgramAddress(
        [
          Buffer.from(productName),
          wallet.publicKey.toBuffer()
        ],
        program.programId
      );

      // Execute the listProduct instruction
      const tx = await program.rpc.listProduct(
        productName,
        new BN(parseFloat(price) * LAMPORTS_PER_SOL),
        {
          accounts: {
            seller: wallet.publicKey,
            product: productPDA,
            systemProgram: web3.SystemProgram.programId,
          },
        }
      );

      showNotification(`Product listed successfully! Tx: ${tx.substring(0, 8)}...`, 'success');
      setProductName('');
      setPrice('');

      // Refresh product list
      await fetchProducts(connection, program, wallet.publicKey);
    } catch (error) {
      console.error('Error listing product:', error);
      showNotification(`Failed to list product: ${error.message}`, 'error');
    }
    setLoading(false);
  };

  const buyProduct = async (product) => {
    if (!program || !wallet) {
      showNotification('Please connect wallet first.', 'error');
      return;
    }

    setLoading(true);
    try {
      // Buy the product
      const tx = await program.rpc.buyProduct(
        {
          accounts: {
            buyer: wallet.publicKey,
            product: new PublicKey(product.publicKey),
            systemProgram: web3.SystemProgram.programId,
          },
        }
      );

      showNotification(`Product purchased successfully! Tx: ${tx.substring(0, 8)}...`, 'success');

      // Refresh product list
      await fetchProducts(connection, program, wallet.publicKey);
    } catch (error) {
      console.error('Error buying product:', error);
      showNotification(`Failed to buy product: ${error.message}`, 'error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-indigo-600">Solana Marketplace</h1>

            <div className="flex items-center space-x-2">
              {wallet ? (
                <div className="flex items-center bg-gray-100 rounded-lg p-2">
                  <div className="mr-2">
                    <p className="text-sm font-medium text-gray-600">Connected:</p>
                    <p className="text-xs text-gray-500">{wallet.publicKey.toString().substring(0, 8)}...</p>
                  </div>
                  <div className="bg-green-100 px-3 py-1 rounded-lg">
                    <p className="text-sm font-medium text-green-800">{balance.toFixed(4)} SOL</p>
                  </div>
                </div>
              ) : (
                <button
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  onClick={() => window.solana && window.solana.connect()}
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </header>

        {notification.message && (
          <div className={`p-4 mb-6 rounded-lg ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {notification.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* List Product Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">List a New Product</h2>
            <form onSubmit={listProduct}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">Product Name</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">Price (SOL)</label>
                <input
                  type="number"
                  step="0.001"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter price in SOL"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                disabled={loading || !wallet}
              >
                {loading ? 'Processing...' : 'List Product'}
              </button>
            </form>
          </div>

          {/* Product List */}
          <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Available Products</h2>

            {loading ? (
              <div className="flex justify-center items-center h-40">
                <p className="text-gray-500">Loading products...</p>
              </div>
            ) : products.length > 0 ? (
              <div className="space-y-4">
                {products.map((product) => (
                  <div
                    key={product.publicKey}
                    className={`border ${product.isSold ? 'bg-gray-50' : 'bg-white'} rounded-lg p-4`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-lg">{product.productName}</h3>
                        <p className="text-sm text-gray-500">
                          Seller: {product.seller.substring(0, 8)}...
                        </p>
                        {product.buyer && (
                          <p className="text-sm text-gray-500">
                            Buyer: {product.buyer.substring(0, 8)}...
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="font-medium text-lg text-indigo-600">
                          {(product.price / LAMPORTS_PER_SOL).toFixed(4)} SOL
                        </p>

                        {!product.isSold && !product.isMine && (
                          <button
                            className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                            onClick={() => buyProduct(product)}
                            disabled={loading || !wallet}
                          >
                            Buy Now
                          </button>
                        )}

                        {product.isSold && (
                          <span className="inline-block mt-2 bg-gray-200 text-gray-800 px-3 py-1 rounded-lg text-sm">
                            Sold
                          </span>
                        )}

                        {product.isMine && !product.isSold && (
                          <span className="inline-block mt-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm">
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
                <p className="text-gray-500">No products available.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Text;