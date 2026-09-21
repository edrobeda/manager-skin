import { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, DatePicker, Tag, Space, Popconfirm, message, Typography, Drawer, Empty, List,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../../../services/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const STATUS_COLOR = {
  agendado: 'blue',
  ativo: 'green',
  expirando: 'orange',
  encerrado: 'default',
  cancelado: 'red',
};

export default function Calendario() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  // Drawer com as ativações do evento selecionado
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ativacoes, setAtivacoes] = useState([]);
  const [ativacoesLoading, setAtivacoesLoading] = useState(false);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/portal/eventos');
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
        await api.put(`/portal/eventos/${editing.id}`, payload);
        message.success('Evento atualizado');
      } else {
        await api.post('/portal/eventos', payload);
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
      await api.delete(`/portal/eventos/${id}`);
      message.success('Evento removido');
      load();
    } catch (e) {
      message.error(e.message);
    }
  };

  const openAtivacoes = async (row) => {
    setEventoSelecionado(row);
    setDrawerOpen(true);
    setAtivacoesLoading(true);
    try {
      const data = await api.get(`/portal/ativacoes?evento_id=${row.id}`);
      setAtivacoes(data.ativacoes);
    } catch (e) {
      message.error(e.message);
    } finally {
      setAtivacoesLoading(false);
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
      render: (s) => <Tag color={STATUS_COLOR[s] || 'default'}>{(s || '').toUpperCase()}</Tag>,
    },
    {
      title: 'Ações',
      key: 'acoes',
      render: (_, row) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openAtivacoes(row)} title="Ver ativações" />
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
          <Popconfirm title="Remover evento?" onConfirm={() => handleDelete(row.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <Title level={4} style={{ margin: 0 }}>Calendário</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Novo Evento
        </Button>
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

      <Drawer
        title={eventoSelecionado ? `Ativações — ${eventoSelecionado.nome}` : 'Ativações'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={420}
      >
        {ativacoesLoading ? (
          <Text type="secondary">Carregando...</Text>
        ) : ativacoes.length === 0 ? (
          <Empty description="Nenhuma ativação neste evento" />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={ativacoes}
            renderItem={(a) => (
              <List.Item key={a.id}>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Space>
                    <Text strong>{a.produto_nome || a.produto_slug}</Text>
                    <Tag color={STATUS_COLOR[a.status] || 'default'}>{(a.status || '').toUpperCase()}</Tag>
                  </Space>
                  {a.nome && <Text type="secondary">{a.nome}</Text>}
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {a.data_inicio ? dayjs(a.data_inicio).format('DD/MM/YYYY HH:mm') : '—'}
                    {' → '}
                    {a.data_fim ? dayjs(a.data_fim).format('DD/MM/YYYY HH:mm') : '—'}
                  </Text>
                </Space>
              </List.Item>
            )}
          />
        )}
      </Drawer>
    </div>
  );
}
