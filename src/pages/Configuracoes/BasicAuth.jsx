import { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Input, Form, Switch, Select, Popconfirm,
  Tag, Typography, Alert, Space, message, Tooltip,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, KeyOutlined,
  CopyOutlined, LinkOutlined, DisconnectOutlined,
} from '@ant-design/icons';
import { api } from '../../services/api';

const { Text, Paragraph } = Typography;

const STATUS_COLOR = { ativo: 'green', agendado: 'blue', expirando: 'orange', encerrado: 'default' };

export default function BasicAuth() {
  const [keys, setKeys]           = useState([]);
  const [eventos, setEventos]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [tokenModal, setTokenModal] = useState(null);
  const [vinculoModal, setVinculoModal] = useState(null); // { id, nome, evento_id }
  const [form] = Form.useForm();
  const [vinculoForm] = Form.useForm();
  const [creating, setCreating]   = useState(false);
  const [savingVinculo, setSavingVinculo] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [keysData, eventosData] = await Promise.all([
        api.get('/basic-auth'),
        api.get('/eventos'),
      ]);
      setKeys(keysData);
      setEventos(eventosData.eventos ?? []);
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const eventoMap = Object.fromEntries(eventos.map(e => [e.id, e]));

  const handleCreate = async () => {
    const { nome, evento_id } = await form.validateFields();
    setCreating(true);
    try {
      const data = await api.post('/basic-auth', { nome, evento_id: evento_id ?? null });
      setModalOpen(false);
      form.resetFields();
      setTokenModal({ nome: data.nome, token: data.token });
      load();
    } catch (e) {
      message.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id, ativo) => {
    try {
      await api.patch(`/basic-auth/${id}`, { ativo });
      setKeys(prev => prev.map(k => k.id === id ? { ...k, ativo } : k));
    } catch (e) {
      message.error(e.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/basic-auth/${id}`);
      setKeys(prev => prev.filter(k => k.id !== id));
      message.success('Chave removida');
    } catch (e) {
      message.error(e.message);
    }
  };

  const openVinculo = (record) => {
    setVinculoModal(record);
    vinculoForm.setFieldsValue({ evento_id: record.evento_id ?? undefined });
  };

  const handleSaveVinculo = async () => {
    const { evento_id } = vinculoForm.getFieldsValue();
    setSavingVinculo(true);
    try {
      await api.patch(`/basic-auth/${vinculoModal.id}`, { evento_id: evento_id ?? null });
      setKeys(prev => prev.map(k => k.id === vinculoModal.id ? { ...k, evento_id: evento_id ?? null } : k));
      message.success('Vínculo atualizado');
      setVinculoModal(null);
    } catch (e) {
      message.error(e.message);
    } finally {
      setSavingVinculo(false);
    }
  };

  const copyToken = (token) => {
    navigator.clipboard.writeText(token);
    message.success('Token copiado!');
  };

  const columns = [
    { title: 'Nome', dataIndex: 'nome', key: 'nome', width: 200 },
    {
      title: 'Evento vinculado', dataIndex: 'evento_id', key: 'evento_id',
      render: (eventoId) => {
        if (!eventoId) return <Text type="secondary">—</Text>;
        const ev = eventoMap[eventoId];
        if (!ev) return <Tag>{eventoId}</Tag>;
        return (
          <Space size={4}>
            <Tag color={STATUS_COLOR[ev.status] ?? 'default'}>{ev.status}</Tag>
            <Text>{ev.nome}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Status', dataIndex: 'ativo', key: 'ativo', width: 120,
      render: (ativo, record) => (
        <Switch
          checked={ativo}
          checkedChildren="Ativa"
          unCheckedChildren="Inativa"
          onChange={(val) => handleToggle(record.id, val)}
        />
      ),
    },
    {
      title: 'Criada em', dataIndex: 'created_at', key: 'created_at', width: 160,
      render: (v) => new Date(v).toLocaleString('pt-BR'),
    },
    {
      title: 'Ações', key: 'acoes', width: 140,
      render: (_, record) => (
        <Space>
          <Tooltip title={record.evento_id ? 'Alterar vínculo de evento' : 'Vincular a um evento'}>
            <Button
              size="small"
              icon={record.evento_id ? <LinkOutlined /> : <LinkOutlined />}
              onClick={() => openVinculo(record)}
            >
              Evento
            </Button>
          </Tooltip>
          <Popconfirm
            title="Remover esta chave?"
            description="Integrações usando esta chave perderão acesso imediatamente."
            onConfirm={() => handleDelete(record.id)}
            okText="Remover"
            okButtonProps={{ danger: true }}
            cancelText="Cancelar"
          >
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>Chaves de API (Basic Auth)</h2>
          <Text type="secondary">
            Credenciais para acesso sem JWT. Formato: <Text code>Authorization: Basic base64(:token)</Text>
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Nova chave
        </Button>
      </div>

      <Table
        rowKey="id"
        dataSource={keys}
        columns={columns}
        loading={loading}
        pagination={false}
        locale={{ emptyText: 'Nenhuma chave criada' }}
      />

      {/* Modal criar chave */}
      <Modal
        title={<><KeyOutlined /> Nova chave de API</>}
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        okText="Gerar chave"
        confirmLoading={creating}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="nome"
            label="Nome / identificação"
            rules={[{ required: true, message: 'Informe um nome para a chave' }]}
          >
            <Input placeholder="Ex: game-vetnil-2026, n8n-integration" />
          </Form.Item>
          <Form.Item name="evento_id" label="Evento vinculado (opcional)">
            <Select
              allowClear
              placeholder="Selecione um evento para controle de acesso por data"
              options={eventos.map(e => ({
                value: e.id,
                label: (
                  <Space>
                    <Tag color={STATUS_COLOR[e.status] ?? 'default'}>{e.status}</Tag>
                    {e.nome}
                  </Space>
                ),
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal exibir token — apenas uma vez */}
      <Modal
        title={<><Tag color="green">Chave criada</Tag> Guarde seu token</>}
        open={!!tokenModal}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} type="primary" onClick={() => copyToken(tokenModal?.token)}>
            Copiar token
          </Button>,
          <Button key="close" onClick={() => setTokenModal(null)}>Fechar</Button>,
        ]}
        onCancel={() => setTokenModal(null)}
        closable={false}
        maskClosable={false}
      >
        <Alert
          type="warning"
          showIcon
          message="Este token é exibido uma única vez e não pode ser recuperado."
          style={{ marginBottom: 16 }}
        />
        <Paragraph>
          <Text strong>Token (cole no .env do game):</Text>
          <br />
          <Text code copyable style={{ wordBreak: 'break-all' }}>{tokenModal?.token}</Text>
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>Variável de ambiente:</Text>
          <br />
          <Text code copyable style={{ wordBreak: 'break-all' }}>
            {tokenModal ? `VITE_API_TOKEN=${tokenModal.token}` : ''}
          </Text>
        </Paragraph>
      </Modal>

      {/* Modal vincular evento */}
      <Modal
        title={<><LinkOutlined /> Vincular evento — {vinculoModal?.nome}</>}
        open={!!vinculoModal}
        onOk={handleSaveVinculo}
        onCancel={() => setVinculoModal(null)}
        okText="Salvar"
        confirmLoading={savingVinculo}
      >
        <Form form={vinculoForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="evento_id" label="Evento">
            <Select
              allowClear
              placeholder="Sem vínculo (chave ativa enquanto não revogada)"
              options={eventos.map(e => ({
                value: e.id,
                label: (
                  <Space>
                    <Tag color={STATUS_COLOR[e.status] ?? 'default'}>{e.status}</Tag>
                    {e.nome}
                  </Space>
                ),
              }))}
            />
          </Form.Item>
          <Alert
            type="info"
            showIcon
            message="Se vinculada a um evento, o game só funciona durante o período ativo do evento. Fora do período, o acesso é bloqueado automaticamente."
          />
        </Form>
      </Modal>
    </>
  );
}
