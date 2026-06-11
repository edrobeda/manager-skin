import { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, DatePicker, Tag, Space, Popconfirm, message, Typography
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
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
