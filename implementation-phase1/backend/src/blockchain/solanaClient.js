import crypto from 'crypto'
import { Keypair } from '@solana/web3.js'
import bs58 from 'bs58'
import { ethers } from 'ethers'

const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || 'vidyutchain-super-secret-vault-key-32b!' // 32 bytes
const IV_LENGTH = 16

function getSecretBuffer() {
  return crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest()
}

export function encryptKey(plainText) {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv('aes-256-cbc', getSecretBuffer(), iv)
  let encrypted = cipher.update(plainText, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return `${iv.toString('hex')}:${encrypted}`
}

export function decryptKey(encryptedText) {
  try {
    const [ivHex, cipherHex] = encryptedText.split(':')
    if (!ivHex || !cipherHex) return null
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', getSecretBuffer(), iv)
    let decrypted = decipher.update(cipherHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    return null
  }
}

export function generateDualVaultKeys() {
  // 1. Solana Keypair
  const solanaKeypair = Keypair.generate()
  const solanaPublicKey = solanaKeypair.publicKey.toBase58()
  const solanaSecretBase58 = bs58.encode(solanaKeypair.secretKey)

  // 2. Ethereum / EVM Wallet
  const ethWallet = ethers.Wallet.createRandom()
  const ethereumAddress = ethWallet.address
  const ethereumPrivateKey = ethWallet.privateKey

  return {
    solanaPublicKey,
    solanaSecretKeyEncrypted: encryptKey(solanaSecretBase58),
    ethereumAddress,
    ethereumPrivateKeyEncrypted: encryptKey(ethereumPrivateKey),
  }
}

export function generateDePinSignature(payload) {
  const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload)
  const hash = crypto.createHash('sha256').update(serialized + Date.now().toString()).digest('hex')
  // Solana standard 88-char base58 transaction signature format
  const mockSigBuffer = crypto.createHash('sha512').update(hash).digest()
  return bs58.encode(mockSigBuffer)
}
