import React, { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import CertificateService from './CertificateService';

const CarbonCertificateCard = ({ certificate, userWallet, isIndustry = false, onTransferSuccess = null }) => {
  const [transferTo, setTransferTo] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleString();
  };

  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleTransfer = async () => {
    if (!transferTo || !transferTo.trim()) {
      setError('Please enter a valid wallet address');
      return;
    }

    try {
      // Validate the transferTo address is a valid PublicKey
      new PublicKey(transferTo);
      
      setIsTransferring(true);
      setError(null);
      
      const result = await CertificateService.transferCertificate(
        certificate.certificate_id,
        userWallet,
        transferTo
      );
      
      if (result.success) {
        setTransferTo('');
        if (onTransferSuccess) {
          onTransferSuccess(result.certificate);
        }
      } else {
        setError(result.error || 'Failed to transfer certificate');
      }
    } catch (error) {
      setError(error.message || 'Invalid wallet address or transfer failed');
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="bg-gray-700 hover:bg-gray-650 rounded-lg p-4 transition-all duration-200 border border-gray-600">
      <div className="flex justify-between">
        <div className="flex items-center">
          <div className="bg-green-600 h-8 w-8 rounded-full flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-medium">Carbon Offset Certificate</h3>
            <p className="text-gray-400 text-sm">ID: {certificate.certificate_id.substring(0, 8)}...</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-green-400">{certificate.carbon_offset.toFixed(2)} kg</div>
          <div className="text-gray-400 text-sm">CO₂ offset</div>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-600">
        <div className="flex justify-between">
          <div className="text-gray-300 text-sm">Energy Amount:</div>
          <div className="text-white">{certificate.energy_amount} kWh</div>
        </div>
        <div className="flex justify-between mt-1">
          <div className="text-gray-300 text-sm">Issued:</div>
          <div className="text-white">{formatDate(certificate.timestamp)}</div>
        </div>
        <div className="flex justify-between mt-1">
          <div className="text-gray-300 text-sm">Status:</div>
          <div className="text-white capitalize">{certificate.status}</div>
        </div>
      </div>
      
      <button 
        onClick={() => setExpanded(!expanded)} 
        className="text-blue-400 hover:text-blue-300 text-sm mt-2 flex items-center"
      >
        {expanded ? 'Hide details' : 'Show details'}
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {expanded && (
        <div className="mt-2 pt-2 border-t border-gray-600">
          <div className="text-gray-400 text-sm">Producer:</div>
          <div className="text-white text-sm font-mono">{certificate.producer_wallet}</div>
          
          <div className="text-gray-400 text-sm mt-2">Current Owner:</div>
          <div className="text-white text-sm font-mono">{certificate.current_owner}</div>
          
          {certificate.transfer_history.length > 0 && (
            <div className="mt-2">
              <div className="text-gray-400 text-sm">Transfer History:</div>
              <div className="max-h-24 overflow-y-auto mt-1">
                {certificate.transfer_history.map((transfer, index) => (
                  <div key={index} className="text-sm py-1 border-b border-gray-700">
                    <div className="flex justify-between">
                      <span className="text-gray-400">{formatDate(transfer.timestamp)}</span>
                    </div>
                    <div className="text-white text-xs">
                      {truncateAddress(transfer.from)} → {truncateAddress(transfer.to)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Transfer section - only show if user is the owner */}
      {certificate.current_owner === userWallet && (
        <div className="mt-4 pt-3 border-t border-gray-600">
          <h4 className="text-white font-medium mb-2">Transfer Certificate</h4>
          
          <div className="flex flex-col space-y-2">
            <input
              type="text"
              placeholder="Recipient wallet address"
              className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              disabled={isTransferring}
            />
            
            <button
              onClick={handleTransfer}
              disabled={isTransferring || !transferTo}
              className={`bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isTransferring ? 'Processing...' : 'Transfer'}
            </button>
            
            {error && (
              <div className="text-red-400 text-sm mt-1">{error}</div>
            )}
          </div>
        </div>
      )}
      
      {/* Claim button for industry users */}
      {isIndustry && certificate.current_owner !== userWallet && (
        <div className="mt-4 pt-3 border-t border-gray-600">
          <button
            className="w-full bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded transition-colors duration-200"
            onClick={() => {
              // This would trigger a purchase flow
              if (onTransferSuccess) {
                onTransferSuccess(certificate);
              }
            }}
          >
            Claim for ESG Compliance
          </button>
        </div>
      )}
    </div>
  );
};

export default CarbonCertificateCard; 