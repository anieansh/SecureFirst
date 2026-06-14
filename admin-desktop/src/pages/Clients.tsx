import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Edit, Trash2, X, Download } from 'lucide-react';

const API_URL = 'https://api.securefirst.co/api/clients';
const CLIENT_API_BASE = 'https://api.securefirst.co/api/client';
const POLICY_API_BASE = 'https://api.securefirst.co/api/policy';

const Clients = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({ name: '', email: '', mobileNumber: '' });

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Details Modal State
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<any | null>(null);

  // Policy Edit / Delete States
  const [isPolicyEditOpen, setIsPolicyEditOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any | null>(null);
  const [policyDocumentFile, setPolicyDocumentFile] = useState<File | null>(null);
  const [policyFormData, setPolicyFormData] = useState({
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

  const [isPolicyDeleteOpen, setIsPolicyDeleteOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<string | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      const updatedClients = res.data.data || res.data;
      setClients(updatedClients);

      // Refresh current client snapshot if inside details screen view
      if (selectedClient) {
        const freshClient = updatedClients.find((c: any) => c.mobileNumber === selectedClient.mobileNumber);
        if (freshClient) {
          setSelectedClient(freshClient);
        } else {
          setSelectedClient(null);
        }
      }
    } catch (err) {
      console.error('Error fetching clients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDeleteClick = (mobile: string) => {
    setClientToDelete(mobile);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    try {
      await axios.delete(`${CLIENT_API_BASE}/${clientToDelete}`, {
        headers: {
          'X-API-Key': '1f39bc30096f61eb69144d2534136ecfe431f87d57ceb6ab3ed0be9f21866a92'
        }
      });
      alert('Client deleted successfully');
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
      fetchClients();
    } catch (err) {
      console.error('Error deleting client', err);
      alert('Failed to delete client');
    }
  };

  const handleEditClick = (client: any) => {
    setEditingClient(client);
    setEditFormData({ 
      name: client.name, 
      email: client.email === 'N/A' ? '' : client.email, 
      mobileNumber: client.mobileNumber 
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`${CLIENT_API_BASE}/${editingClient.mobileNumber}`, {
        name: editFormData.name,
        email: editFormData.email,
        newMobile: editFormData.mobileNumber
      }, {
        headers: {
          'X-API-Key': '1f39bc30096f61eb69144d2534136ecfe431f87d57ceb6ab3ed0be9f21866a92'
        }
      });
      alert('Client updated successfully');
      setIsEditModalOpen(false);
      fetchClients();
    } catch (err) {
      console.error('Error updating client', err);
      alert('Failed to update client');
    }
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

  const handlePolicyEditClick = (policy: any) => {
    setEditingPolicy(policy);
    setPolicyDocumentFile(null);
    setPolicyFormData({
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
    setIsPolicyEditOpen(true);
  };

  const handlePolicyUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(policyFormData).forEach(([key, value]) => {
      data.append(key, value);
    });
    if (policyDocumentFile) {
      data.append('document', policyDocumentFile);
    }

    try {
      const url = `${POLICY_API_BASE}/${editingPolicy._id}`;
      await axios.put(url, data, {
        headers: { 
          'X-API-Key': '1f39bc30096f61eb69144d2534136ecfe431f87d57ceb6ab3ed0be9f21866a92'
        }
      });
      alert('Policy updated successfully!');
      setIsPolicyEditOpen(false);
      fetchClients();
    } catch (err: any) {
      console.error('Error updating policy:', err);
      alert(err.response?.data?.error || 'Failed to update policy');
    }
  };

  const confirmPolicyDelete = async () => {
    if (!policyToDelete) return;
    try {
      await axios.delete(`${POLICY_API_BASE}/${policyToDelete}`, {
        headers: { 'X-API-Key': '1f39bc30096f61eb69144d2534136ecfe431f87d57ceb6ab3ed0be9f21866a92' }
      });
      alert('Policy deleted successfully');
      setIsPolicyDeleteOpen(false);
      setPolicyToDelete(null);
      fetchClients();
    } catch (err) {
      console.error('Error deleting policy', err);
      alert('Failed to delete policy');
    }
  };

  // Reset page if search or limit changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.mobileNumber.includes(search)
  );

  const totalItems = filteredClients.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstItem, indexOfLastItem);

  if (selectedPolicy) {
    return (
      <div className="flex-col gap-4">
        {/* Back Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => setSelectedPolicy(null)}
            style={{
              background: 'none', border: 'none', color: 'var(--accent-gold)', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '1.1rem', fontWeight: 600, padding: 0
            }}
          >
            &larr; Back to Client Profile
          </button>
        </div>

        {/* Policy Details Card */}
        <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '2.2rem', marginBottom: '0.5rem', fontWeight: 700, color: '#1DD3B0' }}>Policy: {selectedPolicy.policyNumber}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Full policy details and coverage parameters</p>
            </div>
            <div>
              <span className={`badge ${selectedPolicy.policyType.toLowerCase()}`} style={{ fontSize: '0.9rem', padding: '0.4rem 1rem', background: 'rgba(29, 211, 176, 0.1)', color: '#1DD3B0', border: '1px solid #1DD3B0' }}>
                {selectedPolicy.policyType}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Policy Holder Name</label>
              <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 600 }}>{selectedPolicy.policyHolderName || 'N/A'}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Client Name</label>
              <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 600 }}>{selectedPolicy.clientName}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Insurer Company</label>
              <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 600 }}>{selectedPolicy.insurer}</div>
            </div>
            {selectedPolicy.policyType === 'Motor' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Vehicle Number</label>
                  <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 600 }}>{selectedPolicy.vehicleNumber || 'N/A'}</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Vehicle Type</label>
                  <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 600 }}>{selectedPolicy.vehicleType || 'N/A'}</div>
                </div>
              </>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Issue Date</label>
              <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 600 }}>{new Date(selectedPolicy.issueDate).toLocaleDateString()}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Expiry Date</label>
              <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 600 }}>{new Date(selectedPolicy.expiryDate).toLocaleDateString()}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Sum Insured</label>
              <div style={{ fontSize: '1.3rem', color: 'var(--accent-gold)', fontWeight: 700 }}>₹{selectedPolicy.sumInsured ? selectedPolicy.sumInsured.toLocaleString() : '0'}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Annual Premium</label>
              <div style={{ fontSize: '1.3rem', color: 'var(--accent-gold)', fontWeight: 700 }}>₹{selectedPolicy.annualPremium ? selectedPolicy.annualPremium.toLocaleString() : '0'}</div>
            </div>
          </div>

          {selectedPolicy.attachedDocument && (
            <div style={{ marginTop: '2.5rem', padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Attached Policy Document</span>
                <span style={{ fontSize: '1rem', color: '#fff', fontWeight: 500, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '400px' }}>
                  {selectedPolicy.attachedDocument}
                </span>
              </div>
              <button 
                onClick={() => handleDownloadPolicy(selectedPolicy)}
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

  if (selectedClient) {
    return (
      <div className="flex-col gap-4">
        {/* Back Button and Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => { setSelectedClient(null); setSelectedPolicy(null); }}
            style={{
              background: 'none', border: 'none', color: 'var(--accent-gold)', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '1.1rem', fontWeight: 600, padding: 0
            }}
          >
            &larr; Back to Directory
          </button>
        </div>

        {/* Client Profile Details Section */}
        <div className="glass-panel" style={{ marginBottom: '2rem', padding: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '2.2rem', marginBottom: '0.5rem', fontWeight: 700, color: 'var(--accent-gold)' }}>{selectedClient.name}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Client Profile Details</p>
            </div>
            <div>
              <span className={`badge ${selectedClient.status.toLowerCase()}`} style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
                {selectedClient.status}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginTop: '2.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Mobile Number</label>
              <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 600 }}>{selectedClient.mobileNumber}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Email Address</label>
              <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 600 }}>{selectedClient.email}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Policies</label>
              <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 600 }}>{selectedClient.numberOfPolicies}</div>
            </div>
          </div>
        </div>

        {/* Policies List Section */}
        <div className="glass-panel" style={{ marginBottom: '2rem', padding: '2.5rem' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 600 }}>Associated Policies</h3>
          
          <div className="table-wrapper">
            {selectedClient.policies && selectedClient.policies.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Policy Holder</th>
                    <th>Policy Type</th>
                    <th>Policy Number</th>
                    <th>Insurer</th>
                    <th>Expiry Date</th>
                    <th>Premium</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedClient.policies.map((p: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500, color: 'var(--accent-gold)' }}>{p.policyHolderName || selectedClient.name}</td>
                      <td>{p.policyType}</td>
                      <td>{p.policyNumber}</td>
                      <td>{p.insurer}</td>
                      <td>{new Date(p.expiryDate).toLocaleDateString()}</td>
                      <td>₹{p.annualPremium ? p.annualPremium.toLocaleString() : '0'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                          <button 
                            onClick={() => setSelectedPolicy(p)}
                            style={{ 
                              padding: '0.4rem 0.8rem', borderRadius: '6px', backgroundColor: '#16191e', 
                              color: '#fff', border: '1px solid var(--border-light)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem'
                            }}
                          >
                            Details
                          </button>
                          <button 
                            onClick={() => handlePolicyEditClick(p)}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', padding: 4 }}
                            title="Edit Policy"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => { setPolicyToDelete(p._id); setIsPolicyDeleteOpen(true); }}
                            style={{ background: 'none', border: 'none', color: '#ea4335', cursor: 'pointer', padding: 4 }}
                            title="Delete Policy"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No policies found for this client.</p>
            )}
          </div>
        </div>

        {/* Policy Edit Modal */}
        {isPolicyEditOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(4px)'
          }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', position: 'relative' }}>
              <button 
                onClick={() => setIsPolicyEditOpen(false)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>

              <div className="flex items-center gap-3" style={{ marginBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '2.2rem', margin: 0, fontWeight: 700 }}>Edit Policy</h3>
              </div>

              <form onSubmit={handlePolicyUpdateSubmit} className="flex-col gap-10">
                {/* Section 1: Client Details */}
                <div className="flex-col gap-6" style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: '#1DD3B0', fontSize: '1.2rem', fontWeight: 600, margin: '0 0 1rem 0' }}>1. Client Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="flex-col gap-2">
                      <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Client Name *</label>
                      <input required value={policyFormData.clientName} onChange={e => setPolicyFormData({...policyFormData, clientName: e.target.value})} style={{ backgroundColor: '#16191e' }} />
                    </div>
                    <div className="flex-col gap-2">
                      <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Policy Holder Name *</label>
                      <input required value={policyFormData.policyHolderName} onChange={e => setPolicyFormData({...policyFormData, policyHolderName: e.target.value})} style={{ backgroundColor: '#16191e' }} />
                    </div>
                    <div className="flex-col gap-2">
                      <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Mobile Number *</label>
                      <input required value={policyFormData.mobileNumber} onChange={e => setPolicyFormData({...policyFormData, mobileNumber: e.target.value})} style={{ backgroundColor: '#16191e' }} />
                    </div>
                    <div className="flex-col gap-2">
                      <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email Address</label>
                      <input type="email" value={policyFormData.clientEmail} onChange={e => setPolicyFormData({...policyFormData, clientEmail: e.target.value})} style={{ backgroundColor: '#16191e' }} />
                    </div>
                  </div>
                </div>

                {/* Section 2: Policy Details */}
                <div className="flex-col gap-6" style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: '#1DD3B0', fontSize: '1.2rem', fontWeight: 600, margin: '0 0 1rem 0' }}>2. Policy Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
                    <div className="flex-col gap-2">
                      <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Policy Type *</label>
                      <select value={policyFormData.policyType} onChange={e => setPolicyFormData({...policyFormData, policyType: e.target.value})} style={{ backgroundColor: '#16191e', color: '#fff', padding: '0.6rem', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                        <option value="Motor">Motor Insurance</option>
                        <option value="Home">Home Insurance</option>
                        <option value="Travel">Travel Insurance</option>
                      </select>
                    </div>
                    <div className="flex-col gap-2">
                      <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Insurer Company *</label>
                      <input required value={policyFormData.insurer} onChange={e => setPolicyFormData({...policyFormData, insurer: e.target.value})} style={{ backgroundColor: '#16191e' }} />
                    </div>
                  </div>
                  {policyFormData.policyType === 'Motor' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                      <div className="flex-col gap-2">
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Vehicle Type *</label>
                        <input required value={policyFormData.vehicleType} onChange={e => setPolicyFormData({...policyFormData, vehicleType: e.target.value})} style={{ backgroundColor: '#16191e', color: '#fff', padding: '0.6rem', border: '1px solid var(--border-light)', borderRadius: '6px' }} placeholder="Enter Vehicle Type" />
                      </div>
                      <div className="flex-col gap-2">
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Vehicle Number *</label>
                        <input required value={policyFormData.vehicleNumber} onChange={e => setPolicyFormData({...policyFormData, vehicleNumber: e.target.value})} style={{ backgroundColor: '#16191e' }} />
                      </div>
                    </div>
                  )}
                  <div className="flex-col gap-2" style={{ marginTop: '1.5rem' }}>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Policy Number *</label>
                    <input required value={policyFormData.policyNumber} onChange={e => setPolicyFormData({...policyFormData, policyNumber: e.target.value})} style={{ backgroundColor: '#16191e' }} />
                  </div>
                </div>

                {/* Section 3: Financials & Dates */}
                <div className="flex-col gap-6" style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: '#1DD3B0', fontSize: '1.2rem', fontWeight: 600, margin: '0 0 1rem 0' }}>3. Financials & Dates</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.2rem' }}>
                    <div className="flex-col gap-2">
                      <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Issue Date *</label>
                      <input type="date" required value={policyFormData.issueDate} onChange={e => setPolicyFormData({...policyFormData, issueDate: e.target.value})} style={{ backgroundColor: '#16191e' }} />
                    </div>
                    <div className="flex-col gap-2">
                      <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Expiry Date *</label>
                      <input type="date" required value={policyFormData.expiryDate} onChange={e => setPolicyFormData({...policyFormData, expiryDate: e.target.value})} style={{ backgroundColor: '#16191e' }} />
                    </div>
                    <div className="flex-col gap-2">
                      <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Sum Insured (₹)*</label>
                      <input type="number" required value={policyFormData.sumInsured} onChange={e => setPolicyFormData({...policyFormData, sumInsured: e.target.value})} style={{ backgroundColor: '#16191e' }} />
                    </div>
                    <div className="flex-col gap-2">
                      <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Annual Premium (₹)*</label>
                      <input type="number" required value={policyFormData.annualPremium} onChange={e => setPolicyFormData({...policyFormData, annualPremium: e.target.value})} style={{ backgroundColor: '#16191e' }} />
                    </div>
                  </div>
                </div>

                <div className="flex-col gap-2" style={{ marginBottom: '2rem' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Policy Document (PDF/JPG/PNG)</label>
                  <input 
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => setPolicyDocumentFile(e.target.files?.[0] || null)}
                    style={{ backgroundColor: '#16191e', padding: '0.6rem', border: '1px solid var(--border-light)', borderRadius: '6px', width: '100%', color: '#fff' }} 
                  />
                  {editingPolicy && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Current: {editingPolicy?.attachedDocument || 'No document'}
                    </div>
                  )}
                </div>

                <div className="flex gap-4" style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2.5rem', display: 'flex' }}>
                  <button type="button" onClick={() => setIsPolicyEditOpen(false)} className="btn-secondary" style={{ flex: 1, padding: '0.75rem' }}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ flex: 2, padding: '0.75rem', fontWeight: 700, backgroundColor: '#1DD3B0', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Update Policy</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Policy Delete Confirmation Modal */}
        {isPolicyDeleteOpen && (
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
                <button onClick={() => setIsPolicyDeleteOpen(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button 
                  onClick={confirmPolicyDelete} 
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
  }

  return (
    <div className="flex-col gap-4">
      <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '2rem' }}>Client Directory</h2>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ maxWidth: '400px', width: '100%', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search clients..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem', marginBottom: 0 }}
            />
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
            <p>Loading clients...</p>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Mobile Number</th>
                    <th>Email Address</th>
                    <th># of Policies</th>
                    <th>Aggregate Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentClients.map((c, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500, color: 'var(--accent-gold)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setSelectedClient(c)}>{c.name}</td>
                      <td>{c.mobileNumber}</td>
                      <td>{c.email}</td>
                      <td><strong>{c.numberOfPolicies}</strong></td>
                      <td>
                        <span className={`badge ${c.status.toLowerCase()}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                          <button 
                            onClick={() => handleEditClick(c)}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', padding: 4 }}
                            title="Edit Client"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(c.mobileNumber)}
                            style={{ background: 'none', border: 'none', color: '#ea4335', cursor: 'pointer', padding: 4 }}
                            title="Delete Client"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentClients.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No clients found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1.5rem 0 0', borderTop: '1px solid var(--border-light)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, totalItems)} of {totalItems} clients
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

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(4px)'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative' }}>
            <button 
              onClick={() => setIsEditModalOpen(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--accent-gold)' }}>Edit Client Details</h3>
            
            <form onSubmit={handleEditSubmit} className="flex-col gap-4">
              <div className="input-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Full Name</label>
                <input 
                  type="text" 
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="input-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Email Address</label>
                <input 
                  type="email" 
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Mobile Number</label>
                <input 
                  type="text" 
                  value={editFormData.mobileNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, mobileNumber: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Save Changes
                </button>
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
            <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: '#fff' }}>Delete Client</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.5' }}>
              Are you sure you want to delete this client? This will remove their profile and associated policy records.
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
                Delete Client
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Clients;
