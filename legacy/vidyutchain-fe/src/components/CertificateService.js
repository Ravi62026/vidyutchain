import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_BACKEND_AI_URL}/api`;

/**
 * Service for managing carbon offset certificates
 */
class CertificateService {
  /**
   * Issues a new carbon offset certificate for a producer
   * @param {number} energyAmount - Amount of energy in kWh
   * @param {string} producerWallet - Producer's wallet address
   * @returns {Promise} - Certificate data
   */
  static async issueCertificate(energyAmount, producerWallet) {
    try {
      const response = await axios.post(`${API_BASE_URL}/certificates/issue`, {
        energy_amount: energyAmount,
        producer_wallet: producerWallet
      });
      
      return response.data;
    } catch (error) {
      console.error('Error issuing certificate:', error);
      throw error;
    }
  }

  /**
   * Get a certificate by ID
   * @param {string} certificateId - Certificate ID
   * @returns {Promise} - Certificate data with validation status
   */
  static async getCertificate(certificateId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/certificates/${certificateId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting certificate:', error);
      throw error;
    }
  }

  /**
   * Transfer a certificate to a new owner
   * @param {string} certificateId - Certificate ID
   * @param {string} fromWallet - Current owner's wallet
   * @param {string} toWallet - New owner's wallet
   * @returns {Promise} - Updated certificate data
   */
  static async transferCertificate(certificateId, fromWallet, toWallet) {
    try {
      const response = await axios.post(`${API_BASE_URL}/certificates/transfer`, {
        certificate_id: certificateId,
        from_wallet: fromWallet,
        to_wallet: toWallet
      });
      
      return response.data;
    } catch (error) {
      console.error('Error transferring certificate:', error);
      throw error;
    }
  }

  /**
   * Get all certificates owned by a wallet address
   * @param {string} walletAddress - Owner's wallet address
   * @returns {Promise} - List of certificates
   */
  static async getCertificatesByOwner(walletAddress) {
    try {
      const response = await axios.get(`${API_BASE_URL}/certificates/by-owner/${walletAddress}`);
      return response.data;
    } catch (error) {
      console.error('Error getting certificates by owner:', error);
      throw error;
    }
  }

  /**
   * Get the issuer's public key for verification
   * @returns {Promise} - Public key PEM string
   */
  static async getIssuerPublicKey() {
    try {
      const response = await axios.get(`${API_BASE_URL}/certificates/issuer-public-key`);
      return response.data;
    } catch (error) {
      console.error('Error getting issuer public key:', error);
      throw error;
    }
  }

  /**
   * Calculate carbon offset for a given energy amount
   * @param {number} energyAmount - Amount of energy in kWh
   * @returns {Promise} - Carbon offset calculation
   */
  static async calculateCarbonOffset(energyAmount) {
    try {
      const response = await axios.post(`${API_BASE_URL}/calculate-carbon-offset`, {
        energy_amount: energyAmount
      });
      
      return response.data;
    } catch (error) {
      console.error('Error calculating carbon offset:', error);
      throw error;
    }
  }
}

export default CertificateService; 