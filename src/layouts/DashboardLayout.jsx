import { useState } from 'react';
import { Layout, Menu, theme, Avatar, Dropdown, Button, Tag } from 'antd';
import {
  DashboardOutlined, UserOutlined, SettingOutlined, TeamOutlined,
  CalendarOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  TrophyOutlined, FormOutlined, GlobalOutlined, BankOutlined, SafetyOutlined, KeyOutlined,
  CloudUploadOutlined, ShopOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useTenant } from '../contexts/TenantContext';

const { Header, Sider, Content } = Layout;

const ROLE_LABELS = { superadmin: { label: 'Super Admin', color: 'red' }, admin: { label: 'Admin', color: 'blue' }, viewer: { label: 'Viewer', color: 'default' } };

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  const { user, tenant, role, isSuper, isAdmin } = useTenant();

  const handleLogout = () => {
    localStorage.removeItem('session');
    navigate('/login');
  };

  const getSelectedKeys = () => [location.pathname];
  const getOpenKeys = () =>
    location.pathname.startsWith('/dashboard/configuracoes/') || location.pathname === '/dashboard/webs'
      ? ['/dashboard/configuracoes']
      : [];

  const menuItems = [
    { key: '/dashboard',             icon: <DashboardOutlined />, label: 'Dashboard' },
    ...(isSuper ? [{ key: '/dashboard/tenants', icon: <BankOutlined />, label: 'Clientes' }] : []),
    { key: '/dashboard/eventos',      icon: <CalendarOutlined />,  label: 'Eventos' },
    { key: '/dashboard/leads',       icon: <TeamOutlined />,      label: 'Leads' },
    { key: '/dashboard/sorteios',    icon: <TrophyOutlined />,    label: 'Sorteios' },
    { key: '/dashboard/formularios', icon: <FormOutlined />,      label: 'Formulários' },
    { key: '/dashboard/usuarios',    icon: <UserOutlined />,      label: 'Usuários' },
    { key: '/dashboard/uploads',     icon: <CloudUploadOutlined />, label: 'Uploads' },
    ...(isAdmin ? [{ key: '/dashboard/produtos-totem', icon: <ShopOutlined />, label: 'Produtos Totem' }] : []),
    ...(isAdmin ? [{
      key: '/dashboard/configuracoes',
      icon: <SettingOutlined />,
      label: 'Configurações',
      children: [
        { key: '/dashboard/webs',                     icon: <GlobalOutlined />, label: 'WEBs' },
        { key: '/dashboard/configuracoes/add-web',    label: 'Add Web' },
        { key: '/dashboard/configuracoes/backup',     icon: <SafetyOutlined />, label: 'Backup' },
        ...(isSuper ? [{ key: '/dashboard/configuracoes/basic-auth', icon: <KeyOutlined />, label: 'Chaves de API' }] : []),
      ],
    }] : []),
  ];

  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: 'Sair', danger: true, onClick: handleLogout },
  ];

  const siderTitle = collapsed
    ? (tenant?.slug?.slice(0, 2).toUpperCase() || 'EL')
    : (tenant?.nome || 'EventifyLab');

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} style={{ background: '#001529' }}>
        <div style={{
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '0 8px',
        }}>
          <h2 style={{ color: '#fff', margin: 0, fontSize: collapsed ? 14 : 18, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {siderTitle}
          </h2>
        </div>
        <Menu
          theme="dark" mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{
          padding: '0 24px', background: colorBgContainer,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}>
          <Button type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16, width: 64, height: 64 }}
          />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tag color={ROLE_LABELS[role]?.color}>{ROLE_LABELS[role]?.label || role}</Tag>
              <span>{user.nome || 'Admin'}</span>
              <Avatar style={{ backgroundColor: '#10b981' }} icon={<UserOutlined />} />
            </div>
          </Dropdown>
        </Header>
        <Content style={{
          margin: 24, padding: 24, background: colorBgContainer,
          borderRadius: borderRadiusLG, minHeight: 280,
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
