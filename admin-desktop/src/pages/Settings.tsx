import { useState } from 'react';
import { LogOut, Save } from 'lucide-react';

const Settings = () => {
  const [reminderWindow, setReminderWindow] = useState('15 days');
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);

  const handleSave = () => {
    alert("Settings saved successfully!");
  }

  const handleSignOut = () => {
    alert("Signing out...");
  }

  const Switch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <div 
      onClick={onChange}
      style={{
        width: '50px',
        height: '26px',
        backgroundColor: checked ? 'rgba(0,0,0,0.4)' : 'rgba(255, 255, 255, 0.05)',
        border: checked ? '1px solid var(--accent-gold)' : '1px solid var(--border-light)',
        borderRadius: '24px',
        display: 'flex',
        alignItems: 'center',
        padding: '2px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        flexShrink: 0
      }}
    >
      <div style={{
        width: '20px',
        height: '20px',
        backgroundColor: checked ? 'var(--accent-gold)' : '#9ca3af',
        borderRadius: '50%',
        transform: checked ? 'translateX(24px)' : 'translateX(0)',
        transition: 'transform 0.3s ease',
        boxShadow: checked ? '0 0 8px rgba(29, 211, 176, 0.4)' : 'none'
      }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '2rem' }}>Platform Settings</h2>
      </div>

      <div style={{ width: '100%' }}>
        
        {/* AGENT PROFILE */}
        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>
            Agent Profile
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ 
              width: '64px', height: '64px', borderRadius: '50%', flexShrink: 0,
              backgroundColor: 'rgba(29, 211, 176, 0.1)', border: '2px solid var(--accent-gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent-gold)', fontSize: '1.4rem', fontWeight: 700
            }}>
              RV
            </div>
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>Rajesh Verma</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '0.3rem' }}>rajesh.verma@securefirst.in</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', opacity: 0.8 }}>IRDAI-AG-2019-004421</div>
            </div>
          </div>
        </div>

        {/* RENEWAL REMINDER WINDOW */}
        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>
            Renewal Reminder Window
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>Clients receive automatic reminders when policy is due within:</p>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {['7 days', '10 days', '15 days', '30 days'].map(days => (
              <button 
                key={days}
                onClick={() => setReminderWindow(days)}
                style={{
                  flex: 1, minWidth: '100px',
                  padding: '0.8rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid',
                  textAlign: 'center',
                  borderColor: reminderWindow === days ? 'var(--accent-gold)' : 'var(--border-light)',
                  backgroundColor: reminderWindow === days ? 'rgba(29, 211, 176, 0.1)' : 'transparent',
                  color: reminderWindow === days ? 'var(--accent-gold)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: reminderWindow === days ? 600 : 500,
                  transition: 'all 0.2s',
                  fontSize: '0.95rem'
                }}
              >
                {days}
              </button>
            ))}
          </div>
        </div>

        {/* NOTIFICATION CHANNELS */}
        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>
            Notification Channels
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: '1.05rem', marginBottom: '0.2rem', color: 'var(--text-primary)' }}>SMS Reminders</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Send immediate mobile alerts</div>
              </div>
              <Switch checked={smsEnabled} onChange={() => setSmsEnabled(!smsEnabled)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: '1.05rem', marginBottom: '0.2rem', color: 'var(--text-primary)' }}>Push Notifications</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>In-app alerts on mobile client portal</div>
              </div>
              <Switch checked={pushEnabled} onChange={() => setPushEnabled(!pushEnabled)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: '1.05rem', marginBottom: '0.2rem', color: 'var(--text-primary)' }}>Email Summaries</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Weekly automated email digests</div>
              </div>
              <Switch checked={emailEnabled} onChange={() => setEmailEnabled(!emailEnabled)} />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', marginBottom: '4rem' }}>
          <button onClick={handleSave} className="btn-primary" style={{ flex: 1, padding: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Save size={20} /> Save Configuration
          </button>
          
          <button onClick={handleSignOut} style={{ flex: 1, padding: '1rem', fontSize: '1.1rem', borderRadius: '8px', backgroundColor: 'transparent', border: '1px solid #ea4335', color: '#ea4335', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <LogOut size={20} /> Sign Out Securely
          </button>
        </div>

      </div>
    </div>
  );
};

export default Settings;
