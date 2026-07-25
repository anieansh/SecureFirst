import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Plus } from 'lucide-react';
import AddPolicyModal from './AddPolicyModal';

const Layout = () => {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar onAddPolicy={() => setModalOpen(true)} />
      <main className="main-content">
        <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', minHeight: '100%' }}>
          <Outlet />
          <button 
            onClick={() => setModalOpen(true)}
            title="Add New Policy"
            style={{ position: 'fixed', bottom: '2rem', right: '2rem', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--accent-gold)', color: '#000', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 100, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
          >
            <Plus size={32} />
          </button>
        </div>
      </main>
      {isModalOpen && <AddPolicyModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />}
    </div>
  );
};

export default Layout;
