import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import toast from 'react-hot-toast';
import { signMessageWithPhantom, createGridTenderingMessage } from '../utils/walletUtils';

const GridRegistration = () => {
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: '',
    description: '',
    specifications: {
      voltage: '',
      frequency: ''
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSpecChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      specifications: {
        ...formData.specifications,
        [name]: value
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!connected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create message for signing
      const message = createGridTenderingMessage('create', 'grid');
      
      // Sign message with Phantom wallet
      const { signature } = await signMessageWithPhantom(message);
      
      // Prepare data for API request
      const payload = {
        ...formData,
        capacity: parseFloat(formData.capacity),
        walletAddress: publicKey.toString(),
        message,
        transactionSignature: signature
      };
      
      // Make API request
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/grids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Grid registered successfully');
        navigate('/grid-tendering');
      } else {
        toast.error(data.message || 'Failed to register grid');
      }
    } catch (error) {
      console.error('Error registering grid:', error);
      toast.error(error.message || 'An error occurred while registering the grid');
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-md">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Wallet Connection Required</h2>
          <p className="mb-4 text-gray-600">Please connect your wallet to register a new grid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <h2 className="text-xl font-bold mb-4">Register New Grid</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Grid Name
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="name"
            name="name"
            type="text"
            placeholder="Grid Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location">
            Location
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="location"
            name="location"
            type="text"
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="capacity">
            Capacity (MW)
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="capacity"
            name="capacity"
            type="number"
            placeholder="Capacity"
            value={formData.capacity}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
            Description
          </label>
          <textarea
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="description"
            name="description"
            placeholder="Description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            required
          ></textarea>
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Specifications
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm mb-1" htmlFor="voltage">
                Voltage (kV)
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="voltage"
                name="voltage"
                type="text"
                placeholder="Voltage"
                value={formData.specifications.voltage}
                onChange={handleSpecChange}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm mb-1" htmlFor="frequency">
                Frequency (Hz)
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="frequency"
                name="frequency"
                type="text"
                placeholder="Frequency"
                value={formData.specifications.frequency}
                onChange={handleSpecChange}
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <button
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register Grid'}
          </button>
          <div className="text-sm text-gray-600">
            <p>Connected wallet: {publicKey?.toString().slice(0, 6)}...{publicKey?.toString().slice(-4)}</p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default GridRegistration;