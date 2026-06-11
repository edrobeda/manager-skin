import { ConfigProvider } from 'antd';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ptBR from 'antd/locale/pt_BR';
import { TenantProvider, useTenant } from './contexts/TenantContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Webs from './pages/Webs';
import Tenants from './pages/Tenants';
import Eventos from './pages/Eventos';
import { Backup, AddWeb, BasicAuth } from './pages/Configuracoes';
import DashboardLayout from './layouts/DashboardLayout';
import './App.css';

const ProtectedRoute = ({ children, requireRole }) => {
  const session = localStorage.getItem('session');
  if (!session) return <Navigate to="/login" replace />;
  if (requireRole) {
    const { user } = JSON.parse(session);
    if (user?.role !== requireRole) return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const ThemedApp = () => {
  const { tenant } = useTenant();
  const primary = tenant?.cor_primaria || '#10b981';

  return (
    <ConfigProvider
      locale={ptBR}
      theme={{ token: { colorPrimary: primary, borderRadius: 8 } }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}
          >
            <Route index element={<Dashboard />} />
            <Route path="eventos"    element={<Eventos />} />
            <Route path="leads"      element={<div><h2>Leads</h2><p>Em desenvolvimento...</p></div>} />
            <Route path="sorteios"   element={<div><h2>Sorteios</h2><p>Em desenvolvimento...</p></div>} />
            <Route path="formularios" element={<div><h2>Formulários</h2><p>Em desenvolvimento...</p></div>} />
            <Route path="usuarios"   element={<div><h2>Usuários</h2><p>Em desenvolvimento...</p></div>} />
            <Route path="webs"       element={<Webs />} />
            <Route path="tenants"    element={<ProtectedRoute requireRole="superadmin"><Tenants /></ProtectedRoute>} />
            <Route path="configuracoes">
              <Route path="add-web"    element={<AddWeb />} />
              <Route path="backup"     element={<Backup />} />
              <Route path="basic-auth" element={<ProtectedRoute requireRole="superadmin"><BasicAuth /></ProtectedRoute>} />
            </Route>
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

function App() {
  return (
    <TenantProvider>
      <ThemedApp />
    </TenantProvider>
  );
}

export default App;
