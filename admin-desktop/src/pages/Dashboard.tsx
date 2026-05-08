import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, FileCheck, AlertTriangle, ShieldX, IndianRupee, Car } from 'lucide-react';

const API_URL = 'http://localhost:5001/api';

const Dashboard = () => {
  const [policies, setPolicies] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [polRes, cliRes] = await Promise.all([
          axios.get(`${API_URL}/policies`),
          axios.get(`${API_URL}/clients`)
        ]);
        setPolicies(polRes.data);
        setClients(cliRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="glass-panel">Loading dashboard...</div>;

  const today = new Date().getTime();

  // Categorize policies
  const activePolicies: any[] = [];
  const expiringPolicies: any[] = [];
  const expiredPolicies: any[] = [];

  let totalPremium = 0;

  policies.forEach(p => {
    const expiry = new Date(p.expiryDate).getTime();
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    // Add custom days remaining for UI
    const policyUi = { ...p, diffDays };

    if (diffDays < 0) {
      expiredPolicies.push(policyUi);
    } else if (diffDays <= 15) {
      expiringPolicies.push(policyUi);
      totalPremium += p.annualPremium;
    } else {
      activePolicies.push(policyUi);
      totalPremium += p.annualPremium;
    }
  });

  // Sort lists by urgency
  expiringPolicies.sort((a, b) => a.diffDays - b.diffDays);
  expiredPolicies.sort((a, b) => a.diffDays - b.diffDays);

  const totalClients = clients.length;
  // Renewal Rate = Active / Total
  const renewalRate = policies.length > 0 ? ((activePolicies.length + expiringPolicies.length) / policies.length * 100).toFixed(1) : '0.0';

  const stats = [
    { label: 'Total Clients', value: totalClients, icon: Users, color: '#3b82f6' },
    { label: 'Active Policies', value: activePolicies.length, icon: FileCheck, color: '#34a853' },
    { label: 'Expiring in 15 Days', value: expiringPolicies.length, icon: AlertTriangle, color: '#1DD3B0' },
    { label: 'Expired Policies', value: expiredPolicies.length, icon: ShieldX, color: '#ea4335' },
    { label: 'Total Premium', value: `₹${totalPremium.toLocaleString()}`, icon: IndianRupee, color: '#1DD3B0' },
    { label: 'Motor Renewal Rate', value: `${renewalRate}%`, icon: Car, color: '#9333ea' }
  ];

  return (
    <div className="flex-col gap-4">
      <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Dashboard Overview</h2>
      
      {/* 1. Summary Section */}
      <div className="card-grid" style={{ marginBottom: '2rem' }}>
        {stats.map((s, i) => (
          <div key={i} className="glass-panel flex items-center justify-between">
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{s.label}</p>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 600 }}>{s.value}</h3>
            </div>
            <div style={{ padding: '1rem', backgroundColor: `${s.color}20`, borderRadius: '12px' }}>
              <s.icon color={s.color} size={28} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* 2. Renewal Alerts Section */}
        <div className="glass-panel table-wrapper">
          <h3 className="flex items-center gap-2" style={{ marginBottom: '1rem', color: 'var(--accent-warning)' }}>
            <AlertTriangle size={20} /> Policies Nearing Expiry
          </h3>
          {expiringPolicies.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No policies expiring in the next 15 days.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Mobile</th>
                  <th>Type</th>
                  <th>Days Left</th>
                </tr>
              </thead>
              <tbody>
                {expiringPolicies.map(p => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 500 }}>{p.clientName}</td>
                    <td>{p.mobileNumber}</td>
                    <td>{p.policyType}</td>
                    <td><span className="badge expiring">{p.diffDays} Days</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 3. Expired Policies Section */}
        <div className="glass-panel table-wrapper">
          <h3 className="flex items-center gap-2" style={{ marginBottom: '1rem', color: 'var(--accent-danger)' }}>
            <ShieldX size={20} /> Expired Policies
          </h3>
          {expiredPolicies.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No expired policies.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Mobile</th>
                  <th>Type</th>
                  <th>Expired By</th>
                </tr>
              </thead>
              <tbody>
                {expiredPolicies.map(p => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 500 }}>{p.clientName}</td>
                    <td>{p.mobileNumber}</td>
                    <td>{p.policyType}</td>
                    <td><span className="badge expired">{Math.abs(p.diffDays)} Days Ago</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
