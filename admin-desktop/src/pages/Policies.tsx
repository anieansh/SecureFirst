import { useState, useEffect } from 'react';
import axios from 'axios';
import { Filter, Search, Trash2 } from 'lucide-react';

const API_URL = 'https://api.securefirst.co/api/policies';
const POLICY_API_BASE = 'https://api.securefirst.co/api/policy';

const Policies = () => {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filter, setFilter] = useState('All'); // All, Active, Expiring, Expired
  const [search, setSearch] = useState('');

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<string | null>(null);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      const policiesData = res.data.data || res.data;
      
      // Compute Status on fetch
      const today = new Date().getTime();
      const policiesWithStatus = policiesData.map((p: any) => {
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

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleDeleteClick = (id: string) => {
    setPolicyToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!policyToDelete) return;
    try {
      await axios.delete(`${POLICY_API_BASE}/${policyToDelete}`, {
        headers: {
          'X-API-Key': '1f39bc30096f61eb69144d2534136ecfe431f87d57ceb6ab3ed0be9f21866a92'
        }
      });
      alert('Policy deleted successfully');
      setIsDeleteModalOpen(false);
      setPolicyToDelete(null);
      fetchPolicies();
    } catch (err) {
      console.error('Error deleting policy', err);
      alert('Failed to delete policy');
    }
  };

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
                  <th>Actions</th>
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
                        <a 
                          href={`https://api.securefirst.co/uploads/${p.attachedDocument}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontWeight: 500 }}
                        >
                          📄 {p.attachedDocument}
                        </a>
                      ) : '-'}
                    </td>
                    <td>
                      <span className={`badge ${p.status.toLowerCase()}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleDeleteClick(p._id)}
                        style={{ background: 'none', border: 'none', color: '#ea4335', cursor: 'pointer', padding: 4 }}
                        title="Delete Policy"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPolicies.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      No policies found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100, backdropFilter: 'blur(8px)'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ 
              width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(234, 67, 53, 0.1)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
              color: '#ea4335'
            }}>
              <Trash2 size={30} />
            </div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: '#fff' }}>Confirm Policy Deletion</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.5' }}>
              Are you sure you want to delete this specific policy? This action cannot be undone.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="btn-secondary" 
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                style={{ 
                  flex: 1, padding: '0.75rem', borderRadius: '8px', 
                  backgroundColor: '#ea4335', color: '#fff', border: 'none', 
                  fontWeight: 600, cursor: 'pointer' 
                }}
              >
                Delete Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Policies;
