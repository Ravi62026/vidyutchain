import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaArrowLeft, FaEye } from 'react-icons/fa';
import LoadingSpinner from './LoadingSpinner';

const AdminBids = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  const fetchBids = async (page = 1, status = 'all', search = '') => {
    setLoading(true);
    try {
      let url = `${import.meta.env.VITE_BACKEND_URL}/api/bids/all?page=${page}&limit=10`;
      
      if (status !== 'all') {
        url += `&status=${status}`;
      }
      
      if (search) {
        url += `&search=${search}`;
      }
      
      const response = await axios.get(url, { withCredentials: true });
      
      if (response.data.success) {
        setBids(response.data.data);
        setTotalPages(Math.ceil(response.data.total / 10));
      } else {
        setError('Failed to fetch bids');
        toast.error('Failed to fetch bids');
      }
    } catch (err) {
      console.error('Error fetching bids:', err);
      setError('Error fetching bids: ' + (err.response?.data?.message || err.message));
      toast.error('Error fetching bids');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids(currentPage, statusFilter, searchTerm);
  }, [currentPage, statusFilter, searchTerm]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBids(1, statusFilter, searchTerm);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-600';
      case 'accepted':
        return 'bg-green-500/20 text-green-300 border-green-600';
      case 'rejected':
        return 'bg-red-500/20 text-red-300 border-red-600';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-600';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">All Bids</h2>
          <p className="text-gray-400">Manage all bids in the system</p>
        </div>
        <button
          onClick={() => navigate('/grid-tendering/tenders')}
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
        >
          <FaArrowLeft /> Back to Tenders
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
        <div className="flex-1">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Search by tender title or bidder..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg"
            >
              Search
            </button>
          </form>
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={handleStatusChange}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-400">
          <p>{error}</p>
        </div>
      ) : bids.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-400 text-lg">No bids found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-800/70 border-b border-gray-700">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Tender</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Bidder</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Timeline</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Submitted</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bids.map((bid) => (
                  <tr key={bid._id} className="border-b border-gray-700 hover:bg-gray-800/40">
                    <td className="px-4 py-3 text-sm">
                      {bid.tender?.title || 'Unknown Tender'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {bid.bidder?.email || 'Unknown User'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {bid.bidAmount} SOL
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {bid.deliveryTimeline} days
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatDate(bid.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(bid.status)}`}>
                        {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Link
                        to={`/grid-tendering/tenders/${bid.tender?._id}`}
                        className="inline-flex items-center px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                      >
                        <FaEye className="mr-1" /> Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex rounded-md">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-l-md border border-gray-700 ${
                    currentPage === 1
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-800 hover:bg-gray-700 text-white'
                  }`}
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={`px-3 py-1 border-t border-b border-gray-700 ${
                      currentPage === i + 1
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 hover:bg-gray-700 text-white'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-r-md border border-gray-700 ${
                    currentPage === totalPages
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-800 hover:bg-gray-700 text-white'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminBids; 