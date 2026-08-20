import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/vidyutchain'),
  MONGODB_SERVER_SELECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(3000),
  JWT_SECRET: z.string().min(16).default('local-development-secret-change-me'),
  AI_SERVICE_URL: z.string().url().default('http://127.0.0.1:8000'),
  AI_SERVICE_TIMEOUT_MS: z.coerce.number().int().positive().default(3000),
  BLOCKCHAIN_RPC_URL: z.string().url().default('http://127.0.0.1:8545'),
  BLOCKCHAIN_CONTRACT_ADDRESS: z.string().optional(),
  BLOCKCHAIN_PRIVATE_KEY: z.string().optional(),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('Invalid backend environment configuration')
  console.error(parsedEnv.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsedEnv.data
