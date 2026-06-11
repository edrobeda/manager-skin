import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, message, Tag, Popconfirm, Select, Alert } from 'antd';
import { api } from '../../services/api';
import { useTenant } from '../../contexts/TenantContext';
import {
  CloudDownloadOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

const Backup = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(null);
  const [selectedDb, setSelectedDb] = useState('all');
  const { can } = useTenant();

  const databases = [
    { value: 'all', label: 'Todos os bancos', color: 'purple' },
    { value: 'n8n', label: 'N8N', color: 'blue' },
    { value: 'mydb', label: 'MyDB', color: 'green' },
    { value: 'eventify', label: 'Eventify', color: 'orange' }
  ];

  const getTypeColor = (type) => {
    const db = databases.find(d => d.value === type);
    return db ? db.color : 'default';
  };

  const getTypeLabel = (type) => {
    const db = databases.find(d => d.value === type);
    return db ? db.label : type;
  };

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const data = await api.get('/backups');
      setBackups(data.backups);
    } catch (err) {
      message.error(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const createBackup = async () => {
    setCreating(true);
    try {
      const data = await api.post('/backups', { database: selectedDb });
      message.success(data.message);
      fetchBackups();
    } catch (err) {
      message.error(err.message);
    }
    setCreating(false);
  };

  const restoreBackup = async (filename) => {
    setRestoring(filename);
    try {
      await api.post('/backups/restore', { filename });
      message.success('Backup restaurado com sucesso!');
    } catch (err) {
      message.error(err.message);
    }
    setRestoring(null);
  };

  const deleteBackup = async (filename) => {
    try {
      await api.delete(`/backups/${filename}`);
      message.success('Backup deletado!');
      fetchBackups();
    } catch (err) {
      message.error(err.message);
    }
  };

  const downloadBackup = (filename) => {
    const token = JSON.parse(localStorage.getItem('session') || '{}').token;
    const url = `/api/backups/download/${filename}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
      });
  };

  const columns = [
    {
      title: 'Arquivo',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Space>
          <DatabaseOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{text}</span>
        </Space>
      )
    },
    {
      title: 'Tipo',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => <Tag color={getTypeColor(type)}>{getTypeLabel(type)}</Tag>
    },
    {
      title: 'Tamanho',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: 'Data',
      dataIndex: 'date',
      key: 'date',
      width: 160,
      render: (text) => new Date(text).toLocaleString('pt-BR')
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 280,
      render: (_, record) => (
        <Space size="small">
          <Button type="primary" size="small" icon={<DownloadOutlined />} onClick={() => downloadBackup(record.name)}>
            Baixar
          </Button>
          {can('backup:restore') && (
            <Popconfirm
              title="Restaurar backup?"
              description={<div style={{ maxWidth: 300 }}><ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />Isso irá sobrescrever os dados atuais do banco!</div>}
              onConfirm={() => restoreBackup(record.name)}
              okText="Sim, restaurar" cancelText="Cancelar" okButtonProps={{ danger: true }}
            >
              <Button size="small" icon={<CloudUploadOutlined />} loading={restoring === record.name}>Restaurar</Button>
            </Popconfirm>
          )}
          {can('backup:delete') && (
            <Popconfirm title="Deletar backup?" description="Esta ação não pode ser desfeita." onConfirm={() => deleteBackup(record.name)} okText="Deletar" cancelText="Cancelar" okButtonProps={{ danger: true }}>
              <Button danger size="small" icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Backup</h2>

      <Alert
        message="Sistema de Backup PostgreSQL"
        description="Faça backup de todos os bancos (incluindo N8N) ou selecione um banco específico. Os backups incluem todas as tabelas, dados, workflows e credenciais."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card
        title={
          <Space>
            <DatabaseOutlined />
            <span>Backups do PostgreSQL</span>
          </Space>
        }
        extra={
          <Space>
            <Select
              value={selectedDb}
              onChange={setSelectedDb}
              style={{ width: 160 }}
              options={databases}
            />
            <Button
              type="primary"
              icon={<CloudDownloadOutlined />}
              onClick={createBackup}
              loading={creating}
            >
              Criar Backup
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchBackups}
              loading={loading}
            />
          </Space>
        }
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
      >
        <Table
          columns={columns}
          dataSource={backups}
          rowKey="name"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: 'Nenhum backup encontrado. Clique em "Criar Backup" para começar.'
          }}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default Backup;
