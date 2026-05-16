const API_KEY = '1f39bc30096f61eb69144d2534136ecfe431f87d57ceb6ab3ed0be9f21866a92';

/**
 * Middleware to allow access if:
 * 1. A valid X-API-Key is provided (Direct mobile app access)
 * 2. OR a valid mobile session exists (Future proofing)
 */
const requireMobileUser = (req, res, next) => {
  const providedKey = req.header('X-API-Key');

  // Currently, we allow any request with the valid static API Key
  if (providedKey && providedKey === API_KEY) {
    return next();
  }

  // If no API key, check for session (placeholder for future JWT logic)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    const token = req.headers.authorization.split(' ')[1];
    // In the future, verify token here
    if (token === API_KEY) return next(); // Temporary fallback
  }

  console.warn(`[Mobile Security] Access denied for ${req.url} from ${req.ip}`);
  return res.status(401).json({ success: false, error: 'Authentication required' });
};

module.exports = requireMobileUser;
