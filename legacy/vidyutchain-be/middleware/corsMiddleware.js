const corsMiddleware = (req, res, next) => {
  const requestOrigin = req.headers.origin;
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,https://vidyutchain-fe.vercel.app,https://vidyutchain-fe.onrender.com')
    .split(',')
    .map(o => o.trim());

  // Only echo back an allowed origin when credentials are used
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  }

  // Inform caches that responses vary by Origin
  res.setHeader('Vary', 'Origin');

  // Allow credentials (cookies, Authorization headers, TLS client certs)
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Allowed methods and headers
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // Fast-path preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
};

export default corsMiddleware;
