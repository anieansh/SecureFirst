import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, PlusCircle, X, ShieldCheck, Edit3, Trash2, MoreVertical, FilePlus } from 'lucide-react';

const API_URL = 'https://api.securefirst.co/api/leads';
const POLICY_API = 'https://api.securefirst.co/api/policy';

const Leads = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Policy Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
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

  // Edit Lead State
  const [isEditLeadModalOpen, setIsEditLeadModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<any>(null);
  const [editLeadData, setEditLeadData] = useState({
    name: '',
    mobileNumber: '',
    policyType: 'Motor',
    carCondition: 'Old',
    carName: '',
    exShowroomPrice: '',
    vehicleNumber: ''
  });

  // Delete Lead State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      setLeads(res.data.data || res.data);
    } catch (err) {
      console.error('Error fetching leads', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleAddPolicy = (lead: any) => {
    setSelectedLead(lead);
    setDocumentFile(null);
    setFormData({
      clientName: lead.name,
      mobileNumber: lead.mobileNumber,
      clientEmail: '',
      policyType: lead.policyType || 'Motor',
      vehicleNumber: lead.vehicleNumber || '',
      policyNumber: '',
      insurer: '',
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      sumInsured: '',
      annualPremium: '',
    });
    setIsModalOpen(true);
  };

  const handleEditLead = (lead: any) => {
    setLeadToEdit(lead);
    setEditLeadData({
      name: lead.name,
      mobileNumber: lead.mobileNumber,
      policyType: lead.policyType,
      carCondition: lead.carCondition || 'Old',
      carName: lead.carName || '',
      exShowroomPrice: lead.exShowroomPrice || '',
      vehicleNumber: lead.vehicleNumber || ''
    });
    setIsEditLeadModalOpen(true);
  };

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/${leadToEdit._id}`, editLeadData, {
        headers: { 'X-API-Key': '1f39bc30096f61eb69144d2534136ecfe431f87d57ceb6ab3ed0be9f21866a92' }
      });
      alert('Lead updated successfully');
      setIsEditLeadModalOpen(false);
      fetchLeads();
    } catch (err) {
      console.error('Error updating lead', err);
      alert('Failed to update lead');
    }
  };

  const handleDeleteClick = (id: string) => {
    setLeadToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!leadToDelete) return;
    try {
      await axios.delete(`${API_URL}/${leadToDelete}`, {
        headers: { 'X-API-Key': '1f39bc30096f61eb69144d2534136ecfe431f87d57ceb6ab3ed0be9f21866a92' }
      });
      alert('Lead deleted successfully');
      setIsDeleteModalOpen(false);
      fetchLeads();
    } catch (err) {
      console.error('Error deleting lead', err);
      alert('Failed to delete lead');
    }
  };

  const handleSubmitPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentFile) {
      alert('Please upload a policy document');
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    data.append('document', documentFile);

    try {
      console.log('Submitting Policy Data:', formData);
      const res = await axios.post(POLICY_API, data, {
        headers: { 
          'X-API-Key': '1f39bc30096f61eb69144d2534136ecfe431f87d57ceb6ab3ed0be9f21866a92'
        }
      });
      console.log('Policy Creation Response:', res.data);
      alert('Policy created successfully!');
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error creating policy:', err);
      console.error('Error details:', err.response?.data);
      alert(err.response?.data?.error || 'Failed to create policy');
    }
  };

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) || 
    l.mobileNumber.includes(search)
  );

  return (
    <div className="flex-col gap-4">
      <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '2rem' }}>Sales Leads</h2>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <div className="flex gap-4 items-center" style={{ marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search leads by name or mobile..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem', marginBottom: 0 }}
            />
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <p>Loading leads...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Mobile Number</th>
                  <th>Interested Policy</th>
                  <th>Car Condition</th>
                  <th>Details / Docs</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((l) => (
                  <tr key={l._id}>
                    <td style={{ fontWeight: 500, color: 'var(--accent-gold)' }}>{l.name}</td>
                    <td>{l.mobileNumber}</td>
                    <td>{l.policyType}</td>
                    <td>{l.carCondition || '-'}</td>
                    <td>
                      {l.carCondition === 'New' ? (
                        <div style={{ fontSize: '0.85rem', textAlign: 'center' }}>
                          <div><span style={{color: 'var(--text-secondary)'}}>Model:</span> {l.carName || '-'}</div>
                          <div><span style={{color: 'var(--text-secondary)'}}>Price:</span> {l.exShowroomPrice ? `₹${l.exShowroomPrice}` : '-'}</div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.85rem', textAlign: 'center' }}>
                          {l.vehicleNumber && <div><span style={{color: 'var(--text-secondary)'}}>Reg No:</span> <strong style={{color: 'var(--accent-gold)'}}>{l.vehicleNumber}</strong></div>}
                          <div className="flex gap-2" style={{ marginTop: l.vehicleNumber ? '4px' : 0, justifyContent: 'center' }}>
                            {l.rcImagePath && <a href={`https://api.securefirst.co${l.rcImagePath}`} target="_blank" rel="noreferrer" style={{color: 'var(--accent-gold)', textDecoration: 'underline'}}>RC</a>}
                            {l.previousPolicyPath && <a href={`https://api.securefirst.co${l.previousPolicyPath}`} target="_blank" rel="noreferrer" style={{color: 'var(--accent-gold)', textDecoration: 'underline'}}>Prev</a>}
                          </div>
                        </div>
                      )}
                    </td>
                    <td>{new Date(l.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="flex gap-3" style={{ justifyContent: 'center', position: 'relative' }}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === l._id ? null : l._id);
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 8 }}
                        >
                          <MoreVertical size={20} />
                        </button>

                        {openMenuId === l._id && (
                          <div style={{
                            position: 'absolute', top: '100%', right: 0,
                            backgroundColor: '#1a1d23', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px', zIndex: 100, width: '180px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)', overflow: 'hidden'
                          }}>
                            <button 
                              onClick={() => handleAddPolicy(l)}
                              style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', color: '#1DD3B0', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
                            >
                              <FilePlus size={16} /> Issue Policy
                            </button>
                            <button 
                              onClick={() => handleEditLead(l)}
                              style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
                            >
                              <Edit3 size={16} /> Edit Lead
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(l._id)}
                              style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', color: '#ea4335', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
                            >
                              <Trash2 size={16} /> Delete Lead
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Lead Modal */}
      {isEditLeadModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, backdropFilter: 'blur(10px)', padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '3rem', position: 'relative' }}>
            <button onClick={() => setIsEditLeadModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '2rem' }}>Edit Lead</h3>
            <form onSubmit={handleUpdateLead} className="flex-col gap-4">
              <div className="flex-col gap-2">
                <label>Name</label>
                <input required value={editLeadData.name} onChange={e => setEditLeadData({...editLeadData, name: e.target.value})} />
              </div>
              <div className="flex-col gap-2">
                <label>Mobile</label>
                <input required value={editLeadData.mobileNumber} onChange={e => setEditLeadData({...editLeadData, mobileNumber: e.target.value})} />
              </div>
              <div className="flex-col gap-2">
                <label>Policy Type</label>
                <select value={editLeadData.policyType} onChange={e => setEditLeadData({...editLeadData, policyType: e.target.value})}>
                  <option value="Motor">Motor</option>
                  <option value="Home">Home</option>
                  <option value="Travel">Travel</option>
                </select>
              </div>
              {editLeadData.policyType === 'Motor' && (
                <>
                  <div className="flex-col gap-2">
                    <label>Vehicle Number</label>
                    <input value={editLeadData.vehicleNumber} onChange={e => setEditLeadData({...editLeadData, vehicleNumber: e.target.value})} />
                  </div>
                  <div className="flex-col gap-2">
                    <label>Car Condition</label>
                    <select value={editLeadData.carCondition} onChange={e => setEditLeadData({...editLeadData, carCondition: e.target.value})}>
                      <option value="New">New</option>
                      <option value="Old">Old</option>
                    </select>
                  </div>
                </>
              )}
              <div className="flex gap-4" style={{ marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsEditLeadModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Update Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, backdropFilter: 'blur(10px)'
        }}>
          <div className="glass-panel" style={{ width: '400px', padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Delete Lead?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>This action cannot be undone.</p>
            <div className="flex gap-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={confirmDelete} className="btn-primary" style={{ flex: 1, backgroundColor: '#ea4335' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Policy Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, backdropFilter: 'blur(10px)', padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', padding: '3rem', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={28} />
            </button>

            <div className="flex items-center gap-3" style={{ marginBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem' }}>
              <PlusCircle size={32} color="#1DD3B0" />
              <h3 style={{ fontSize: '2.2rem', margin: 0, fontWeight: 700 }}>New Policy</h3>
            </div>

            <form onSubmit={handleSubmitPolicy} className="flex-col gap-10">
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
                    <input required value={formData.insurer} onChange={e => setFormData({...formData, insurer: e.target.value})} placeholder="e.g. HDFC Ergo, ICICI Lombard" style={{ backgroundColor: '#16191e' }} />
                  </div>
                </div>
                {formData.policyType === 'Motor' && (
                  <div className="flex-col gap-2" style={{ maxWidth: '300px' }}>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Vehicle Number *</label>
                    <input required value={formData.vehicleNumber} onChange={e => setFormData({...formData, vehicleNumber: e.target.value})} placeholder="e.g. HR07AV5645" style={{ backgroundColor: '#16191e' }} />
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
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Policy Document (PDF/JPG/PNG) *</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input 
                    type="file"
                    required 
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => setDocumentFile(e.target.files?.[0] || null)}
                    style={{ backgroundColor: '#16191e', flex: 1, padding: '0.6rem' }} 
                  />
                </div>
              </div>

              <div className="flex gap-4" style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1, padding: '1rem' }}>Discard</button>
                <button type="submit" className="btn-primary" style={{ flex: 2, padding: '1rem', fontWeight: 700, backgroundColor: '#1DD3B0', color: '#000' }}>Confirm & Issue Policy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
