import { verifyAccessToken } from '../auth/token.js'

export function requireAuth(request, response, next) {
  const authorization = request.get('authorization')
  const [scheme, token] = authorization?.split(' ') ?? []

  if (scheme !== 'Bearer' || !token) {
    return response.status(401).json({ error: 'Authentication required' })
  }

  try {
    request.user = verifyAccessToken(token)
    return next()
  } catch {
    return response.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function requireRole(...allowedRoles) {
  return (request, response, next) => {
    if (!request.user || !allowedRoles.includes(request.user.role)) {
      return response.status(403).json({ error: 'Insufficient permissions' })
    }

    return next()
  }
}
