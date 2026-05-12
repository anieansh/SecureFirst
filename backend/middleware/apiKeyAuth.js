const API_KEY = '1f39bc30096f61eb69144d2534136ecfe431f87d57ceb6ab3ed0be9f21866a92';

const apiKeyAuth = (req, res, next) => {
  const providedKey = req.header('X-API-Key');

  if (!providedKey || providedKey !== API_KEY) {
    console.warn(`[Security] Blocked request from ${req.ip} - Missing or invalid API Key`);
    return res.status(401).json({ error: 'API key required' });
  }

  next();
};

module.exports = apiKeyAuth;
