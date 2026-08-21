import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const CreateBid = () => {
  const navigate = useNavigate();
  const { tenderId } = useParams();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [tender, setTender] = useState(null);
  const [formData, setFormData] = useState({
    tenderId: tenderId || '',
    amount: '',
    description: '',
    deliveryTimeline: new Date(new Date().setMonth(new Date().getMonth() + 2)),
    termsAndConditions: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userData = await axios.get('/api/user/profile');
        setUser(userData.data.data);
        
        // Redirect if not bidder
        if (userData.data.data.role !== 'bidder') {
          toast.error('Only bidders can place bids');
          navigate('/dashboard');
          return;
        }

        // Fetch tender details if tenderId is provided
        if (tenderId) {
          const tenderData = await axios.get(`/api/tenders/${tenderId}`);
          setTender(tenderData.data.data);

          // Check if tender is open for bidding
          if (tenderData.data.data.status !== 'open') {
            toast.error('This tender is not open for bidding');
            navigate('/tenders');
            return;
          }
        } else {
          navigate('/tenders');
        }
      } catch (error) {
        console.error('Error fetching data', error);
        toast.error('Failed to load data');
        navigate('/tenders');
      }
    };

    fetchData();
  }, [navigate, tenderId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if Phantom wallet is available
      const { solana } = window;
      if (!solana || !solana.isPhantom) {
        toast.error('Phantom wallet is not installed');
        setLoading(false);
        return;
      }

      // Connect to wallet if not connected
      try {
        await solana.connect();
      } catch (err) {
        toast.error('Failed to connect to Phantom wallet');
        setLoading(false);
        return;
      }

      // Create message to sign
      const message = `CREATE BID for tender ${formData.tenderId} at ${new Date().toISOString()}`;
      const encodedMessage = new TextEncoder().encode(message);

      // Request signature from wallet
      const { signature } = await solana.signMessage(encodedMessage, 'utf8');
      const signatureBase58 = Array.from(signature).toString();

      // Submit data with signature
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        message,
        transactionSignature: signatureBase58
      };

      const response = await axios.post('/api/bids', payload);
      
      if (response.data.success) {
        toast.success('Bid placed successfully');
        navigate('/my-bids');
      } else {
        toast.error(response.data.message || 'Failed to place bid');
      }
    } catch (error) {
      console.error('Error placing bid', error);
      toast.error(error.response?.data?.message || 'Failed to place bid');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !tender) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Place a Bid</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold">{tender.title}</h2>
        <p className="text-gray-700 mt-2">{tender.description}</p>
        <div className="mt-2 flex flex-wrap gap-4">
          <div>
            <span className="font-medium">Base Price:</span> {tender.basePrice} USDC
          </div>
          <div>
            <span className="font-medium">Deadline:</span> {new Date(tender.endDate).toLocaleDateString()}
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 max-w-3xl mx-auto">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
            Bid Amount (USDC)
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            required
            min={tender.basePrice}
            step="0.01"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          {formData.amount && parseFloat(formData.amount) < tender.basePrice && (
            <p className="text-red-500 text-xs mt-1">Amount must be at least the base price ({tender.basePrice} USDC)</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
            Bid Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Describe your bid proposal and why you're suitable for this tender"
          ></textarea>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="deliveryTimeline">
            Delivery Timeline
          </label>
          <DatePicker
            selected={formData.deliveryTimeline}
            onChange={(date) => setFormData({ ...formData, deliveryTimeline: date })}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            minDate={new Date(tender.endDate)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="termsAndConditions">
            Terms and Conditions (Optional)
          </label>
          <textarea
            id="termsAndConditions"
            name="termsAndConditions"
            value={formData.termsAndConditions}
            onChange={handleChange}
            rows="3"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Any specific terms or conditions for your bid"
          ></textarea>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={loading}
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Submitting...' : 'Submit Bid'}
          </button>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>Note: This operation requires signature verification with your Phantom wallet.</p>
        </div>
      </form>
    </div>
  );
};

export default CreateBid; 