import { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, DatePicker, Tag, Space, Popconfirm, message, Typography
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../../services/api';
import { useTenant } from '../../contexts/TenantContext';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const STATUS_COLOR = {
  agendado: 'blue',
  ativo: 'green',
  expirando: 'orange',
  encerrado: 'default',
  cancelado: 'red',
};

export default function Eventos() {
  const { isAdmin, isSuper } = useTenant();
  const [eventos, setEventos] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const canEdit = isAdmin || isSuper;

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/eventos');
      setEventos(data.eventos);
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Superadmin vê/cria evento de qualquer tenant (routes/eventos.js exige
  // tenant_id no body pra esse role, já que não tem um implícito como o
  // admin de 1 tenant só) — carrega a lista só pra montar o Select.
  useEffect(() => {
    if (!isSuper) return;
    api.get('/tenants').then((data) => setTenants(data.tenants)).catch(() => {});
  }, [isSuper]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    form.setFieldsValue({
      nome: row.nome,
      descricao: row.descricao,
      periodo: [dayjs(row.data_inicio), dayjs(row.data_fim)],
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const [data_inicio, data_fim] = values.periodo;
      const payload = {
        nome: values.nome,
        descricao: values.descricao,
        data_inicio: data_inicio.toISOString(),
        data_fim: data_fim.toISOString(),
      };
      if (isSuper && !editing) payload.tenant_id = values.tenant_id;

      if (editing) {
        await api.put(`/eventos/${editing.id}`, payload);
        message.success('Evento atualizado');
      } else {
        await api.post('/eventos', payload);
        message.success('Evento criado');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      if (e.message) message.error(e.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/eventos/${id}`);
      message.success('Evento removido');
      load();
    } catch (e) {
      message.error(e.message);
    }
  };

  const columns = [
    ...(isSuper ? [{
      title: 'Tenant',
      dataIndex: 'tenant_nome',
      key: 'tenant_nome',
      render: (v, r) => v || <Tag color="default">{r.tenant_id}</Tag>,
    }] : []),
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
      render: (v, r) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>{v}</span>
          {r.descricao && <span style={{ color: '#888', fontSize: 12 }}>{r.descricao}</span>}
        </Space>
      ),
    },
    {
      title: 'Início',
      dataIndex: 'data_inicio',
      key: 'data_inicio',
      render: (v) => dayjs(v).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Fim',
      dataIndex: 'data_fim',
      key: 'data_fim',
      render: (v) => dayjs(v).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag color={STATUS_COLOR[s] || 'default'}>{s.toUpperCase()}</Tag>,
    },
    {
      title: 'Ações',
      key: 'acoes',
      render: (_, row) => canEdit ? (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
          <Popconfirm title="Remover evento?" onConfirm={() => handleDelete(row.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ) : null,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <Title level={4} style={{ margin: 0 }}>Eventos</Title>
        {canEdit && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Novo Evento
          </Button>
        )}
      </div>

      <Table
        rowKey="id"
        dataSource={eventos}
        columns={columns}
        loading={loading}
        pagination={{ pageSize: 10 }}
        rowClassName={(r) => r.status === 'encerrado' ? 'row-encerrado' : ''}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title={editing ? 'Editar Evento' : 'Novo Evento'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {isSuper && !editing && (
            <Form.Item name="tenant_id" label="Tenant" rules={[{ required: true, message: 'Selecione o tenant' }]}>
              <Select
                placeholder="Selecione o cliente"
                showSearch
                optionFilterProp="label"
                options={tenants.map((t) => ({ value: t.id, label: t.nome }))}
              />
            </Form.Item>
          )}
          <Form.Item name="nome" label="Nome do evento" rules={[{ required: true }]}>
            <Input placeholder="Ex: Feira de Tecnologia SP" />
          </Form.Item>
          <Form.Item name="descricao" label="Descrição">
            <Input.TextArea rows={2} placeholder="Opcional" />
          </Form.Item>
          <Form.Item name="periodo" label="Período" rules={[{ required: true, message: 'Informe o período' }]}>
            <RangePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
