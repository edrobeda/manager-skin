import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, message, Tag, Popconfirm, Switch, Drawer, Badge } from 'antd';
import { PlusOutlined, EditOutlined, TeamOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { api } from '../../services/api';

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ open: false, editing: null });
  const [usersDrawer, setUsersDrawer] = useState({ open: false, tenant: null, users: [], loadingUsers: false });
  const [form] = Form.useForm();
  const [userForm] = Form.useForm();
  const [userModal, setUserModal] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/tenants');
      setTenants(data.tenants);
    } catch (err) {
      message.error(err.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    form.resetFields();
    setModal({ open: true, editing: null });
  };

  const openEdit = (tenant) => {
    form.setFieldsValue({ nome: tenant.nome, slug: tenant.slug, cor_primaria: tenant.cor_primaria, logo_url: tenant.logo_url });
    setModal({ open: true, editing: tenant });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (modal.editing) {
        await api.put(`/tenants/${modal.editing.id}`, values);
        message.success('Cliente atualizado!');
      } else {
        await api.post('/tenants', values);
        message.success('Cliente criado!');
      }
      setModal({ open: false, editing: null });
      load();
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const toggleTenant = async (tenant) => {
    try {
      const data = await api.patch(`/tenants/${tenant.id}/toggle`, {});
      setTenants(ts => ts.map(t => t.id === tenant.id ? { ...t, ativo: data.tenant.ativo } : t));
      message.success(data.tenant.ativo ? 'Acesso liberado' : 'Acesso revogado');
    } catch (err) {
      message.error(err.message);
    }
  };

  const openUsers = async (tenant) => {
    setUsersDrawer({ open: true, tenant, users: [], loadingUsers: true });
    try {
      const data = await api.get(`/tenants/${tenant.id}/users`);
      setUsersDrawer(d => ({ ...d, users: data.users, loadingUsers: false }));
    } catch (err) {
      message.error(err.message);
      setUsersDrawer(d => ({ ...d, loadingUsers: false }));
    }
  };

  const toggleUser = async (user) => {
    try {
      const data = await api.patch(`/tenants/${usersDrawer.tenant.id}/users/${user.id}/toggle`, {});
      setUsersDrawer(d => ({
        ...d,
        users: d.users.map(u => u.id === user.id ? { ...u, ativo: data.user.ativo } : u),
      }));
      message.success(data.user.ativo ? 'Usuário reativado' : 'Acesso revogado');
    } catch (err) {
      message.error(err.message);
    }
  };

  const createUser = async () => {
    try {
      const values = await userForm.validateFields();
      await api.post(`/tenants/${usersDrawer.tenant.id}/users`, values);
      message.success('Usuário criado!');
      setUserModal(false);
      userForm.resetFields();
      openUsers(usersDrawer.tenant);
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const columns = [
    {
      title: 'Status', dataIndex: 'ativo', key: 'ativo', width: 80,
      render: (v) => <Badge status={v !== false ? 'success' : 'error'} text={v !== false ? 'Ativo' : 'Bloqueado'} />,
    },
    {
      title: 'Nome', dataIndex: 'nome', key: 'nome',
      render: (v, r) => (
        <Space>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: r.cor_primaria || '#1677ff', display: 'inline-block', flexShrink: 0 }} />
          <span style={{ textDecoration: r.ativo === false ? 'line-through' : 'none', color: r.ativo === false ? '#aaa' : undefined }}>{v}</span>
        </Space>
      ),
    },
    { title: 'Slug', dataIndex: 'slug', key: 'slug', render: v => <Tag>{v}</Tag> },
    { title: 'URL', key: 'url', render: (_, r) => <a href={`https://${r.slug}.eventifylab.com`} target="_blank" rel="noreferrer">{r.slug}.eventifylab.com</a> },
    { title: 'Criado em', dataIndex: 'created_at', key: 'created_at', render: v => new Date(v).toLocaleDateString('pt-BR') },
    {
      title: 'Ações', key: 'actions', width: 160,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Button size="small" icon={<TeamOutlined />} onClick={() => openUsers(r)} />
          <Popconfirm
            title={r.ativo !== false ? 'Revogar acesso do tenant?' : 'Reativar acesso do tenant?'}
            onConfirm={() => toggleTenant(r)}
          >
            <Button
              size="small"
              danger={r.ativo !== false}
              icon={r.ativo !== false ? <StopOutlined /> : <CheckCircleOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const userColumns = [
    {
      title: 'Status', dataIndex: 'ativo', key: 'ativo', width: 90,
      render: (v) => <Badge status={v !== false ? 'success' : 'error'} text={v !== false ? 'Ativo' : 'Revogado'} />,
    },
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role', render: v => <Tag color={v === 'admin' ? 'blue' : 'default'}>{v}</Tag> },
    {
      title: '', key: 'toggle', width: 120,
      render: (_, u) => (
        <Popconfirm
          title={u.ativo !== false ? 'Revogar acesso?' : 'Reativar usuário?'}
          onConfirm={() => toggleUser(u)}
        >
          <Button size="small" danger={u.ativo !== false}>
            {u.ativo !== false ? 'Revogar' : 'Reativar'}
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Clientes (Tenants)</h2>
      <Card
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Novo Cliente</Button>}
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
      >
        <Table columns={columns} dataSource={tenants} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      {/* Modal criar/editar tenant */}
      <Modal
        title={modal.editing ? 'Editar Cliente' : 'Novo Cliente'}
        open={modal.open}
        onOk={handleSave}
        onCancel={() => setModal({ open: false, editing: null })}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="nome" label="Nome" rules={[{ required: true }]}>
            <Input placeholder="Ex: Empresa ABC" />
          </Form.Item>
          <Form.Item name="slug" label="Slug (subdomínio)" rules={[{ required: true, pattern: /^[a-z0-9-]+$/, message: 'Apenas letras minúsculas, números e -' }]}>
            <Input placeholder="Ex: empresa-abc" addonAfter=".eventifylab.com" />
          </Form.Item>
          <Form.Item name="logo_url" label="URL do Logo">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="cor_primaria" label="Cor Primária">
            <Input placeholder="#10b981" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Drawer de usuários do tenant */}
      <Drawer
        title={`Usuários — ${usersDrawer.tenant?.nome || ''}`}
        open={usersDrawer.open}
        onClose={() => setUsersDrawer({ open: false, tenant: null, users: [], loadingUsers: false })}
        width={600}
        extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => { userForm.resetFields(); setUserModal(true); }}>Novo Usuário</Button>}
      >
        <Table
          columns={userColumns}
          dataSource={usersDrawer.users}
          rowKey="id"
          loading={usersDrawer.loadingUsers}
          pagination={false}
          size="small"
        />
      </Drawer>

      {/* Modal criar usuário */}
      <Modal
        title="Novo Usuário"
        open={userModal}
        onOk={createUser}
        onCancel={() => setUserModal(false)}
        okText="Criar"
        cancelText="Cancelar"
      >
        <Form form={userForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="nome" label="Nome" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Senha" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="role" label="Role" initialValue="admin">
            <Input placeholder="admin / viewer" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Tenants;
