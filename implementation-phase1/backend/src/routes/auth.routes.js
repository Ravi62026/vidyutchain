import { Router } from 'express'
import { z } from 'zod'
import { hashPassword, comparePassword } from '../auth/password.js'
import { createAccessToken } from '../auth/token.js'
import { requireAuth } from '../middleware/auth.js'
import { User } from '../models/user.model.js'

const credentialsSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  role: z.enum(['admin', 'consumer']).default('consumer'),
})

function publicUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  }
}

export function createAuthRouter() {
  const router = Router()

  router.post('/register', async (request, response) => {
    const parsed = credentialsSchema.safeParse(request.body)
    if (!parsed.success) {
      return response.status(400).json({ error: 'Invalid registration data', details: parsed.error.flatten() })
    }

    const existingUser = await User.findOne({ email: parsed.data.email }).lean()
    if (existingUser) {
      return response.status(409).json({ error: 'Email is already registered' })
    }

    const user = await User.create({
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      role: parsed.data.role,
    })

    return response.status(201).json({ user: publicUser(user), accessToken: createAccessToken(user) })
  })

  router.post('/login', async (request, response) => {
    const parsed = credentialsSchema.omit({ role: true }).safeParse(request.body)
    if (!parsed.success) {
      return response.status(400).json({ error: 'Invalid login data', details: parsed.error.flatten() })
    }

    const user = await User.findOne({ email: parsed.data.email }).select('+passwordHash')
    if (!user || !(await comparePassword(parsed.data.password, user.passwordHash))) {
      return response.status(401).json({ error: 'Invalid email or password' })
    }

    return response.json({ user: publicUser(user), accessToken: createAccessToken(user) })
  })

  router.get('/me', requireAuth, async (request, response) => {
    const user = await User.findById(request.user.sub).lean()
    if (!user) {
      return response.status(404).json({ error: 'User not found' })
    }

    return response.json({ user: publicUser(user) })
  })

  return router
}
