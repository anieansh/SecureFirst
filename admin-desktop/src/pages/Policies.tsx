import { useState, useEffect } from 'react';
import axios from 'axios';
import { Filter, Search } from 'lucide-react';

const API_URL = 'http://localhost:5001/api/policies';

const Policies = () => {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filter, setFilter] = useState('All'); // All, Active, Expiring, Expired
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await axios.get(API_URL);
        
        // Compute Status on fetch
        const today = new Date().getTime();
        const policiesWithStatus = res.data.map((p: any) => {
          const expiry = new Date(p.expiryDate).getTime();
          const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
          
          let status = 'Active';
          if (diffDays < 0) status = 'Expired';
          else if (diffDays <= 15) status = 'Expiring';
          
          return { ...p, status, diffDays };
        });

        setPolicies(policiesWithStatus);
      } catch (err) {
        console.error('Error fetching policies', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPolicies();
  }, []);

  const filteredPolicies = policies.filter(p => {
    const matchesFilter = filter === 'All' || p.status === filter;
    const matchesSearch = p.clientName.toLowerCase().includes(search.toLowerCase()) || p.mobileNumber.includes(search);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex-col gap-4">
      <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '2rem' }}>Policy Portfolio</h2>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <div className="flex gap-4 items-center" style={{ marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search by client name or mobile..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem', marginBottom: 0 }}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={18} style={{ color: 'var(--text-secondary)' }} />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              style={{ width: '150px', marginBottom: 0 }}
            >
              <option value="All">All Policies</option>
              <option value="Active">Active</option>
              <option value="Expiring">Expiring Soon</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <p>Loading policies...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Mobile Number</th>
                  <th>Policy Type</th>
                  <th>Vehicle Num</th>
                  <th>Expiry Date</th>
                  <th>Premium</th>
                  <th>Attachment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPolicies.map((p) => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 500 }}>{p.clientName}</td>
                    <td>{p.mobileNumber}</td>
                    <td>{p.policyType}</td>
                    <td>{p.vehicleNumber || '-'}</td>
                    <td>{new Date(p.expiryDate).toLocaleDateString()}</td>
                    <td>₹{p.annualPremium.toLocaleString()}</td>
                    <td>
                      {p.attachedDocument ? (
                        <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontWeight: 500 }}>
                          📄 {p.attachedDocument}
                        </a>
                      ) : '-'}
                    </td>
                    <td>
                      <span className={`badge ${p.status.toLowerCase()}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredPolicies.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      No policies found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Policies;
