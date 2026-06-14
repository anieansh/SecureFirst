const jwt = require('jsonwebtoken');
const Policy = require('../models/Policy');
const Lead = require('../models/Lead');

const JWT_SECRET = process.env.JWT_SECRET || 'securefirst-secret-key-2026';

const requireMobileUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn(`[Security] Blocked request from ${req.ip} - Missing or invalid Authorization header`);
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach decoded payload { id, mobile, role }

    // If it's an admin, grant access immediately
    if (decoded.role === 'admin') {
      return next();
    }

    // --- Mobile User Restrictions ---
    
    // 1. Block access to general admin-only endpoints
    const adminOnlyPaths = [
      '/policies',
      '/clients',
      '/client',
      '/users'
    ];

    const isMatchAdminOnly = adminOnlyPaths.some(p => req.path === p || req.path.startsWith(p + '/'));
    if (isMatchAdminOnly) {
      console.warn(`[Security Warning] Mobile user ${decoded.mobile} tried to access admin path ${req.originalUrl}`);
      return res.status(403).json({ success: false, error: 'Access denied: Admin privileges required' });
    }

    // 2. Prevent BOLA (Broken Object Level Authorization) on policy fetching
    // Endpoint: GET /policy/:mobile
    if (req.method === 'GET' && req.path.startsWith('/policy/')) {
      const targetMobile = req.path.replace('/policy/', '');
      if (decoded.mobile !== targetMobile) {
        console.warn(`[Security Warning] Mobile user ${decoded.mobile} tried to query policies of ${targetMobile}`);
        return res.status(403).json({ success: false, error: 'Access denied: Unauthorized to view policies of another user' });
      }
    }

    // 3. Prevent BOLA on lead fetching
    // Endpoint: GET /leads/:mobile
    if (req.method === 'GET' && req.path.startsWith('/leads/')) {
      const targetMobile = req.path.replace('/leads/', '');
      if (decoded.mobile !== targetMobile) {
        console.warn(`[Security Warning] Mobile user ${decoded.mobile} tried to query leads of ${targetMobile}`);
        return res.status(403).json({ success: false, error: 'Access denied: Unauthorized to view leads of another user' });
      }
    }

    // 4. Ensure user can only submit leads for their own mobile number
    // Endpoint: POST /leads
    if (req.method === 'POST' && req.path === '/leads') {
      const { mobileNumber } = req.body;
      if (mobileNumber && decoded.mobile !== mobileNumber) {
        console.warn(`[Security Warning] Mobile user ${decoded.mobile} tried to submit lead for ${mobileNumber}`);
        return res.status(403).json({ success: false, error: 'Access denied: Cannot submit leads for another mobile number' });
      }
    }

    // 5. Ensure user can only update or delete their own leads
    // Endpoints: PUT /leads/:id, DELETE /leads/:id
    if ((req.method === 'PUT' || req.method === 'DELETE') && req.path.startsWith('/leads/')) {
      const leadId = req.path.replace('/leads/', '');
      const lead = await Lead.findById(leadId);
      if (!lead) {
        return res.status(404).json({ success: false, error: 'Lead not found' });
      }
      if (lead.mobileNumber !== decoded.mobile) {
        console.warn(`[Security Warning] Mobile user ${decoded.mobile} tried to modify lead of ${lead.mobileNumber}`);
        return res.status(403).json({ success: false, error: 'Access denied: Unauthorized to modify another user\'s lead' });
      }
    }

    // 6. Ensure user can only update or delete their own policies (if these routes were somehow called)
    // Endpoints: PUT /policy/:id, DELETE /policy/:id
    if ((req.method === 'PUT' || req.method === 'DELETE') && req.path.startsWith('/policy/')) {
      const policyId = req.path.replace('/policy/', '');
      const policy = await Policy.findById(policyId);
      if (!policy) {
        return res.status(404).json({ success: false, error: 'Policy not found' });
      }
      if (policy.mobileNumber !== decoded.mobile) {
        console.warn(`[Security Warning] Mobile user ${decoded.mobile} tried to modify policy of ${policy.mobileNumber}`);
        return res.status(403).json({ success: false, error: 'Access denied: Admin privileges required' });
      }
    }

    // User is authorized
    next();
  } catch (err) {
    console.error(`[Security] JWT verification failed:`, err.message);
    return res.status(401).json({ success: false, error: 'Session expired or invalid token' });
  }
};

module.exports = requireMobileUser;
