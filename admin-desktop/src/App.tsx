import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

// Screen Imports
import Dashboard from './pages/Dashboard';
import Policies from './pages/Policies';
import Clients from './pages/Clients';
import Leads from './pages/Leads';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Login from './pages/Login';
import { Navigate } from 'react-router-dom';

const RequireAuth = () => {
  const token = localStorage.getItem('adminToken');
  if (!token || token === 'undefined' || token === 'null') {
    return <Navigate to="/login" replace />;
  }
  return <Layout />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/users" element={<Users />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
