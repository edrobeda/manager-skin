import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Button, Switch, Popconfirm, Tag, Typography, Space, message, Image, Input,
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { produtosTotemService } from '../../services/produtosTotemService';
import { api } from '../../services/api';

const { Text } = Typography;

const STATUS_COLOR = { ativo: 'green', agendado: 'blue', expirando: 'orange', encerrado: 'default' };

export default function ProdutosTotem() {
  const [produtos, setProdutos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const [produtosData, eventosData] = await Promise.all([
        produtosTotemService.getAll(),
        api.get('/eventos'),
      ]);
      setProdutos(produtosData);
      setEventos(eventosData.eventos ?? []);
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const eventoMap = Object.fromEntries(eventos.map(e => [e.id, e]));

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return produtos;
    return produtos.filter(p => [p.nome, p.linha, p.serie, p.slug]
      .some(campo => campo?.toLowerCase().includes(termo)));
  }, [produtos, busca]);

  const handleDelete = async (id) => {
    try {
      await produtosTotemService.delete(id);
      setProdutos(prev => prev.filter(p => p.id !== id));
      message.success('Produto removido');
    } catch (e) {
      message.error(e.message);
    }
  };

  const handleToggleAtivo = async (record, ativo) => {
    try {
      const produto = await produtosTotemService.update(record.id, { ativo });
      setProdutos(prev => prev.map(p => p.id === produto.id ? produto : p));
    } catch (e) {
      message.error(e.message);
    }
  };

  const handleToggleDestaque = async (record, destaque) => {
    try {
      const produto = await produtosTotemService.update(record.id, { destaque });
      setProdutos(prev => prev.map(p => p.id === produto.id ? produto : p));
    } catch (e) {
      message.error(e.message);
    }
  };

  const columns = [
    {
      title: 'Imagem', dataIndex: 'imagem_produto_url', key: 'imagem', width: 80,
      render: (url) => url
        ? <Image src={url} width={48} height={48} style={{ objectFit: 'cover', borderRadius: 4 }} />
        : <Text type="secondary">—</Text>,
    },
    {
      title: 'Nome', dataIndex: 'nome', key: 'nome', render: (v) => <Text strong>{v}</Text>,
      sorter: (a, b) => a.nome.localeCompare(b.nome),
    },
    {
      title: 'Linha', dataIndex: 'linha', key: 'linha', render: (v) => <Tag>{v}</Tag>,
      sorter: (a, b) => (a.linha ?? '').localeCompare(b.linha ?? ''),
    },
    {
      title: 'Série', dataIndex: 'serie', key: 'serie',
      render: (v) => v ? <Tag color="purple">{v}</Tag> : <Text type="secondary">—</Text>,
      sorter: (a, b) => (a.serie ?? '').localeCompare(b.serie ?? ''),
    },
    { title: 'Slug', dataIndex: 'slug', key: 'slug', render: (v) => <Text code>{v}</Text> },
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
      title: 'Ordem', dataIndex: 'ordem', key: 'ordem', width: 80,
      sorter: (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0),
    },
    {
      title: 'Destaque', dataIndex: 'destaque', key: 'destaque', width: 100,
      render: (destaque, record) => (
        <Switch
          checked={destaque}
          checkedChildren="Carrossel"
          unCheckedChildren="—"
          onChange={(val) => handleToggleDestaque(record, val)}
        />
      ),
    },
    {
      title: 'Status', dataIndex: 'ativo', key: 'ativo', width: 100,
      render: (ativo, record) => (
        <Switch
          checked={ativo}
          checkedChildren="Ativo"
          unCheckedChildren="Inativo"
          onChange={(val) => handleToggleAtivo(record, val)}
        />
      ),
    },
    {
      title: 'Ações', key: 'acoes', width: 100,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/dashboard/produtos-totem/${record.id}/editar`)} />
          <Popconfirm
            title="Remover este produto?"
            description="O produto deixa de aparecer no totem imediatamente."
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 16 }}>
        <h2 style={{ margin: 0 }}>Produtos do Totem</h2>
        <Space>
          <Input
            placeholder="Buscar por nome, linha, série ou slug"
            prefix={<SearchOutlined />}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            allowClear
            style={{ width: 280 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/dashboard/produtos-totem/novo')}>
            Novo produto
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        dataSource={produtosFiltrados}
        columns={columns}
        loading={loading}
        pagination={false}
        locale={{ emptyText: 'Nenhum produto cadastrado' }}
      />
    </>
  );
}
