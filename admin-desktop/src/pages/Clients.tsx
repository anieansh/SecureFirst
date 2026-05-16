import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Edit, Trash2, X } from 'lucide-react';

const API_URL = 'https://api.securefirst.co/api/clients';
const CLIENT_API_BASE = 'https://api.securefirst.co/api/client';

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

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      setClients(res.data.data || res.data);
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

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.mobileNumber.includes(search)
  );

  return (
    <div className="flex-col gap-4">
      <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '2rem' }}>Client Directory</h2>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1.5rem', maxWidth: '400px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search clients..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem', marginBottom: 0 }}
          />
        </div>

        <div className="table-wrapper">
          {loading ? (
            <p>Loading clients...</p>
          ) : (
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
                {filteredClients.map((c, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500, color: 'var(--accent-gold)' }}>{c.name}</td>
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
                {filteredClients.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      No clients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
