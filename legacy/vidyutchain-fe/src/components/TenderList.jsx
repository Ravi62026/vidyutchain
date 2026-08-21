import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const TenderList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tenders, setTenders] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userData = await axios.get('/api/user/profile');
        setUser(userData.data.data);

        // Fetch tenders
        const tendersData = await axios.get('/api/tenders');
        setTenders(tendersData.data.data);
      } catch (error) {
        console.error('Error fetching data', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleOpenTender = async (tenderId) => {
    setActionLoading(true);
    try {
      // Check if Phantom wallet is available
      const { solana } = window;
      if (!solana || !solana.isPhantom) {
        toast.error('Phantom wallet is not installed');
        setActionLoading(false);
        return;
      }

      // Connect to wallet if not connected
      try {
        await solana.connect();
      } catch (err) {
        toast.error('Failed to connect to Phantom wallet');
        setActionLoading(false);
        return;
      }

      // Create message to sign
      const message = `OPEN TENDER ${tenderId} at ${new Date().toISOString()}`;
      const encodedMessage = new TextEncoder().encode(message);

      // Request signature from wallet
      const { signature } = await solana.signMessage(encodedMessage, 'utf8');
      const signatureBase58 = Array.from(signature).toString();

      // Submit data with signature
      const response = await axios.put(`/api/tenders/${tenderId}/open`, {
        message,
        transactionSignature: signatureBase58
      });
      
      if (response.data.success) {
        toast.success('Tender opened successfully');
        
        // Update tenders state
        setTenders(prevTenders => 
          prevTenders.map(tender => 
            tender._id === tenderId ? { ...tender, status: 'open' } : tender
          )
        );
      } else {
        toast.error(response.data.message || 'Failed to open tender');
      }
    } catch (error) {
      console.error('Error opening tender', error);
      toast.error(error.response?.data?.message || 'Failed to open tender');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseTender = async (tenderId) => {
    setActionLoading(true);
    try {
      // Check if Phantom wallet is available
      const { solana } = window;
      if (!solana || !solana.isPhantom) {
        toast.error('Phantom wallet is not installed');
        setActionLoading(false);
        return;
      }

      // Connect to wallet if not connected
      try {
        await solana.connect();
      } catch (err) {
        toast.error('Failed to connect to Phantom wallet');
        setActionLoading(false);
        return;
      }

      // Create message to sign
      const message = `CLOSE TENDER ${tenderId} at ${new Date().toISOString()}`;
      const encodedMessage = new TextEncoder().encode(message);

      // Request signature from wallet
      const { signature } = await solana.signMessage(encodedMessage, 'utf8');
      const signatureBase58 = Array.from(signature).toString();

      // Submit data with signature
      const response = await axios.put(`/api/tenders/${tenderId}/close`, {
        message,
        transactionSignature: signatureBase58
      });
      
      if (response.data.success) {
        toast.success('Tender closed successfully');
        
        // Update tenders state
        setTenders(prevTenders => 
          prevTenders.map(tender => 
            tender._id === tenderId ? { ...tender, status: 'closed' } : tender
          )
        );
      } else {
        toast.error(response.data.message || 'Failed to close tender');
      }
    } catch (error) {
      console.error('Error closing tender', error);
      toast.error(error.response?.data?.message || 'Failed to close tender');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-200 text-gray-800';
      case 'open':
        return 'bg-green-200 text-green-800';
      case 'closed':
        return 'bg-yellow-200 text-yellow-800';
      case 'awarded':
        return 'bg-blue-200 text-blue-800';
      case 'cancelled':
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tenders</h1>
        {user && (user.isAdmin || user.role === 'admin') && (
          <Link 
            to="/tenders/create" 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Create Tender
          </Link>
        )}
      </div>

      {tenders.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <p className="text-gray-700">No tenders available.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tenders.map(tender => (
            <div key={tender._id} className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold truncate">{tender.title}</h2>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(tender.status)}`}>
                    {tender.status.charAt(0).toUpperCase() + tender.status.slice(1)}
                  </span>
                </div>
                <p className="text-gray-600 mt-2 text-sm">
                  {tender.description.length > 100 
                    ? `${tender.description.substring(0, 100)}...` 
                    : tender.description}
                </p>
                <div className="mt-3 text-sm">
                  <p><span className="font-medium">Base Price:</span> {tender.basePrice} USDC</p>
                  <p><span className="font-medium">Start:</span> {new Date(tender.startDate).toLocaleDateString()}</p>
                  <p><span className="font-medium">End:</span> {new Date(tender.endDate).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="border-t px-4 py-3 bg-gray-50 flex justify-between">
                <button
                  onClick={() => navigate(`/tenders/${tender._id}`)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  View Details
                </button>
                
                <div className="space-x-2">
                  {user && (user.isAdmin || user.role === 'admin') && tender.status === 'draft' && (
                    <button
                      onClick={() => handleOpenTender(tender._id)}
                      disabled={actionLoading}
                      className={`text-green-500 hover:text-green-700 ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Open Tender
                    </button>
                  )}
                  
                  {user && (user.isAdmin || user.role === 'admin') && tender.status === 'open' && (
                    <button
                      onClick={() => handleCloseTender(tender._id)}
                      disabled={actionLoading}
                      className={`text-yellow-500 hover:text-yellow-700 ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Close Tender
                    </button>
                  )}
                  
                  {user && user.role === 'bidder' && tender.status === 'open' && (
                    <Link 
                      to={`/tenders/${tender._id}/bid`}
                      className="text-green-500 hover:text-green-700"
                    >
                      Place Bid
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TenderList; 