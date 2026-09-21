import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Switch, Popconfirm, Typography, Space, message, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, LinkOutlined } from '@ant-design/icons';
import { linkService } from '../../services/linkService';

const { Text, Link: TextLink } = Typography;

export default function Links() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const data = await linkService.getAll();
      setLinks(data);
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    try {
      await linkService.delete(id);
      setLinks(prev => prev.filter(l => l.id !== id));
      message.success('Link removido');
    } catch (e) {
      message.error(e.message);
    }
  };

  const handleToggleActive = async (record) => {
    try {
      const updated = await linkService.toggleActive(record.id);
      setLinks(prev => prev.map(l => (l.id === updated.id ? updated : l)));
    } catch (e) {
      message.error(e.message);
    }
  };

  const columns = [
    {
      title: 'Ordem', dataIndex: 'position', key: 'position', width: 80,
      sorter: (a, b) => (a.position ?? 0) - (b.position ?? 0),
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Label', dataIndex: 'label', key: 'label',
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: 'URL', dataIndex: 'url', key: 'url',
      render: (url) => (
        <TextLink href={url} target="_blank" rel="noopener">
          {url.length > 50 ? `${url.slice(0, 50)}…` : url}
        </TextLink>
      ),
    },
    {
      title: 'Ativo', dataIndex: 'active', key: 'active', width: 100,
      render: (active, record) => (
        <Switch
          checked={active}
          checkedChildren="Sim"
          unCheckedChildren="Não"
          onChange={() => handleToggleActive(record)}
        />
      ),
    },
    {
      title: 'Ações', key: 'acoes', width: 100,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/dashboard/links/${record.id}/editar`)} />
          <Popconfirm
            title="Remover este link?"
            description="Ele some da página eventifylab.com/links imediatamente."
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 16, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>Links (eventifylab.com/links)</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/dashboard/links/novo')}>
          Novo link
        </Button>
      </div>

      <Table
        rowKey="id"
        dataSource={links}
        columns={columns}
        loading={loading}
        pagination={false}
        locale={{
          emptyText: (
            <Empty
              image={<LinkOutlined style={{ fontSize: 32 }} />}
              description="Nenhum link cadastrado ainda"
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/dashboard/links/novo')}>
                Criar o primeiro link
              </Button>
            </Empty>
          ),
        }}
      />
    </>
  );
}
