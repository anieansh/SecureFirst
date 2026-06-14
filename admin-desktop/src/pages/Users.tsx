import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Smartphone, Apple } from 'lucide-react';

const API_URL = 'https://api.securefirst.co/api/users';

const Users = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      setUsers(res.data.data || res.data);
    } catch (err) {
      console.error('Error fetching users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.mobile.includes(search) ||
    (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
  );

  // Pagination Logic
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Reset page if filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="flex-col gap-4">
      <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '2rem' }}>App Users Directory</h2>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ maxWidth: '400px', width: '100%', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search by name, phone, or email..." 
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
            <p>Loading users...</p>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Mobile Number</th>
                    <th>Email Address</th>
                    <th>Device Type</th>
                    <th>Registered At</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((u, i) => (
                    <tr key={u._id || i}>
                      <td style={{ fontWeight: 500, color: 'var(--accent-gold)' }}>{u.name}</td>
                      <td>{u.mobile}</td>
                      <td>{u.email || <span style={{ opacity: 0.5, fontSize: '0.85rem' }}>N/A</span>}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {u.phoneType === 'iOS' ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.06)', fontSize: '0.85rem' }}>
                              <Apple size={14} color="#fff" /> iOS
                            </span>
                          ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', backgroundColor: 'rgba(29, 211, 176, 0.1)', color: '#1DD3B0', fontSize: '0.85rem' }}>
                              <Smartphone size={14} color="#1DD3B0" /> Android
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {currentItems.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No registered users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1rem 0 0', borderTop: '1px solid var(--border-light)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, totalItems)} of {totalItems} users
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button 
                      onClick={handlePrevPage} 
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
                      onClick={handleNextPage} 
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
    </div>
  );
};

export default Users;
