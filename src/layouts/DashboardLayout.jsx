import { useState } from 'react';
import { Layout, Menu, theme, Avatar, Dropdown, Button, Tag, Drawer, Grid } from 'antd';
import {
  DashboardOutlined, UserOutlined, SettingOutlined, TeamOutlined,
  CalendarOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  TrophyOutlined, FormOutlined, GlobalOutlined, BankOutlined, SafetyOutlined, KeyOutlined,
  CloudUploadOutlined, ShopOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useTenant } from '../contexts/TenantContext';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const ROLE_LABELS = { superadmin: { label: 'Super Admin', color: 'red' }, admin: { label: 'Admin', color: 'blue' }, viewer: { label: 'Viewer', color: 'default' } };

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  const { user, tenant, role, isSuper, isAdmin } = useTenant();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

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

  const menu = (
    <Menu
      theme="dark" mode="inline"
      selectedKeys={getSelectedKeys()}
      defaultOpenKeys={getOpenKeys()}
      items={menuItems}
      onClick={({ key }) => { navigate(key); setMobileMenuOpen(false); }}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider trigger={null} collapsible collapsed={collapsed} style={{ background: '#001529' }}>
          <div style={{
            height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '0 8px',
          }}>
            <h2 style={{ color: '#fff', margin: 0, fontSize: collapsed ? 14 : 18, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {siderTitle}
            </h2>
          </div>
          {menu}
        </Sider>
      )}
      {isMobile && (
        <Drawer
          title={tenant?.nome || 'EventifyLab'}
          placement="left"
          onClose={() => setMobileMenuOpen(false)}
          open={mobileMenuOpen}
          width={240}
          styles={{ body: { padding: 0, background: '#001529' }, header: { background: '#001529', color: '#fff' } }}
          closeIcon={<span style={{ color: '#fff' }}>✕</span>}
        >
          {menu}
        </Drawer>
      )}
      <Layout>
        <Header style={{
          padding: isMobile ? '0 12px' : '0 24px', background: colorBgContainer,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}>
          <Button type="text"
            icon={isMobile ? <MenuUnfoldOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
            onClick={() => isMobile ? setMobileMenuOpen(true) : setCollapsed(!collapsed)}
            style={{ fontSize: 16, width: isMobile ? 40 : 64, height: 64 }}
          />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              {!isMobile && <Tag color={ROLE_LABELS[role]?.color}>{ROLE_LABELS[role]?.label || role}</Tag>}
              {!isMobile && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{user.nome || 'Admin'}</span>}
              <Avatar style={{ backgroundColor: '#10b981', flexShrink: 0 }} icon={<UserOutlined />} />
            </div>
          </Dropdown>
        </Header>
        <Content style={{
          margin: isMobile ? 12 : 24, padding: isMobile ? 12 : 24, background: colorBgContainer,
          borderRadius: borderRadiusLG, minHeight: 280, overflowX: 'auto',
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
