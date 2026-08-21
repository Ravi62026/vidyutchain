import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const BidList = () => {
  const navigate = useNavigate();
  const { tenderId } = useParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tender, setTender] = useState(null);
  const [bids, setBids] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userData = await axios.get('/api/user/profile');
        setUser(userData.data.data);

        // Fetch tender details
        const tenderData = await axios.get(`/api/tenders/${tenderId}`);
        setTender(tenderData.data.data);

        // Fetch bids for the tender
        const bidsData = await axios.get(`/api/bids/tender/${tenderId}`);
        setBids(bidsData.data.data);
      } catch (error) {
        console.error('Error fetching data', error);
        toast.error('Failed to load data');
        navigate('/tenders');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, tenderId]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-200 text-yellow-800';
      case 'accepted':
        return 'bg-green-200 text-green-800';
      case 'rejected':
        return 'bg-red-200 text-red-800';
      case 'withdrawn':
        return 'bg-gray-200 text-gray-800';
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

  // Only admin or tender creator can view bids
  const canViewBids = user && (user.isAdmin || user.role === 'admin' || 
                             (tender && tender.createdBy && tender.createdBy._id === user._id));
  
  if (!canViewBids) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>You do not have permission to view the bids for this tender.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {tender && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Bids for "{tender.title}"</h1>
          <div className="mt-2 bg-gray-100 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700">Status: <span className="font-semibold">{tender.status.charAt(0).toUpperCase() + tender.status.slice(1)}</span></p>
                <p className="text-gray-700">Base Price: <span className="font-semibold">{tender.basePrice} USDC</span></p>
              </div>
              <div>
                <p className="text-gray-700">Start: <span className="font-semibold">{new Date(tender.startDate).toLocaleDateString()}</span></p>
                <p className="text-gray-700">End: <span className="font-semibold">{new Date(tender.endDate).toLocaleDateString()}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show info message for closed tenders */}
      {tender && tender.status === 'closed' && (
        <div className="mb-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <p>
            <strong>Note:</strong> This tender is closed. The system will automatically award 
            the bid to the highest bidder. No manual action is required.
          </p>
        </div>
      )}

      {bids.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <p className="text-gray-700">No bids have been placed for this tender yet.</p>
        </div>
      ) : (
        <div>          
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bidder</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bids.map(bid => (
                  <tr key={bid._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {bid.bidder && (
                        <div className="text-sm text-gray-900">
                          {bid.bidder.email || 'Unknown'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{bid.amount} USDC</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{new Date(bid.deliveryTimeline).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(bid.status)}`}>
                        {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => navigate(`/bids/${bid._id}`)}
                        className="text-blue-500 hover:text-blue-700 mr-3"
                      >
                        View
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
  );
};

export default BidList; 