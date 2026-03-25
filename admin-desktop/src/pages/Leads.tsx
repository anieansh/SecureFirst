import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';

const API_URL = 'http://localhost:5001/api/leads';

const Leads = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await axios.get(API_URL);
        setLeads(res.data);
      } catch (err) {
        console.error('Error fetching leads', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

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
                  <th>Vehicle Number</th>
                  <th>Created Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((l) => (
                  <tr key={l._id}>
                    <td style={{ fontWeight: 500, color: 'var(--accent-gold)' }}>{l.name}</td>
                    <td>{l.mobileNumber}</td>
                    <td>{l.policyType}</td>
                    <td>{l.vehicleNumber || '-'}</td>
                    <td>{new Date(l.createdAt).toLocaleDateString()}</td>
                    <td><span className="badge expiring">New Lead</span></td>
                  </tr>
                ))}
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      No leads generated yet.
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

export default Leads;
