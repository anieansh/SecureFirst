import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';

const API_URL = 'http://localhost:5001/api/clients';

const Clients = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await axios.get(API_URL);
        // The backend already returns pre-aggregated clients and calculated status
        setClients(res.data);
      } catch (err) {
        console.error('Error fetching clients', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

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
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((c, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500, color: 'var(--accent-gold)' }}>{c.name}</td>
                    <td>{c.mobileNumber}</td>
                    <td>{c.email}</td>
                    <td><strong>{c.numberOfPolicies}</strong> Data Nodes</td>
                    <td>
                      <span className={`badge ${c.status.toLowerCase()}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredClients.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      No clients found.
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

export default Clients;
