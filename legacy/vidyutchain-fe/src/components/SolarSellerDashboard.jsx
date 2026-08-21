import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import TokenBalances from './TokenBalances';
import WalletActivity from './WalletActivity';

const SolarSellerDashboard = () => {
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [products, setProducts] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [activeTab, setActiveTab] = useState('products');
  
  // Form state for adding/editing product
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    capacity: '',
    price: 0,
    priceInSOL: 0,
    panels: 0,
    features: [''],
    imageUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [installationDetails, setInstallationDetails] = useState(null);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/profile`, {
          method: 'GET',
          credentials: 'include'
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            navigate('/');
            return;
          }
          throw new Error('Failed to load user data');
        }
        
        const data = await response.json();
        if (data.success) {
          // Check if user is a solar seller
          if (data.user.role !== 'solar-seller' && !data.user.isAdmin) {
            navigate('/dashboard');
            return;
          }
          
          setUserData(data.user);
          await fetchSellerProducts();
          await fetchInstallationRequests();
        } else {
          throw new Error(data.error || 'Failed to load user data');
        }
      } catch (error) {
        console.error('Solar Seller Dashboard error:', error);
        setError(error.message || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [navigate]);
  
  const fetchSellerProducts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/solar/seller/products`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load products');
      }
      
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      } else {
        throw new Error(data.error || 'Failed to load products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error.message || 'Failed to load products');
    }
  };
  
  const fetchInstallationRequests = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/solar/installations`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load installation requests');
      }
      
      const data = await response.json();
      if (data.success) {
        setInstallations(data.installations);
      } else {
        throw new Error(data.error || 'Failed to load installation requests');
      }
    } catch (error) {
      console.error('Error fetching installation requests:', error);
      setError(error.message || 'Failed to load installation requests');
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFeaturesChange = (index, value) => {
    const updatedFeatures = [...productForm.features];
    updatedFeatures[index] = value;
    setProductForm(prev => ({
      ...prev,
      features: updatedFeatures
    }));
  };
  
  const addFeatureField = () => {
    setProductForm(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };
  
  const removeFeatureField = (index) => {
    if (productForm.features.length <= 1) return;
    
    const updatedFeatures = [...productForm.features];
    updatedFeatures.splice(index, 1);
    setProductForm(prev => ({
      ...prev,
      features: updatedFeatures
    }));
  };
  
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      capacity: product.capacity,
      price: product.price,
      priceInSOL: product.priceInSOL,
      panels: product.panels,
      features: [...product.features],
      imageUrl: product.imageUrl
    });
    setShowProductForm(true);
  };
  
  const handleAddNewProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      capacity: '',
      price: 0,
      priceInSOL: 0,
      panels: 0,
      features: [''],
      imageUrl: ''
    });
    setShowProductForm(true);
  };
  
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/solar/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete product');
      }
      
      // Refresh products list
      await fetchSellerProducts();
      
    } catch (error) {
      console.error('Error deleting product:', error);
      setError(error.message || 'Failed to delete product');
    }
  };
  
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    
    // Simple validation
    if (!productForm.name || !productForm.capacity || !productForm.imageUrl) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const payload = {
        ...productForm,
        // Convert string numbers to actual numbers
        price: Number(productForm.price),
        priceInSOL: Number(productForm.priceInSOL),
        panels: Number(productForm.panels),
        // Filter out empty features
        features: productForm.features.filter(f => f.trim() !== '')
      };
      
      let response;
      
      if (editingProduct) {
        // Update existing product
        response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/solar/products/${editingProduct._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(payload)
        });
      } else {
        // Create new product
        response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/solar/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(payload)
        });
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save product');
      }
      
      // Close form and refresh products
      setShowProductForm(false);
      await fetchSellerProducts();
      
    } catch (error) {
      console.error('Error saving product:', error);
      setError(error.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleUpdateInstallationStatus = async (installationId, newStatus) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/solar/installations/${installationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update installation status');
      }
      
      // Refresh installation requests
      await fetchInstallationRequests();
      
    } catch (error) {
      console.error('Error updating installation status:', error);
      setError(error.message || 'Failed to update installation status');
    }
  };
  
  const viewInstallationDetails = (installation) => {
    setInstallationDetails(installation);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-72px)]">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Solar Seller Dashboard</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded ${
                activeTab === 'products' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              My Products
            </button>
            <button
              onClick={() => setActiveTab('installations')}
              className={`px-4 py-2 rounded ${
                activeTab === 'installations' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Installation Requests
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`px-4 py-2 rounded ${
                activeTab === 'wallet' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Wallet
            </button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-400 mb-6">
            {error}
          </div>
        )}
        
        {/* Wallet Tab */}
        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <TokenBalances />
            </div>
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <WalletActivity />
            </div>
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 md:col-span-2">
              <h3 className="text-xl font-semibold text-white mb-4">Account Information</h3>
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
                      {userData.walletAddress}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            {!showProductForm && (
              <div className="mb-6 flex justify-end">
                <button
                  onClick={handleAddNewProduct}
                  className="bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded"
                >
                  Add New Product
                </button>
              </div>
            )}
            
            {showProductForm ? (
              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-white">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>
                  <button
                    onClick={() => setShowProductForm(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    &times; Cancel
                  </button>
                </div>
                
                <form onSubmit={handleSubmitProduct} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 mb-1">Product Name*</label>
                      <input
                        type="text"
                        name="name"
                        value={productForm.name}
                        onChange={handleInputChange}
                        className="w-full bg-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 mb-1">Capacity* (e.g. "5 kW")</label>
                      <input
                        type="text"
                        name="capacity"
                        value={productForm.capacity}
                        onChange={handleInputChange}
                        className="w-full bg-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 mb-1">Price in USD*</label>
                      <input
                        type="number"
                        name="price"
                        value={productForm.price}
                        onChange={handleInputChange}
                        className="w-full bg-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 mb-1">Price in SOL*</label>
                      <input
                        type="number"
                        name="priceInSOL"
                        value={productForm.priceInSOL}
                        onChange={handleInputChange}
                        className="w-full bg-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        step="0.1"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 mb-1">Number of Panels*</label>
                      <input
                        type="number"
                        name="panels"
                        value={productForm.panels}
                        onChange={handleInputChange}
                        className="w-full bg-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 mb-1">Image URL*</label>
                      <input
                        type="text"
                        name="imageUrl"
                        value={productForm.imageUrl}
                        onChange={handleInputChange}
                        className="w-full bg-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="https://example.com/image.jpg"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 mb-1">Description*</label>
                    <textarea
                      name="description"
                      value={productForm.description}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows="3"
                      required
                    ></textarea>
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 mb-2">Features*</label>
                    {productForm.features.map((feature, index) => (
                      <div key={index} className="flex mb-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => handleFeaturesChange(index, e.target.value)}
                          className="flex-1 bg-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder={`Feature ${index + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeFeatureField(index)}
                          className="ml-2 bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded"
                        >
                          -
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addFeatureField}
                      className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm"
                    >
                      + Add Feature
                    </button>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`${
                        submitting ? 'bg-gray-500' : 'bg-purple-600 hover:bg-purple-500'
                      } text-white py-2 px-6 rounded font-medium`}
                    >
                      {submitting ? 'Saving...' : 'Save Product'}
                    </button>
                  </div>
                </form>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <p className="text-gray-300 mb-4">You haven't listed any solar products yet.</p>
                <button
                  onClick={handleAddNewProduct}
                  className="bg-purple-600 hover:bg-purple-500 text-white py-2 px-6 rounded"
                >
                  Add Your First Product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <div key={product._id} className="bg-gray-800 rounded-lg overflow-hidden">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {product.name}
                      </h3>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-400">{product.capacity}</span>
                        <span className="text-purple-400 font-medium">
                          {product.priceInSOL} SOL
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mb-4">
                        {product.panels} panels
                      </p>
                      <div className="flex space-x-2 mt-4">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 px-3 rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 px-3 rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Installations Tab */}
        {activeTab === 'installations' && (
          <div>
            {installationDetails ? (
              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-white">
                    Installation Request Details
                  </h3>
                  <button
                    onClick={() => setInstallationDetails(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    &times; Back to List
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-medium text-white mb-3">Product Information</h4>
                    <div className="bg-gray-700 rounded-lg p-4 mb-4">
                      <p className="text-white font-medium mb-1">{installationDetails.product.name}</p>
                      <p className="text-gray-300 mb-1">Capacity: {installationDetails.product.capacity}</p>
                      <p className="text-gray-300 mb-1">Panels: {installationDetails.product.panels}</p>
                      <p className="text-purple-400 font-medium">Price: {installationDetails.product.priceInSOL} SOL</p>
                    </div>
                    
                    <h4 className="text-lg font-medium text-white mb-3">Customer Information</h4>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-300 mb-1">Customer: {installationDetails.customer.email}</p>
                      <p className="text-gray-300 mb-1">Wallet: {installationDetails.customer.walletAddress.slice(0, 8)}...</p>
                      <p className="text-gray-300 mb-1">Contact: {installationDetails.contactNumber}</p>
                      <p className="text-gray-300">Installation Address: {installationDetails.installationAddress}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-medium text-white mb-3">Status Information</h4>
                    <div className="bg-gray-700 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-gray-300">Current Status:</p>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                          ${installationDetails.status === 'pending' ? 'bg-yellow-800 text-yellow-300' : 
                            installationDetails.status === 'approved' ? 'bg-green-800 text-green-300' : 
                            installationDetails.status === 'rejected' ? 'bg-red-800 text-red-300' : 
                            installationDetails.status === 'completed' ? 'bg-blue-800 text-blue-300' : 
                            'bg-gray-800 text-gray-300'}`}
                        >
                          {installationDetails.status.charAt(0).toUpperCase() + installationDetails.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-300 mb-1">Payment Status: {installationDetails.paymentStatus}</p>
                      <p className="text-gray-300 mb-1">Requested: {new Date(installationDetails.createdAt).toLocaleString()}</p>
                      {installationDetails.scheduledDate && (
                        <p className="text-gray-300">Scheduled: {new Date(installationDetails.scheduledDate).toLocaleString()}</p>
                      )}
                    </div>
                    
                    <h4 className="text-lg font-medium text-white mb-3">Update Status</h4>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <button
                          onClick={() => handleUpdateInstallationStatus(installationDetails._id, 'approved')}
                          disabled={installationDetails.status === 'approved'}
                          className={`${
                            installationDetails.status === 'approved' 
                              ? 'bg-gray-600 cursor-not-allowed' 
                              : 'bg-green-600 hover:bg-green-500'
                          } text-white py-2 px-3 rounded text-sm`}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateInstallationStatus(installationDetails._id, 'rejected')}
                          disabled={installationDetails.status === 'rejected'}
                          className={`${
                            installationDetails.status === 'rejected' 
                              ? 'bg-gray-600 cursor-not-allowed' 
                              : 'bg-red-600 hover:bg-red-500'
                          } text-white py-2 px-3 rounded text-sm`}
                        >
                          Reject
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <button
                          onClick={() => handleUpdateInstallationStatus(installationDetails._id, 'completed')}
                          disabled={installationDetails.status === 'completed'}
                          className={`${
                            installationDetails.status === 'completed' 
                              ? 'bg-gray-600 cursor-not-allowed' 
                              : 'bg-blue-600 hover:bg-blue-500'
                          } text-white py-2 px-3 rounded text-sm`}
                        >
                          Mark as Completed
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : installations.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <p className="text-white mb-2 text-lg">No installation requests yet</p>
                <p className="text-gray-400">
                  Once customers request installations for your products, they will appear here.
                </p>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {installations.map((installation) => (
                        <tr key={installation._id} className="hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">
                              {installation.customer.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">
                              {installation.product.name}
                            </div>
                            <div className="text-sm text-gray-400">
                              {installation.product.capacity}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${installation.status === 'pending' ? 'bg-yellow-800 text-yellow-300' : 
                                installation.status === 'approved' ? 'bg-green-800 text-green-300' : 
                                installation.status === 'rejected' ? 'bg-red-800 text-red-300' : 
                                installation.status === 'completed' ? 'bg-blue-800 text-blue-300' : 
                                'bg-gray-800 text-gray-300'}`}
                            >
                              {installation.status.charAt(0).toUpperCase() + installation.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {new Date(installation.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => viewInstallationDetails(installation)}
                              className="text-purple-400 hover:text-purple-300"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SolarSellerDashboard; 