import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

const tokenIssuer = 'vidyutchain-backend'
const tokenAudience = 'vidyutchain-client'

export function createAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    env.JWT_SECRET,
    {
      expiresIn: '2h',
      issuer: tokenIssuer,
      audience: tokenAudience,
    },
  )
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: tokenIssuer,
    audience: tokenAudience,
  })
}
