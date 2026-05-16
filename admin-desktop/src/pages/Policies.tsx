import { useState, useEffect } from 'react';
import axios from 'axios';
import { Filter, Search, Trash2, Edit3, X, ShieldCheck, PlusCircle } from 'lucide-react';

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

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    clientName: '',
    mobileNumber: '',
    clientEmail: '',
    policyType: 'Motor',
    vehicleNumber: '',
    policyNumber: '',
    insurer: '',
    issueDate: '',
    expiryDate: '',
    sumInsured: '',
    annualPremium: '',
  });

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      const policiesData = res.data.data || res.data;
      
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

  const handleEditClick = (policy: any) => {
    setSelectedPolicy(policy);
    setDocumentFile(null);
    setFormData({
      clientName: policy.clientName,
      mobileNumber: policy.mobileNumber,
      clientEmail: policy.clientEmail || '',
      policyType: policy.policyType,
      vehicleNumber: policy.vehicleNumber || '',
      policyNumber: policy.policyNumber,
      insurer: policy.insurer,
      issueDate: new Date(policy.issueDate).toISOString().split('T')[0],
      expiryDate: new Date(policy.expiryDate).toISOString().split('T')[0],
      sumInsured: policy.sumInsured.toString(),
      annualPremium: policy.annualPremium.toString(),
    });
    setIsEditModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!policyToDelete) return;
    try {
      await axios.delete(`${POLICY_API_BASE}/${policyToDelete}`, {
        headers: { 'X-API-Key': '1f39bc30096f61eb69144d2534136ecfe431f87d57ceb6ab3ed0be9f21866a92' }
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

  const handleUpdatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    if (documentFile) {
      data.append('document', documentFile);
    }

    try {
      const isNew = !selectedPolicy;
      const url = isNew ? POLICY_API_BASE : `${POLICY_API_BASE}/${selectedPolicy._id}`;
      const method = isNew ? 'post' : 'put';

      console.log(`${isNew ? 'Creating' : 'Updating'} Policy Data:`, formData);
      const res = await axios({
        method,
        url,
        data,
        headers: { 
          'X-API-Key': '1f39bc30096f61eb69144d2534136ecfe431f87d57ceb6ab3ed0be9f21866a92'
        }
      });
      console.log(`Policy ${isNew ? 'Creation' : 'Update'} Response:`, res.data);
      alert(`Policy ${isNew ? 'created' : 'updated'} successfully!`);
      setIsEditModalOpen(false);
      fetchPolicies();
    } catch (err: any) {
      console.error('Error saving policy:', err);
      console.error('Error details:', err.response?.data);
      alert(err.response?.data?.error || 'Failed to save policy');
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
        <button 
          onClick={() => {
            setSelectedPolicy(null);
            setDocumentFile(null);
            setFormData({
              clientName: '',
              mobileNumber: '',
              clientEmail: '',
              policyType: 'Motor',
              vehicleNumber: '',
              policyNumber: '',
              insurer: '',
              issueDate: new Date().toISOString().split('T')[0],
              expiryDate: '',
              sumInsured: '',
              annualPremium: '',
            });
            setIsEditModalOpen(true);
          }}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <PlusCircle size={20} /> Add Policy
        </button>
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
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
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
                      <span className={`badge ${p.status.toLowerCase()}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-3" style={{ justifyContent: 'center' }}>
                        <button 
                          onClick={() => handleEditClick(p)}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                          title="Edit Policy"
                        >
                          <Edit3 size={20} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(p._id)}
                          style={{ background: 'none', border: 'none', color: '#ea4335', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                          title="Delete Policy"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Policy Modal */}
      {isEditModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, backdropFilter: 'blur(10px)', padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', padding: '3rem', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button 
              onClick={() => setIsEditModalOpen(false)}
              style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={28} />
            </button>

            <div className="flex items-center gap-3" style={{ marginBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem' }}>
              {selectedPolicy ? <Edit3 size={32} color="#1DD3B0" /> : <PlusCircle size={32} color="#1DD3B0" />}
              <h3 style={{ fontSize: '2.2rem', margin: 0, fontWeight: 700 }}>{selectedPolicy ? 'Edit Policy' : 'New Policy'}</h3>
            </div>

            <form onSubmit={handleUpdatePolicy} className="flex-col gap-10">
              {/* Section 1: Client Details */}
              <div className="flex-col gap-6">
                <h4 style={{ color: '#1DD3B0', fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>1. Client Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '1.5rem' }}>
                  <div className="flex-col gap-2">
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Full Name *</label>
                    <input required value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} style={{ backgroundColor: '#16191e' }} />
                  </div>
                  <div className="flex-col gap-2">
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Mobile Number *</label>
                    <input required value={formData.mobileNumber} onChange={e => setFormData({...formData, mobileNumber: e.target.value})} style={{ backgroundColor: '#16191e' }} />
                  </div>
                  <div className="flex-col gap-2">
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email Address</label>
                    <input type="email" value={formData.clientEmail} onChange={e => setFormData({...formData, clientEmail: e.target.value})} style={{ backgroundColor: '#16191e' }} />
                  </div>
                </div>
              </div>

              {/* Section 2: Policy Details */}
              <div className="flex-col gap-6">
                <h4 style={{ color: '#1DD3B0', fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>2. Policy Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
                  <div className="flex-col gap-2">
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Policy Type *</label>
                    <select value={formData.policyType} onChange={e => setFormData({...formData, policyType: e.target.value})} style={{ backgroundColor: '#16191e' }}>
                      <option value="Motor">Motor Insurance</option>
                      <option value="Home">Home Insurance</option>
                      <option value="Travel">Travel Insurance</option>
                    </select>
                  </div>
                  <div className="flex-col gap-2">
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Insurer Company *</label>
                    <input required value={formData.insurer} onChange={e => setFormData({...formData, insurer: e.target.value})} style={{ backgroundColor: '#16191e' }} />
                  </div>
                </div>
                {formData.policyType === 'Motor' && (
                  <div className="flex-col gap-2" style={{ maxWidth: '300px' }}>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Vehicle Number *</label>
                    <input required value={formData.vehicleNumber} onChange={e => setFormData({...formData, vehicleNumber: e.target.value})} style={{ backgroundColor: '#16191e' }} />
                  </div>
                )}
                <div className="flex-col gap-2">
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Policy Number *</label>
                  <input required value={formData.policyNumber} onChange={e => setFormData({...formData, policyNumber: e.target.value})} style={{ backgroundColor: '#16191e' }} />
                </div>
              </div>

              {/* Section 3: Financials & Dates */}
              <div className="flex-col gap-6">
                <h4 style={{ color: '#1DD3B0', fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>3. Financials & Dates</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.2rem' }}>
                  <div className="flex-col gap-2">
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Issue Date *</label>
                    <input type="date" required value={formData.issueDate} onChange={e => setFormData({...formData, issueDate: e.target.value})} style={{ backgroundColor: '#16191e' }} />
                  </div>
                  <div className="flex-col gap-2">
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Expiry Date *</label>
                    <input type="date" required value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} style={{ backgroundColor: '#16191e' }} />
                  </div>
                  <div className="flex-col gap-2">
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Sum Insured (₹)*</label>
                    <input type="number" required value={formData.sumInsured} onChange={e => setFormData({...formData, sumInsured: e.target.value})} style={{ backgroundColor: '#16191e' }} />
                  </div>
                  <div className="flex-col gap-2">
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Annual Premium (₹)*</label>
                    <input type="number" required value={formData.annualPremium} onChange={e => setFormData({...formData, annualPremium: e.target.value})} style={{ backgroundColor: '#16191e' }} />
                  </div>
                </div>
              </div>

              <div className="flex-col gap-2">
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Policy Document (PDF/JPG/PNG) {!selectedPolicy && '*'}</label>
                <input 
                  type="file"
                  required={!selectedPolicy}
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setDocumentFile(e.target.files?.[0] || null)}
                  style={{ backgroundColor: '#16191e', padding: '0.6rem' }} 
                />
                {selectedPolicy && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Current: {selectedPolicy?.attachedDocument || 'No document'}
                  </div>
                )}
              </div>

              <div className="flex gap-4" style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2.5rem' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-secondary" style={{ flex: 1, padding: '1rem' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 2, padding: '1rem', fontWeight: 700, backgroundColor: '#1DD3B0', color: '#000' }}>Update Policy</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              <button onClick={() => setIsDeleteModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button 
                onClick={confirmDelete} 
                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', backgroundColor: '#ea4335', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
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
