import { useState } from 'react';
import { Layout, Menu, theme, Avatar, Dropdown, Button, Drawer, Grid } from 'antd';
import {
  BankOutlined, FileTextOutlined, CalendarOutlined, DollarOutlined,
  LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useTenant } from '../contexts/TenantContext';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

// Layout do portal do cliente (Fase 4 do ROADMAP.md), servido em
// {tenant}.eventifylab.com/admin. Deliberadamente NÃO ramifica o DashboardLayout
// do staff — menu próprio, só com as telas de self-service do cliente, pra não
// arriscar vazar telas staff-only (Backup, Chaves de API, Tenants, WEBs,
// Produtos-Totem) por um esquecimento de guard.
const PortalLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  const { user, tenant } = useTenant();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const handleLogout = () => {
    localStorage.removeItem('session');
    const isHttps = window.location.protocol === 'https:';
    document.cookie = `manager_token=; path=/; max-age=0${isHttps ? '; Secure' : ''}; SameSite=Lax; domain=.eventifylab.com`;
    navigate('/login');
  };

  const menuItems = [
    { key: '/admin/cadastro-fiscal', icon: <BankOutlined />,     label: 'Cadastro Fiscal' },
    { key: '/admin/contratos',       icon: <FileTextOutlined />, label: 'Contratos' },
    { key: '/admin/calendario',      icon: <CalendarOutlined />, label: 'Calendário' },
    { key: '/admin/faturas',         icon: <DollarOutlined />,   label: 'Faturas' },
  ];

  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: 'Sair', danger: true, onClick: handleLogout },
  ];

  const siderTitle = collapsed
    ? (tenant?.slug?.slice(0, 2).toUpperCase() || 'EL')
    : (tenant?.nome || 'Portal do cliente');

  const menu = (
    <Menu
      theme="dark" mode="inline"
      selectedKeys={[location.pathname]}
      items={menuItems}
      onClick={({ key }) => {
        navigate(key);
        setMobileMenuOpen(false);
      }}
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
          title={tenant?.nome || 'Portal do cliente'}
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
              {!isMobile && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{user.nome || 'Cliente'}</span>}
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

export default PortalLayout;
