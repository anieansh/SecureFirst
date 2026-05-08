import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, FilePlus, Settings, ShieldCheck, Sun, Moon, ListPlus } from 'lucide-react';

const Sidebar = ({ onAddPolicy }: { onAddPolicy?: () => void }) => {
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Policies', path: '/policies', icon: FileText },
    { name: 'Clients', path: '/clients', icon: Users },
    { name: 'Leads', path: '/leads', icon: ListPlus },
    { name: 'Add Policy', path: '#', icon: FilePlus }, // path is fake
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Check local storage or default to dark
    const stored = localStorage.getItem('theme');
    if (stored === 'light') {
      document.body.classList.add('light-theme');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    }
    setIsDark(!isDark);
  };

  return (
    <div style={{
      width: '260px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-light)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <ShieldCheck size={36} style={{ color: 'var(--accent-gold)' }} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Secure First</h1>
      </div>

      <nav style={{ flex: 1, padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {menuItems.map((item) => {
          if (item.name === 'Add Policy') {
            return (
              <button
                key={item.name}
                onClick={onAddPolicy}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem',
                  borderRadius: '8px', border: 'none', background: 'none', color: 'var(--text-secondary)',
                  cursor: 'pointer', fontWeight: 400, transition: 'all 0.2s ease', width: '100%', fontSize: '1rem',
                  fontFamily: 'inherit'
                }}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </button>
            );
          }
          
          return (
            <NavLink
              key={item.name}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                textDecoration: 'none',
                color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'rgba(29, 211, 176, 0.1)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.2s ease',
              })}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
        <button 
          onClick={toggleTheme}
          style={{
            background: 'none', border: '1px solid var(--border-light)', 
            padding: '0.5rem 1rem', borderRadius: '20px', 
            color: 'var(--text-primary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />} 
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>
        <div>&copy; 2026 Admin Portal</div>
      </div>
    </div>
  );
};

export default Sidebar;
