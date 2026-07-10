import { useState, useEffect, useRef } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, message, Tag, Popconfirm, Drawer, Badge, DatePicker, Alert, Typography, Descriptions, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, TeamOutlined, StopOutlined, CheckCircleOutlined, RocketOutlined, KeyOutlined, CopyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../../services/api';

const { Text } = Typography;

function AliasForm({ provForm, slug }) {
  const [alias, setAlias] = useState('');
  const defaultUrl = `game-${slug}.eventifylab.com`;
  const aliasNorm = alias.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const previewUrl = aliasNorm ? `${aliasNorm}.eventifylab.com` : defaultUrl;

  return (
    <Form form={provForm} layout="vertical" style={{ marginTop: 16 }}>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={`URL do game: ${previewUrl}`}
        description="O processo leva ~3 minutos. Containers e SSL configurados automaticamente."
      />
      <Form.Item
        name="alias"
        label="Alias personalizado (opcional)"
        extra={`Deixe em branco para usar o padrão: ${defaultUrl}`}
        rules={[{ pattern: /^[a-z0-9-]*$/, message: 'Apenas letras minúsculas, números e -' }]}
      >
        <Input
          placeholder={`ex: vetnil-biocell`}
          addonAfter=".eventifylab.com"
          onChange={e => setAlias(e.target.value)}
        />
      </Form.Item>
      <Form.Item name="datas" label="Período do evento (opcional)" initialValue={[dayjs(), dayjs().add(30, 'day')]}>
        <DatePicker.RangePicker
          showTime={{ format: 'HH:mm' }}
          format="DD/MM/YYYY HH:mm"
          placeholder={['Início do evento', 'Fim do evento']}
          style={{ width: '100%' }}
        />
      </Form.Item>
    </Form>
  );
}

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ open: false, editing: null });
  const [usersDrawer, setUsersDrawer] = useState({ open: false, tenant: null, users: [], loadingUsers: false });
  const [form] = Form.useForm();
  const [userForm] = Form.useForm();
  const [userModal, setUserModal] = useState(false);

  // credenciais
  const [credsModal, setCredsModal] = useState({ open: false, tenant: null });

  // provisionamento
  const [provModal, setProvModal] = useState({ open: false, tenant: null });
  const [provForm] = Form.useForm();
  const [provStatus, setProvStatus] = useState(null); // null | 'rodando' | 'concluido' | 'erro'
  const [provLog, setProvLog] = useState([]);
  const logRef = useRef(null);
  const pollRef = useRef(null);

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

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [provLog]);

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

  // ─── Provisionamento ───────────────────────────────────────
  const openProvisionar = (tenant) => {
    clearInterval(pollRef.current);
    setProvModal({ open: true, tenant });
    setProvStatus(null);
    setProvLog([]);
    provForm.resetFields();
  };

  const startPolling = (tenantId) => {
    pollRef.current = setInterval(async () => {
      try {
        const data = await api.get(`/tenants/${tenantId}/provisionar/status`);
        setProvLog(data.log || []);
        if (data.status !== 'rodando') {
          setProvStatus(data.status);
          clearInterval(pollRef.current);
          if (data.status === 'concluido') {
            message.success('Game provisionado com sucesso!');
            load();
          }
        }
      } catch {
        // ignora erros de polling
      }
    }, 3000);
  };

  const handleProvisionar = async () => {
    try {
      const values = await provForm.validateFields();
      const body = {};
      if (values.datas?.[0]) body.data_inicio = values.datas[0].format('YYYY-MM-DD HH:mm:ss');
      if (values.datas?.[1]) body.data_fim    = values.datas[1].format('YYYY-MM-DD HH:mm:ss');
      if (values.alias?.trim()) body.alias = values.alias.trim();

      setProvStatus('rodando');
      setProvLog(['Iniciando provisionamento...']);

      const resp = await api.post(`/tenants/${provModal.tenant.id}/provisionar`, body);
      setProvModal(prev => ({ ...prev, gameUrl: resp.gameUrl || null, managerUrl: resp.managerUrl || null }));
      startPolling(provModal.tenant.id);
    } catch (err) {
      setProvStatus('erro');
      setProvLog([err.message]);
    }
  };

  const closeProvModal = () => {
    clearInterval(pollRef.current);
    setProvModal({ open: false, tenant: null });
    setProvStatus(null);
    setProvLog([]);
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
      title: 'Ações', key: 'actions', width: 230,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Button size="small" icon={<TeamOutlined />} onClick={() => openUsers(r)} />
          <Button size="small" type="primary" icon={<RocketOutlined />} onClick={() => openProvisionar(r)} title="Provisionar Game" />
          {r.game_credentials && (
            <Tooltip title="Credenciais de acesso">
              <Button size="small" icon={<KeyOutlined />} onClick={() => setCredsModal({ open: true, tenant: r })} />
            </Tooltip>
          )}
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

      {/* Modal provisionar game */}
      <Modal
        title={<Space><RocketOutlined style={{ color: '#1677ff' }} />Provisionar Game — {provModal.tenant?.nome}</Space>}
        open={provModal.open}
        onCancel={closeProvModal}
        footer={provStatus === null ? [
          <Button key="cancel" onClick={closeProvModal}>Cancelar</Button>,
          <Button key="ok" type="primary" icon={<RocketOutlined />} onClick={handleProvisionar}>Provisionar</Button>,
        ] : [
          <Button key="close" onClick={closeProvModal} disabled={provStatus === 'rodando'}>
            {provStatus === 'rodando' ? 'Aguarde...' : 'Fechar'}
          </Button>,
        ]}
        width={600}
      >
        {provStatus === null && (
          <AliasForm
            provForm={provForm}
            slug={provModal.tenant?.slug}
          />
        )}

        {provStatus !== null && (
          <div>
            <div style={{ marginBottom: 12 }}>
              {provStatus === 'rodando'   && <Badge status="processing" text={<Text strong style={{ color: '#1677ff' }}>Provisionando...</Text>} />}
              {provStatus === 'concluido' && <Badge status="success"    text={<Text strong style={{ color: '#52c41a' }}>Concluído com sucesso!</Text>} />}
              {provStatus === 'erro'      && <Badge status="error"      text={<Text strong style={{ color: '#ff4d4f' }}>Erro no provisionamento</Text>} />}
            </div>
            <div
              ref={logRef}
              style={{
                background: '#111',
                color: '#e0e0e0',
                fontFamily: 'monospace',
                fontSize: 12,
                padding: '12px 16px',
                borderRadius: 6,
                height: 280,
                overflowY: 'auto',
                lineHeight: 1.6,
              }}
            >
              {provLog.map((line, i) => (
                <div key={i} style={{ color: line.startsWith('[ERR]') ? '#ff7875' : '#e0e0e0' }}>{line}</div>
              ))}
              {provStatus === 'rodando' && <div style={{ color: '#555' }}>▌</div>}
            </div>
            {provStatus === 'concluido' && (() => {
              const gameUrl    = provModal.gameUrl    || `game-${provModal.tenant?.slug}.eventifylab.com`;
              const managerUrl = provModal.managerUrl || gameUrl.replace('.eventifylab.com', '-manager.eventifylab.com');
              return (
                <Alert
                  type="success"
                  showIcon
                  style={{ marginTop: 12 }}
                  message="Game provisionado!"
                  description={
                    <Space direction="vertical" size={2}>
                      <span>Jogo: <a href={`https://${gameUrl}`} target="_blank" rel="noreferrer">{gameUrl}</a></span>
                      <span>Manager: <a href={`https://${managerUrl}`} target="_blank" rel="noreferrer">{managerUrl}</a></span>
                    </Space>
                  }
                />
              );
            })()}
          </div>
        )}
      </Modal>

      {/* Modal credenciais de acesso */}
      <Modal
        title={<Space><KeyOutlined style={{ color: '#faad14' }} />Credenciais — {credsModal.tenant?.nome}</Space>}
        open={credsModal.open}
        onCancel={() => setCredsModal({ open: false, tenant: null })}
        footer={<Button onClick={() => setCredsModal({ open: false, tenant: null })}>Fechar</Button>}
        width={520}
      >
        {credsModal.tenant?.game_credentials && (() => {
          const c = typeof credsModal.tenant.game_credentials === 'string'
            ? JSON.parse(credsModal.tenant.game_credentials)
            : credsModal.tenant.game_credentials;

          const copy = (val) => { navigator.clipboard.writeText(val); message.success('Copiado!'); };

          const field = (label, value) => (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ color: '#888', fontSize: 12, minWidth: 110 }}>{label}</span>
              <Space>
                <Text code copyable={false} style={{ fontSize: 13 }}>{value}</Text>
                <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => copy(value)} />
              </Space>
            </div>
          );

          return (
            <div style={{ marginTop: 8 }}>
              <Alert
                type="warning"
                showIcon
                message="Guarde estas credenciais — elas não podem ser recuperadas depois."
                style={{ marginBottom: 16 }}
              />
              <div style={{ background: '#fafafa', borderRadius: 8, padding: '4px 16px', border: '1px solid #f0f0f0' }}>
                <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontWeight: 600, fontSize: 12, color: '#555', letterSpacing: 1 }}>JOGO</div>
                {field('URL', `https://${c.url}/cadastro`)}
                <div style={{ padding: '12px 0 8px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, fontSize: 12, color: '#555', letterSpacing: 1 }}>MANAGER (Admin)</div>
                {field('Usuário', c.manager_user || 'admin')}
                {field('Senha', c.manager_pass)}
                {field('URL', `https://${c.manager_url || c.url.replace('.eventifylab.com', '-manager.eventifylab.com')}`)}
                <div style={{ padding: '12px 0 8px', fontWeight: 600, fontSize: 12, color: '#555', letterSpacing: 1 }}>ENTREGA</div>
                {field('Senha', c.entrega_pass)}
                {field('URL', `https://${c.url}/entrega`)}
              </div>
              {c.provisioned_at && (
                <div style={{ marginTop: 8, color: '#aaa', fontSize: 11, textAlign: 'right' }}>
                  Provisionado em {new Date(c.provisioned_at).toLocaleString('pt-BR')}
                </div>
              )}
            </div>
          );
        })()}
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
