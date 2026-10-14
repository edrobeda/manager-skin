import { useEffect, useState } from 'react';
import { Table, Tag, Typography, Button, Modal, Form, Input, Switch, message, Space } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { api } from '../../services/api';

const { Title } = Typography;

// Catálogo de produtos do core (ROADMAP.md §4 do modelo de dados — tabela
// `produtos`, cadastro simples: slug/nome/surface/domínio). Diferente de
// "Produtos Totem" (produtos_totem, catálogo de peças do Vitrine de um
// tenant) — aqui é o catálogo de PRODUTOS DA PLATAFORMA (Vitrine/Jogo/
// Salve/etc), consumido por tenant_produtos (contratos) e ativacoes.
export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/core/produtos');
      setProdutos(data.produtos);
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNovo = () => {
    setModal({ open: true, editing: null });
    form.resetFields();
    form.setFieldsValue({ ativo: true });
  };

  const openEditar = (produto) => {
    setModal({ open: true, editing: produto });
    form.setFieldsValue(produto);
  };

  const salvar = async () => {
    try {
      const valores = await form.validateFields();
      if (modal.editing) {
        await api.put(`/core/produtos/${modal.editing.id}`, valores);
        message.success('Produto atualizado');
      } else {
        await api.post('/core/produtos', valores);
        message.success('Produto criado');
      }
      setModal({ open: false, editing: null });
      load();
    } catch (e) {
      if (e?.errorFields) return; // erro de validação do form, já mostrado inline
      message.error(e.message);
    }
  };

  const columns = [
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    { title: 'Slug', dataIndex: 'slug', key: 'slug', render: (v) => <code>{v}</code> },
    { title: 'Surface', dataIndex: 'surface', key: 'surface', render: (v) => v ? <code>/{v}</code> : <span style={{ color: '#999' }}>—</span> },
    { title: 'Domínio próprio', dataIndex: 'dominio', key: 'dominio', render: (v) => v || <span style={{ color: '#999' }}>sob eventifylab.com</span> },
    {
      title: 'Status',
      dataIndex: 'ativo',
      key: 'ativo',
      render: (v) => <Tag color={v ? 'green' : 'default'}>{v ? 'ATIVO' : 'INATIVO'}</Tag>,
    },
    {
      title: '',
      key: 'acoes',
      render: (_, row) => <Button size="small" icon={<EditOutlined />} onClick={() => openEditar(row)}>Editar</Button>,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <Title level={4} style={{ margin: 0 }}>Produtos</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openNovo}>Novo produto</Button>
      </div>

      <Table
        rowKey="id"
        dataSource={produtos}
        columns={columns}
        loading={loading}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title={modal.editing ? 'Editar produto' : 'Novo produto'}
        open={modal.open}
        onCancel={() => setModal({ open: false, editing: null })}
        onOk={salvar}
        okText="Salvar"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="nome" label="Nome" rules={[{ required: true, message: 'Obrigatório' }]}>
            <Input placeholder="ex: Vitrine" />
          </Form.Item>
          <Form.Item
            name="slug"
            label="Slug"
            rules={[{ required: true, message: 'Obrigatório' }, { pattern: /^[a-z0-9-]+$/, message: 'Apenas letras minúsculas, números e -' }]}
          >
            <Input placeholder="ex: vitrine" disabled={!!modal.editing} />
          </Form.Item>
          <Form.Item
            name="surface"
            label="Surface (path quando não tem domínio próprio)"
            extra="Deixe em branco se o produto tiver domínio próprio (ex: Salve → mandasalve.com)"
          >
            <Input placeholder="ex: vitrine" />
          </Form.Item>
          <Form.Item name="dominio" label="Domínio próprio (opcional)" extra="Deixe em branco pra servir sob {tenant}.eventifylab.com">
            <Input placeholder="ex: mandasalve.com" />
          </Form.Item>
          <Form.Item name="ativo" label="Ativo" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
