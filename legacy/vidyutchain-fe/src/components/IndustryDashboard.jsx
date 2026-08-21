import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import CertificateService from './CertificateService';
import CarbonCertificateCard from './CarbonCertificateCard';

const IndustryDashboard = ({ userData }) => {
  const { publicKey } = useWallet();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthlyTarget, setMonthlyTarget] = useState(1000); // in kg CO2
  const [currentOffset, setCurrentOffset] = useState(0);
  const [esgCompliance, setEsgCompliance] = useState(0); // percentage

  useEffect(() => {
    if (publicKey) {
      loadCertificates();
    }
  }, [publicKey]);

  const loadCertificates = async () => {
    if (!publicKey) return;

    setLoading(true);
    setError(null);

    try {
      // Load certificates owned by the company
      const result = await CertificateService.getCertificatesByOwner(publicKey.toString());
      
      if (result.success) {
        setCertificates(result.certificates);
        
        // Calculate total offset from certificates
        const totalOffset = result.certificates.reduce(
          (sum, cert) => sum + cert.carbon_offset, 
          0
        );
        
        setCurrentOffset(totalOffset);
        
        // Calculate ESG compliance percentage
        const compliance = Math.min(100, (totalOffset / monthlyTarget) * 100);
        setEsgCompliance(compliance);
      }
    } catch (error) {
      console.error('Error loading certificates:', error);
      setError('Failed to load certificates. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCertificateTransfer = (updatedCertificate) => {
    // Refresh certificates list after a transfer
    loadCertificates();
  };

  const getComplianceColor = (percentage) => {
    if (percentage >= 90) return 'text-green-400';
    if (percentage >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getComplianceMessage = (percentage) => {
    if (percentage >= 90) return 'Excellent! You are meeting your ESG goals.';
    if (percentage >= 70) return 'Good progress, but more offsets needed to meet targets.';
    return 'Action required: Your company needs more carbon offsets.';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Industry ESG Dashboard</h2>
      
      <div className="bg-gray-700 rounded-lg p-5 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white">ESG Compliance Status</h3>
            <p className="text-gray-400 text-sm">Based on your current carbon offset certificates</p>
          </div>
          <div className="bg-gray-800 py-2 px-4 rounded-lg mt-2 md:mt-0">
            <span className="text-gray-400 text-sm">Monthly Target:</span>
            <span className="text-white ml-2 font-semibold">{monthlyTarget} kg CO₂</span>
          </div>
        </div>
        
        <div className="w-full bg-gray-600 rounded-full h-4 mb-3">
          <div 
            className={`h-4 rounded-full ${esgCompliance >= 90 ? 'bg-green-500' : esgCompliance >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${esgCompliance}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-sm mb-4">
          <span className="text-gray-400">0%</span>
          <span className="text-gray-400">50%</span>
          <span className="text-gray-400">100%</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white">Current Offset: <span className="font-bold">{currentOffset.toFixed(2)} kg CO₂</span></p>
            <p className={`${getComplianceColor(esgCompliance)} text-sm mt-1`}>
              {getComplianceMessage(esgCompliance)}
            </p>
          </div>
          <div className={`text-2xl font-bold ${getComplianceColor(esgCompliance)}`}>
            {esgCompliance.toFixed(1)}%
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-white mb-4">Your Carbon Offset Certificates</h3>
        
        {loading ? (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-400 mb-4">
            {error}
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-8 bg-gray-700/50 rounded-lg border border-gray-600">
            <p className="text-gray-400">You haven't acquired any carbon offset certificates yet.</p>
            <button
              className="mt-4 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-lg"
              onClick={() => window.location.href = '/energy-trading'} // Navigate to marketplace
            >
              Browse Carbon Offset Marketplace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.map(certificate => (
              <CarbonCertificateCard
                key={certificate.certificate_id}
                certificate={certificate}
                userWallet={publicKey?.toString()}
                onTransferSuccess={handleCertificateTransfer}
              />
            ))}
          </div>
        )}
      </div>
      
      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
        <h3 className="text-white font-medium mb-2">Government ESG Reporting</h3>
        <p className="text-gray-300 text-sm mb-3">
          Use your certificates to generate official ESG compliance reports for regulatory requirements.
        </p>
        <button
          className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-lg w-full md:w-auto"
          disabled={certificates.length === 0}
        >
          Generate ESG Compliance Report
        </button>
      </div>
    </div>
  );
};

export default IndustryDashboard; 