import { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Input, Form, Switch, Popconfirm,
  Tag, Typography, Alert, Space, message,
} from 'antd';
import { PlusOutlined, DeleteOutlined, KeyOutlined, CopyOutlined } from '@ant-design/icons';
import { api } from '../../services/api';

const { Text, Paragraph } = Typography;

export default function BasicAuth() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [tokenModal, setTokenModal] = useState(null); // { nome, token }
  const [form] = Form.useForm();
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.get('/basic-auth');
      setKeys(data);
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    const { nome } = await form.validateFields();
    setCreating(true);
    try {
      const data = await api.post('/basic-auth', { nome });
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

  const copyToken = (token) => {
    navigator.clipboard.writeText(token);
    message.success('Token copiado!');
  };

  const columns = [
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    {
      title: 'Status', dataIndex: 'ativo', key: 'ativo',
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
      title: 'Criada em', dataIndex: 'created_at', key: 'created_at',
      render: (v) => new Date(v).toLocaleString('pt-BR'),
    },
    {
      title: 'Ações', key: 'acoes',
      render: (_, record) => (
        <Popconfirm
          title="Remover esta chave?"
          description="Integrações usando esta chave perderão acesso imediatamente."
          onConfirm={() => handleDelete(record.id)}
          okText="Remover"
          okButtonProps={{ danger: true }}
          cancelText="Cancelar"
        >
          <Button danger size="small" icon={<DeleteOutlined />}>Remover</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>Chaves de API (Basic Auth)</h2>
          <Text type="secondary">Use estas chaves para acessar a API sem JWT. Formato: <Text code>Authorization: Basic base64(nome:token)</Text></Text>
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
            <Input placeholder="Ex: n8n-integration, mobile-app, erp-sync" />
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
          <Text strong>Token:</Text>
          <br />
          <Text code copyable style={{ wordBreak: 'break-all' }}>{tokenModal?.token}</Text>
        </Paragraph>
        <Paragraph>
          <Text strong>Exemplo de uso:</Text>
          <br />
          <Text code style={{ wordBreak: 'break-all' }}>
            {tokenModal ? `Authorization: Basic ${btoa(`${tokenModal.nome}:${tokenModal.token}`)}` : ''}
          </Text>
        </Paragraph>
      </Modal>
    </>
  );
}
