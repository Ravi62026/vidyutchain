import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { PublicKey } from '@solana/web3.js';

const verifySignature = (message, signature, walletAddress) => {
  try {
    // Get public key from wallet address
    const pubKey = new PublicKey(walletAddress);
    const publicKeyBytes = pubKey.toBytes();
    
    // Prepare message bytes
    const messageBytes = new TextEncoder().encode(message);
    
    // Handle both base64 (from browser) and base58 (from Phantom)
    let signatureBytes;
    if (signature.includes('+') || signature.includes('/') || signature.includes('=')) {
      // Base64 format
      signatureBytes = Buffer.from(signature, 'base64');
    } else {
      // Base58 format
      signatureBytes = bs58.decode(signature);
    }
    
    // Use nacl to verify the signature
    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};

export default verifySignature;
