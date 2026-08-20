import {
  Contract,
  JsonRpcProvider,
  Wallet,
  NonceManager,
  id,
  keccak256,
  toUtf8Bytes,
} from 'ethers'
import { env } from '../config/env.js'

const ENERGY_AUDIT_ABI = [
  'function registerMeter(bytes32 meterIdHash)',
  'function logAuditEvent(bytes32 meterIdHash, bytes32 eventTypeHash, bytes32 payloadHash) returns (bytes32 eventId)',
  'function verifyAuditEvent(bytes32 meterIdHash, bytes32 eventTypeHash, bytes32 payloadHash) view returns (bool exists, bytes32 eventId)',
  'event AuditEventLogged(bytes32 indexed eventId, bytes32 indexed meterIdHash, bytes32 eventTypeHash, bytes32 payloadHash, address indexed submitter, uint256 recordedAt)',
]

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize)
  }
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = canonicalize(value[key])
      return result
    }, {})
  }
  return value
}

export function hashAuditPayload(payload) {
  return keccak256(toUtf8Bytes(JSON.stringify(canonicalize(payload))))
}

export function auditHashes({ meterId, eventType, payload }) {
  return {
    meterIdHash: id(meterId),
    eventTypeHash: id(eventType),
    payloadHash: hashAuditPayload(payload),
  }
}

export function createBlockchainClient({
  rpcUrl = env.BLOCKCHAIN_RPC_URL,
  contractAddress = env.BLOCKCHAIN_CONTRACT_ADDRESS,
  privateKey = env.BLOCKCHAIN_PRIVATE_KEY,
} = {}) {
  if (!contractAddress || !privateKey) {
    return null
  }

  const provider = new JsonRpcProvider(rpcUrl)
  const signer = new NonceManager(new Wallet(privateKey, provider))
  const contract = new Contract(contractAddress, ENERGY_AUDIT_ABI, signer)
  const readOnlyContract = new Contract(contractAddress, ENERGY_AUDIT_ABI, provider)
  let writeQueue = Promise.resolve()

  function enqueueWrite(operation) {
    const result = writeQueue.then(operation)
    writeQueue = result.catch(() => undefined)
    return result
  }

  return {
    async registerMeter(meterId) {
      return enqueueWrite(async () => {
        const transaction = await contract.registerMeter(id(meterId))
        const receipt = await transaction.wait()
        return { transactionHash: receipt.hash ?? transaction.hash }
      })
    },

    async logAuditEvent({ meterId, eventType, payload }) {
      return enqueueWrite(async () => {
        const hashes = auditHashes({ meterId, eventType, payload })
        const transaction = await contract.logAuditEvent(
          hashes.meterIdHash,
          hashes.eventTypeHash,
          hashes.payloadHash,
        )
        const receipt = await transaction.wait()
        const event = receipt.logs.find((log) => log.fragment?.name === 'AuditEventLogged')
        return {
          ...hashes,
          eventId: event?.args?.eventId,
          transactionHash: receipt.hash ?? transaction.hash,
        }
      })
    },

    async verifyAuditEvent({ meterId, eventType, payload }) {
      const hashes = auditHashes({ meterId, eventType, payload })
      const [exists, eventId] = await readOnlyContract.verifyAuditEvent(
        hashes.meterIdHash,
        hashes.eventTypeHash,
        hashes.payloadHash,
      )
      return { ...hashes, exists, eventId }
    },
  }
}