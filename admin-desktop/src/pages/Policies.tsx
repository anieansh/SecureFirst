import { useState, useEffect } from 'react';
import axios from 'axios';
import { Filter, Search, Trash2, Edit3, X, PlusCircle, MoreVertical, Download } from 'lucide-react';

const API_URL = 'https://api.securefirst.co/api/policies';
const POLICY_API_BASE = 'https://api.securefirst.co/api/policy';

const Policies = () => {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filter, setFilter] = useState('All'); // All, Active, Expiring, Expired
  const [search, setSearch] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.action-menu-container')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Policy details modal state (Client name click)
  const [detailPolicy, setDetailPolicy] = useState<any | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    clientName: '',
    policyHolderName: '',
    mobileNumber: '',
    clientEmail: '',
    policyType: 'Motor',
    vehicleType: '',
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

  const handleDownloadPolicy = async (policy: any) => {
    if (!policy.attachedDocument) {
      alert('No document attached to this policy');
      return;
    }
    try {
      const url = `https://api.securefirst.co/uploads/${policy.attachedDocument}`;
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = policy.attachedDocument;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed', error);
      alert('Failed to download document');
    }
  };

  const handleEditClick = (policy: any) => {
    setSelectedPolicy(policy);
    setDocumentFile(null);
    setFormData({
      clientName: policy.clientName,
      policyHolderName: policy.policyHolderName || '',
      mobileNumber: policy.mobileNumber,
      clientEmail: policy.clientEmail || '',
      policyType: policy.policyType,
      vehicleType: policy.vehicleType || '',
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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter, itemsPerPage]);

  const filteredPolicies = policies.filter(p => {
    const matchesFilter = filter === 'All' || p.status === filter;
    const matchesSearch = p.clientName.toLowerCase().includes(search.toLowerCase()) || 
                          p.mobileNumber.includes(search) || 
                          (p.policyHolderName && p.policyHolderName.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const totalItems = filteredPolicies.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPolicies = filteredPolicies.slice(indexOfFirstItem, indexOfLastItem);

  if (detailPolicy) {
    return (
      <div className="flex-col gap-4">
        {/* Back Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => setDetailPolicy(null)}
            style={{
              background: 'none', border: 'none', color: 'var(--accent-gold)', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '1.1rem', fontWeight: 600, padding: 0
            }}
          >
            &larr; Back to Policies
          </button>
        </div>

        {/* Policy Details Card */}
        <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '2.2rem', marginBottom: '0.5rem', fontWeight: 700, color: '#1DD3B0' }}>Policy: {detailPolicy.policyNumber}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Full policy details and coverage parameters</p>
            </div>
            <div>
              <span className={`badge ${detailPolicy.policyType.toLowerCase()}`} style={{ fontSize: '0.9rem', padding: '0.4rem 1rem', background: 'rgba(29, 211, 176, 0.1)', color: '#1DD3B0', border: '1px solid #1DD3B0' }}>
                {detailPolicy.policyType}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Policy Holder Name</label>
              <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 600 }}>{detailPolicy.policyHolderName || 'N/A'}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Client Name</label>
              <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 600 }}>{detailPolicy.clientName}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Mobile Number</label>
              <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 600 }}>{detailPolicy.mobileNumber}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Policy Type</label>
              <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 600 }}>{detailPolicy.policyType}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Insurer Company</label>
              <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 600 }}>{detailPolicy.insurer}</div>
            </div>
            {detailPolicy.policyType === 'Motor' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Vehicle Number</label>
                  <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 600 }}>{detailPolicy.vehicleNumber || 'N/A'}</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Vehicle Type</label>
                  <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 600 }}>{detailPolicy.vehicleType || 'N/A'}</div>
                </div>
              </>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Issue Date</label>
              <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 600 }}>{new Date(detailPolicy.issueDate).toLocaleDateString()}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Expiry Date</label>
              <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 600 }}>{new Date(detailPolicy.expiryDate).toLocaleDateString()}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Sum Insured</label>
              <div style={{ fontSize: '1.3rem', color: 'var(--accent-gold)', fontWeight: 700 }}>₹{detailPolicy.sumInsured ? detailPolicy.sumInsured.toLocaleString() : '0'}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Annual Premium</label>
              <div style={{ fontSize: '1.3rem', color: 'var(--accent-gold)', fontWeight: 700 }}>₹{detailPolicy.annualPremium ? detailPolicy.annualPremium.toLocaleString() : '0'}</div>
            </div>
          </div>

          {detailPolicy.attachedDocument && (
            <div style={{ marginTop: '2.5rem', padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Attached Policy Document</span>
                <span style={{ fontSize: '1rem', color: '#fff', fontWeight: 500, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '400px' }}>
                  {detailPolicy.attachedDocument}
                </span>
              </div>
              <button 
                onClick={() => handleDownloadPolicy(detailPolicy)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', backgroundColor: '#1DD3B0', color: '#000', padding: '0.75rem 1.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}
              >
                <Download size={16} /> Download Document
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-col gap-4">
      <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '2rem' }}>Policy Portfolio</h2>
        {/* Top-right Add Policy button removed, replaced with bottom-right FAB */}
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <div className="flex gap-4 items-center" style={{ marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search by client, policy holder or mobile..." 
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Show:</span>
            <select 
              value={itemsPerPage} 
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              style={{ width: '80px', padding: '0.4rem', borderRadius: '6px', backgroundColor: '#16191e', color: '#fff', border: '1px solid var(--border-light)', cursor: 'pointer', margin: 0 }}
            >
              {[10, 20, 30, 40, 50, 100].map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <p>Loading policies...</p>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th className="sticky-col">Client Name</th>
                    <th>Policy Holder</th>
                    <th>Vehicle Type</th>
                    <th>Vehicle Num</th>
                    <th>Expiry Date</th>
                    <th>Premium</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPolicies.map((p) => (
                    <tr key={p._id}>
                      <td className="sticky-col" style={{ fontWeight: 500, color: 'var(--accent-gold)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setDetailPolicy(p)}>
                        {p.clientName}
                      </td>
                      <td>{p.policyHolderName || 'N/A'}</td>
                      <td>{p.vehicleType || '-'}</td>
                      <td>{p.vehicleNumber || '-'}</td>
                      <td>{new Date(p.expiryDate).toLocaleDateString()}</td>
                      <td>₹{p.annualPremium.toLocaleString()}</td>
                      <td>
                        <span className={`badge ${p.status.toLowerCase()}`}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ position: 'relative', zIndex: openDropdownId === p._id ? 50 : 1 }} className="action-menu-container">
                        <div className="flex gap-3" style={{ justifyContent: 'center' }}>
                          <button 
                            onClick={() => setOpenDropdownId(openDropdownId === p._id ? null : p._id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                          >
                            <MoreVertical size={20} />
                          </button>
                          {openDropdownId === p._id && (
                            <div style={{ 
                              position: 'absolute', right: '50%', top: '70%', 
                              backgroundColor: '#16191e', border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px', padding: '0.5rem', zIndex: 10,
                              display: 'flex', flexDirection: 'column', gap: '0.5rem',
                              minWidth: '160px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                            }}>
                              <button 
                                onClick={() => { handleDownloadPolicy(p); setOpenDropdownId(null); }}
                                style={{ background: 'none', border: 'none', color: '#1DD3B0', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left', borderRadius: '4px' }}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <Download size={16} /> Download Policy
                              </button>
                              <button 
                                onClick={() => { handleEditClick(p); setOpenDropdownId(null); }}
                                style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left', borderRadius: '4px' }}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <Edit3 size={16} /> Edit
                              </button>
                              <button 
                                onClick={() => { handleDeleteClick(p._id); setOpenDropdownId(null); }}
                                style={{ background: 'none', border: 'none', color: '#ea4335', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left', borderRadius: '4px' }}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <Trash2 size={16} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentPolicies.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No policies found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1.5rem 0 0', borderTop: '1px solid var(--border-light)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, totalItems)} of {totalItems} policies
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button 
                      onClick={() => { if (currentPage > 1) setCurrentPage(currentPage - 1); }} 
                      disabled={currentPage === 1}
                      style={{
                        padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-light)',
                        backgroundColor: currentPage === 1 ? 'transparent' : '#16191e',
                        color: currentPage === 1 ? 'var(--text-secondary)' : '#fff',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '0.9rem', opacity: currentPage === 1 ? 0.4 : 1
                      }}
                    >
                      Prev
                    </button>
                    
                    <span style={{ color: '#fff', fontSize: '0.95rem', padding: '0 0.5rem' }}>
                      Page {currentPage} of {totalPages}
                    </span>

                    <button 
                      onClick={() => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); }} 
                      disabled={currentPage === totalPages}
                      style={{
                        padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-light)',
                        backgroundColor: currentPage === totalPages ? 'transparent' : '#16191e',
                        color: currentPage === totalPages ? 'var(--text-secondary)' : '#fff',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '0.9rem', opacity: currentPage === totalPages ? 0.4 : 1
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="flex-col gap-2">
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Client Name *</label>
                    <input required value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} style={{ backgroundColor: '#16191e' }} />
                  </div>
                  <div className="flex-col gap-2">
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Policy Holder Name *</label>
                    <input required value={formData.policyHolderName} onChange={e => setFormData({...formData, policyHolderName: e.target.value})} style={{ backgroundColor: '#16191e' }} />
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="flex-col gap-2">
                      <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Vehicle Type *</label>
                      <input required value={formData.vehicleType} onChange={e => setFormData({...formData, vehicleType: e.target.value})} style={{ backgroundColor: '#16191e' }} placeholder="Enter Vehicle Type" />
                    </div>
                    <div className="flex-col gap-2">
                      <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Vehicle Number *</label>
                      <input required value={formData.vehicleNumber} onChange={e => setFormData({...formData, vehicleNumber: e.target.value})} style={{ backgroundColor: '#16191e' }} />
                    </div>
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

      {/* Floating Action Button (FAB) for adding policy */}
      <button 
        onClick={() => {
          setSelectedPolicy(null);
          setDocumentFile(null);
          setFormData({
            clientName: '',
            policyHolderName: '',
            mobileNumber: '',
            clientEmail: '',
            policyType: 'Motor',
            vehicleType: '',
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
        style={{ 
          position: 'fixed', bottom: '2rem', right: '2rem', 
          borderRadius: '50%', width: '56px', height: '56px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(29, 211, 176, 0.4)', zIndex: 99
        }}
        title="Add Policy"
      >
        <PlusCircle size={28} />
      </button>
    </div>
  );
};

export default Policies;
