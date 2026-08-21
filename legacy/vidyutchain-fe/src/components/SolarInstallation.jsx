import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const SolarInstallation = () => {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [installationAddress, setInstallationAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [solarProducts, setSolarProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [installations, setInstallations] = useState([]);
  const [loadingInstallations, setLoadingInstallations] = useState(false);
  const [showInstallations, setShowInstallations] = useState(false);

  // Fetch user data and solar products
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
          setUserData(data.user);
        } else {
          throw new Error(data.error || 'Failed to load user data');
        }
      } catch (error) {
        console.error('Solar Installation error:', error);
        setError(error.message || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    const fetchSolarProducts = async () => {
      try {
        setLoadingProducts(true);
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/solar/products`, {
          method: 'GET',
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to load solar products');
        }
        
        const data = await response.json();
        if (data.success) {
          setSolarProducts(data.products);
        } else {
          throw new Error(data.error || 'Failed to load solar products');
        }
      } catch (error) {
        console.error('Error fetching solar products:', error);
        setError(error.message || 'Failed to load solar products');
      } finally {
        setLoadingProducts(false);
      }
    };

    if (connected) {
      fetchUserData();
      fetchSolarProducts();
    } else {
      navigate('/');
    }
  }, [connected, navigate]);

  // Fetch installation requests when needed
  const fetchInstallationRequests = async () => {
    try {
      setLoadingInstallations(true);
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
    } finally {
      setLoadingInstallations(false);
    }
  };

  const handleSelectPackage = (packageId) => {
    const selected = solarProducts.find(pkg => pkg._id === packageId);
    setSelectedPackage(selected);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRequestInstallation = () => {
    // Validate inputs
    if (!installationAddress.trim()) {
      setError('Please enter an installation address');
      return;
    }
    
    if (!contactNumber.trim()) {
      setError('Please enter a contact number');
      return;
    }
    
    // Show confirmation
    setError(null);
    setShowConfirmation(true);
  };

  const handleConfirmInstallation = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/solar/installations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          productId: selectedPackage._id,
          installationAddress,
          contactNumber
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit installation request');
      }

      if (data.success) {
        alert(`Thank you for your order! Your installation request has been received. The seller will contact you soon.`);
        setSelectedPackage(null);
        setShowConfirmation(false);
        setInstallationAddress('');
        setContactNumber('');
        // Fetch the updated list of installations
        await fetchInstallationRequests();
        setShowInstallations(true);
      } else {
        throw new Error(data.error || 'Failed to submit installation request');
      }
    } catch (error) {
      console.error('Error submitting installation request:', error);
      setError(error.message || 'Failed to submit installation request');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleInstallations = async () => {
    if (!showInstallations || installations.length === 0) {
      await fetchInstallationRequests();
    }
    setShowInstallations(!showInstallations);
  };

  if (loading || loadingProducts) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-72px)]">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  // Fallback if no products are available
  if (solarProducts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-white mb-6">Solar Panel Installation</h2>
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-white text-lg">No solar packages are available at the moment. Please check back later.</p>
            {userData?.role === 'solar-seller' && (
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-4 bg-purple-600 hover:bg-purple-500 text-white py-2 px-6 rounded"
              >
                Add Your Products
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Solar Panel Installation</h2>
          <button
            onClick={toggleInstallations}
            className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded"
          >
            {showInstallations ? "Browse Products" : "My Installation Requests"}
          </button>
        </div>
        
        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-400 mb-6">
            {error}
          </div>
        )}
        
        {/* Loading indicator for installations */}
        {loadingInstallations && (
          <div className="bg-gray-800 rounded-lg p-6 text-center mb-6">
            <p className="text-white">Loading installation requests...</p>
          </div>
        )}

        {/* Show installation requests if toggled */}
        {showInstallations && !loadingInstallations && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">My Installation Requests</h3>
            
            {installations.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <p className="text-white">You don't have any installation requests yet.</p>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {installations.map((installation) => (
                        <tr key={installation._id} className="hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">{installation.product.name}</div>
                            <div className="text-sm text-gray-400">{installation.product.capacity}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-purple-400">{installation.product.priceInSOL} SOL</div>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
        
        {!showInstallations && selectedPackage ? (
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-semibold text-white mb-4">{selectedPackage.name}</h3>
              <button 
                onClick={() => setSelectedPackage(null)}
                className="text-gray-400 hover:text-white"
              >
                &times; Close
              </button>
            </div>
            
            {showConfirmation ? (
              <div className="space-y-6">
                <div className="bg-green-900/30 border border-green-800 rounded-lg p-4 text-green-400">
                  <h4 className="font-medium mb-2">Confirm Your Installation</h4>
                  <p>You are about to request installation of the {selectedPackage.name} ({selectedPackage.capacity}) for {selectedPackage.priceInSOL} SOL.</p>
                  <p className="mt-2">Installation Address: {installationAddress}</p>
                  <p>Contact Number: {contactNumber}</p>
                </div>
                
                <div className="flex space-x-4">
                  <button
                    onClick={handleConfirmInstallation}
                    disabled={submitting}
                    className={`${
                      submitting ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-500'
                    } text-white py-2 px-6 rounded font-medium flex items-center`}
                  >
                    {submitting ? 'Processing...' : 'Confirm Installation'}
                  </button>
                  <button
                    onClick={() => setShowConfirmation(false)}
                    disabled={submitting}
                    className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-6 rounded font-medium"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <img 
                      src={selectedPackage.imageUrl} 
                      alt={selectedPackage.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="bg-gray-700 p-3 rounded">
                        <p className="text-gray-400 text-sm">Capacity</p>
                        <p className="text-white font-medium">{selectedPackage.capacity}</p>
                      </div>
                      <div className="bg-gray-700 p-3 rounded">
                        <p className="text-gray-400 text-sm">Price</p>
                        <p className="text-white font-medium">{selectedPackage.priceInSOL} SOL</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-medium text-white mb-3">Package Features</h4>
                    <ul className="space-y-2">
                      {selectedPackage.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="mt-6 space-y-4">
                      <div>
                        <label className="block text-gray-300 mb-1">Installation Address</label>
                        <input
                          type="text"
                          value={installationAddress}
                          onChange={(e) => setInstallationAddress(e.target.value)}
                          className="w-full bg-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Enter your full address"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-300 mb-1">Contact Number</label>
                        <input
                          type="text"
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          className="w-full bg-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={handleRequestInstallation}
                      className="mt-6 bg-purple-600 hover:bg-purple-500 text-white py-2 px-6 rounded font-medium w-full"
                    >
                      Request Installation
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          !showInstallations && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {solarProducts.map(pkg => (
                <div key={pkg._id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                  <img 
                    src={pkg.imageUrl} 
                    alt={pkg.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white mb-2">{pkg.name}</h3>
                    <div className="flex justify-between mb-4">
                      <span className="text-gray-400">{pkg.capacity}</span>
                      <span className="text-purple-400 font-medium">{pkg.priceInSOL} SOL</span>
                    </div>
                    <p className="text-gray-300 text-sm mb-4">{pkg.panels} panels</p>
                    <ul className="space-y-2 mb-6">
                      {pkg.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-start text-sm">
                          <svg className="h-4 w-4 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleSelectPackage(pkg._id)}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 px-4 rounded text-sm transition-colors"
                    >
                      Select Package
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default SolarInstallation;
