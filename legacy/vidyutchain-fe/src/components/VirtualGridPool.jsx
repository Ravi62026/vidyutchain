import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import CertificateService from './CertificateService';
import CarbonCertificateCard from './CarbonCertificateCard';

const VirtualGridPool = ({ userData, energyAmount, onSuccess, isCreatingOffer }) => {
  const { publicKey } = useWallet();
  const [certificates, setCertificates] = useState([]);
  const [userCertificates, setUserCertificates] = useState([]);
  const [availableCertificates, setAvailableCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [carbonOffset, setCarbonOffset] = useState(null);
  const [tab, setTab] = useState('pool'); // 'pool', 'my-certificates'
  const [isIndustry, setIsIndustry] = useState(false);

  useEffect(() => {
    // Check if user is an industry account
    if (userData && userData.role === 'industry') {
      setIsIndustry(true);
    } else {
      setIsIndustry(false);
    }
  }, [userData]);

  useEffect(() => {
    // Calculate carbon offset when energy amount changes
    if (energyAmount && energyAmount > 0) {
      calculateCarbonOffset(energyAmount);
    }
  }, [energyAmount]);

  useEffect(() => {
    // Load certificates when component mounts
    if (publicKey) {
      loadCertificates();
    }
  }, [publicKey]);

  const calculateCarbonOffset = async (amount) => {
    try {
      const result = await CertificateService.calculateCarbonOffset(amount);
      if (result.success) {
        setCarbonOffset(result.carbon_offset);
      }
    } catch (error) {
      console.error('Error calculating carbon offset:', error);
    }
  };

  const loadCertificates = async () => {
    if (!publicKey) return;

    setLoading(true);
    setError(null);

    try {
      // Load certificates owned by the user
      const userResult = await CertificateService.getCertificatesByOwner(publicKey.toString());
      if (userResult.success) {
        setUserCertificates(userResult.certificates);
      }

      // Load all available certificates (in a real app, you'd fetch these from a marketplace API)
      // For demo purposes, we're just using certificates with the current owner not being the user
      const allCertificates = []; // This would be fetched from a marketplace endpoint
      setAvailableCertificates(allCertificates.filter(cert => cert.current_owner !== publicKey.toString()));
      
      // Combine all certificates
      setCertificates([...userResult.certificates, ...allCertificates]);
    } catch (error) {
      console.error('Error loading certificates:', error);
      setError('Failed to load certificates. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCertificate = async () => {
    if (!publicKey || !energyAmount || energyAmount <= 0) {
      setError('Please enter a valid energy amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await CertificateService.issueCertificate(
        energyAmount,
        publicKey.toString()
      );

      if (result.success) {
        // Update certificates list
        setUserCertificates([...userCertificates, result.certificate]);
        onSuccess(result.certificate);
      } else {
        setError(result.error || 'Failed to create certificate');
      }
    } catch (error) {
      console.error('Error creating certificate:', error);
      setError('Failed to create certificate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferSuccess = (updatedCertificate) => {
    // Update the certificates lists after a transfer
    setUserCertificates(userCertificates.map(cert => 
      cert.certificate_id === updatedCertificate.certificate_id ? updatedCertificate : cert
    ));
    
    // If the certificate was transferred away from the user, refresh the lists
    if (updatedCertificate.current_owner !== publicKey.toString()) {
      loadCertificates();
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Virtual Grid Pool</h2>
      
      {isCreatingOffer ? (
        <div>
          <div className="mb-6 bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-white mb-2">Carbon Offset Certificate</h3>
            <p className="text-gray-300 mb-4">
              When you stake energy to the Virtual Grid Pool, a carbon offset certificate will be issued.
              This certificate can be claimed by industries to meet their ESG requirements.
            </p>
            
            {carbonOffset && (
              <div className="flex items-center mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                <div className="bg-green-600 h-8 w-8 rounded-full flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-white">Your contribution will offset <span className="font-bold">{carbonOffset.toFixed(2)} kg</span> of CO₂</p>
                  <p className="text-green-400 text-sm">Help combat climate change with your clean energy</p>
                </div>
              </div>
            )}

            <button
              className="w-full bg-green-600 hover:bg-green-500 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200"
              onClick={handleCreateCertificate}
              disabled={loading || !energyAmount || energyAmount <= 0}
            >
              {loading ? 'Creating...' : 'Create Carbon Offset Certificate'}
            </button>
            
            {error && (
              <div className="mt-3 text-red-400 text-sm">{error}</div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex border-b border-gray-700 mb-4">
            <button
              className={`py-2 px-4 font-medium text-sm ${tab === 'pool' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
              onClick={() => setTab('pool')}
            >
              Certificate Pool
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm ${tab === 'my-certificates' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
              onClick={() => setTab('my-certificates')}
            >
              My Certificates
            </button>
          </div>
          
          {loading && (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {!loading && tab === 'pool' && (
            <div>
              <p className="text-gray-300 mb-4">
                {isIndustry 
                  ? 'Browse carbon offset certificates available for your ESG compliance needs.' 
                  : 'Browse certificates available in the pool. Industries can purchase these to meet their ESG requirements.'}
              </p>
              
              {availableCertificates.length === 0 ? (
                <div className="text-center py-8 bg-gray-700/50 rounded-lg border border-gray-600">
                  <p className="text-gray-400">No certificates available in the pool.</p>
                  {!isIndustry && (
                    <button
                      className="mt-4 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-lg text-sm"
                      onClick={() => onSuccess()} // Navigate to create offer
                    >
                      Create an Offer
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableCertificates.map(certificate => (
                    <CarbonCertificateCard
                      key={certificate.certificate_id}
                      certificate={certificate}
                      userWallet={publicKey?.toString()}
                      isIndustry={isIndustry}
                      onTransferSuccess={handleTransferSuccess}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {!loading && tab === 'my-certificates' && (
            <div>
              <p className="text-gray-300 mb-4">
                {isIndustry 
                  ? 'Manage your carbon offset certificates used for ESG compliance.' 
                  : 'Manage your issued carbon offset certificates.'}
              </p>
              
              {userCertificates.length === 0 ? (
                <div className="text-center py-8 bg-gray-700/50 rounded-lg border border-gray-600">
                  <p className="text-gray-400">You don't have any certificates yet.</p>
                  {!isIndustry && (
                    <button
                      className="mt-4 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-lg text-sm"
                      onClick={() => onSuccess()} // Navigate to create offer
                    >
                      Create an Offer
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userCertificates.map(certificate => (
                    <CarbonCertificateCard
                      key={certificate.certificate_id}
                      certificate={certificate}
                      userWallet={publicKey?.toString()}
                      onTransferSuccess={handleTransferSuccess}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VirtualGridPool; 