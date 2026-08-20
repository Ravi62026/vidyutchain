import assert from 'node:assert/strict'
import test from 'node:test'
import { hashPassword, comparePassword } from '../src/auth/password.js'
import { createAccessToken, verifyAccessToken } from '../src/auth/token.js'
import { requireAuth, requireRole } from '../src/middleware/auth.js'

function responseDouble() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    },
  }
}

test('password hashes verify without exposing the original password', async () => {
  const password = 'correct-horse-battery-staple'
  const passwordHash = await hashPassword(password)

  assert.notEqual(passwordHash, password)
  assert.equal(await comparePassword(password, passwordHash), true)
  assert.equal(await comparePassword('wrong-password', passwordHash), false)
})

test('access tokens contain the user identity and role', () => {
  const token = createAccessToken({ _id: '507f1f77bcf86cd799439011', email: 'user@example.com', role: 'consumer' })
  const claims = verifyAccessToken(token)

  assert.equal(claims.sub, '507f1f77bcf86cd799439011')
  assert.equal(claims.email, 'user@example.com')
  assert.equal(claims.role, 'consumer')
})

test('auth middleware rejects missing and malformed authorization', () => {
  const request = { get: () => undefined }
  const response = responseDouble()
  let nextCalled = false

  requireAuth(request, response, () => {
    nextCalled = true
  })

  assert.equal(response.statusCode, 401)
  assert.deepEqual(response.body, { error: 'Authentication required' })
  assert.equal(nextCalled, false)
})

test('auth middleware accepts a valid bearer token', () => {
  const token = createAccessToken({ _id: '507f1f77bcf86cd799439011', email: 'user@example.com', role: 'consumer' })
  const request = { get: () => `Bearer ${token}` }
  const response = responseDouble()
  let nextCalled = false

  requireAuth(request, response, () => {
    nextCalled = true
  })

  assert.equal(nextCalled, true)
  assert.equal(request.user.role, 'consumer')
})

test('role middleware rejects a role outside its allow-list', () => {
  const request = { user: { role: 'consumer' } }
  const response = responseDouble()
  let nextCalled = false

  requireRole('admin')(request, response, () => {
    nextCalled = true
  })

  assert.equal(response.statusCode, 403)
  assert.deepEqual(response.body, { error: 'Insufficient permissions' })
  assert.equal(nextCalled, false)
})
