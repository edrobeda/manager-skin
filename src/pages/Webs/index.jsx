import { useState, useEffect } from 'react';
import { Button, Empty, Space, message, Card, Row, Col, Tag, Modal, Tooltip, Table } from 'antd';
import { PlusOutlined, DeleteOutlined, LinkOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { webService } from '../../services/webService';

const Webs = () => {
  const [webs, setWebs] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadWebs();
    checkLocalStorageMigration();
  }, []);

  const checkLocalStorageMigration = () => {
    const savedWebs = localStorage.getItem('webs');
    if (savedWebs) {
      try {
        const localWebs = JSON.parse(savedWebs);
        if (localWebs.length > 0) {
          Modal.confirm({
            title: 'Migrar dados do localStorage',
            content: `Encontramos ${localWebs.length} página(s) web salvas localmente. Deseja migrar para o banco de dados?`,
            okText: 'Migrar',
            cancelText: 'Cancelar',
            onOk: () => migrateFromLocalStorage(localWebs),
          });
        }
      } catch (error) {
        console.error('Erro ao verificar localStorage:', error);
      }
    }
  };

  const migrateFromLocalStorage = async (localWebs) => {
    setLoading(true);
    try {
      await webService.migrate(localWebs);
      localStorage.removeItem('webs');
      message.success(`${localWebs.length} página(s) migrada(s) com sucesso!`);
      loadWebs();
    } catch (error) {
      message.error('Erro ao migrar páginas');
      console.error('Erro ao migrar:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWebs = async () => {
    setLoading(true);
    try {
      const data = await webService.getAll();
      setWebs(data);
    } catch (error) {
      message.error('Erro ao carregar páginas web');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWeb = () => {
    navigate('/dashboard/configuracoes/add-web');
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Deletar página web',
      content: 'Tem certeza que deseja deletar esta página?',
      okText: 'Deletar',
      cancelText: 'Cancelar',
      okButtonProps: { danger: true },
      async onOk() {
        try {
          await webService.delete(id);
          message.success('Página deletada');
          loadWebs();
        } catch (error) {
          message.error('Erro ao deletar página');
          console.error(error);
        }
      },
    });
  };

  const handleToggleFavorite = async (id) => {
    try {
      await webService.toggleFavorite(id);
      message.success('Favorito atualizado');
      loadWebs();
    } catch (error) {
      message.error('Erro ao atualizar favorito');
      console.error(error);
    }
  };

  const handleOpenWeb = (url) => {
    window.open(url, '_blank');
  };

  const columns = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      render: (url) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {url.length > 40 ? url.substring(0, 40) + '...' : url}
        </span>
      ),
    },
    {
      title: 'Data',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date) => new Date(date).toLocaleDateString('pt-BR'),
    },
    {
      title: 'Favorito',
      dataIndex: 'favorite',
      key: 'favorite',
      width: 80,
      render: (favorite) => favorite ? <Tag color="gold">Sim</Tag> : <Tag>Não</Tag>,
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Abrir">
            <Button
              size="small"
              icon={<LinkOutlined />}
              onClick={() => handleOpenWeb(record.url)}
            />
          </Tooltip>
          <Tooltip title={record.favorite ? 'Remover favorito' : 'Adicionar favorito'}>
            <Button
              size="small"
              icon={record.favorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
              onClick={() => handleToggleFavorite(record.id)}
            />
          </Tooltip>
          <Tooltip title="Deletar">
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Minhas Páginas Web</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddWeb}
        >
          Add Web
        </Button>
      </div>

      {webs.length === 0 ? (
        <Empty
          description="Nenhuma página web adicionada"
          style={{ marginTop: 48 }}
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddWeb}
          >
            Adicionar primeira página
          </Button>
        </Empty>
      ) : (
        <Card
          style={{
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <Table
            columns={columns}
            dataSource={webs}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: 'Nenhuma página encontrada',
            }}
            size="middle"
            scroll={{ x: 'max-content' }}
          />
        </Card>
      )}
    </div>
  );
};

export default Webs;
