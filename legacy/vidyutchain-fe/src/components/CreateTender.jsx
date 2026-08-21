import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const CreateTender = () => {
  const navigate = useNavigate();
  const { gridId } = useParams();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [grids, setGrids] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    gridId: gridId || '',
    description: '',
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    basePrice: '',
    requirements: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userData = await axios.get('/api/user/profile');
        setUser(userData.data.data);
        
        // Redirect if not admin
        if (userData.data.data.role !== 'admin' && !userData.data.data.isAdmin) {
          toast.error('Only admins can create tenders');
          navigate('/dashboard');
          return;
        }

        // Fetch available grids
        const gridsData = await axios.get('/api/grids');
        setGrids(gridsData.data.data);
      } catch (error) {
        console.error('Error fetching data', error);
        toast.error('Failed to load data');
        navigate('/login');
      }
    };

    fetchData();
  }, [navigate, gridId]);

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
      const message = `CREATE TENDER for grid ${formData.gridId} at ${new Date().toISOString()}`;
      const encodedMessage = new TextEncoder().encode(message);

      // Request signature from wallet
      const { signature } = await solana.signMessage(encodedMessage, 'utf8');
      const signatureBase58 = Array.from(signature).toString();

      // Submit data with signature
      const payload = {
        ...formData,
        basePrice: parseFloat(formData.basePrice),
        message,
        transactionSignature: signatureBase58
      };

      const response = await axios.post('/api/tenders', payload);
      
      if (response.data.success) {
        toast.success('Tender created successfully');
        navigate('/tenders');
      } else {
        toast.error(response.data.message || 'Failed to create tender');
      }
    } catch (error) {
      console.error('Error creating tender', error);
      toast.error(error.response?.data?.message || 'Failed to create tender');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Tender</h1>
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 max-w-3xl mx-auto">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
            Tender Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="gridId">
            Select Grid
          </label>
          <select
            id="gridId"
            name="gridId"
            value={formData.gridId}
            onChange={handleChange}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Select a grid</option>
            {grids.map(grid => (
              <option key={grid._id} value={grid._id}>
                {grid.name} - {grid.location} ({grid.capacity} MW)
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          ></textarea>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="startDate">
              Start Date
            </label>
            <DatePicker
              selected={formData.startDate}
              onChange={(date) => setFormData({ ...formData, startDate: date })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              minDate={new Date()}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="endDate">
              End Date
            </label>
            <DatePicker
              selected={formData.endDate}
              onChange={(date) => setFormData({ ...formData, endDate: date })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              minDate={formData.startDate}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="basePrice">
            Base Price (USDC)
          </label>
          <input
            type="number"
            id="basePrice"
            name="basePrice"
            value={formData.basePrice}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="requirements">
            Requirements
          </label>
          <textarea
            id="requirements"
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
            required
            rows="4"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          ></textarea>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={loading}
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Creating...' : 'Create Tender'}
          </button>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>Note: This operation requires signature verification with your Phantom wallet.</p>
        </div>
      </form>
    </div>
  );
};

export default CreateTender; 