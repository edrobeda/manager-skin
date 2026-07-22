import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, message, Popconfirm, Upload, Alert } from 'antd';
import {
  InboxOutlined,
  DownloadOutlined,
  DeleteOutlined,
  ReloadOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { useTenant } from '../../contexts/TenantContext';

const { Dragger } = Upload;

const getToken = () => {
  const session = localStorage.getItem('session');
  return session ? JSON.parse(session).token : null;
};

const Uploads = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { can } = useTenant();

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/uploads', { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao listar arquivos');
      setFiles(data.files);
    } catch (err) {
      message.error(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const res = await fetch('/api/uploads', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar arquivo');
      message.success(`Arquivo enviado: ${data.file.name}`);
      fetchFiles();
    } catch (err) {
      message.error(err.message);
    }
    setUploading(false);
    return false; // impede upload automático do antd
  };

  const downloadFile = (filename) => {
    fetch(`/api/uploads/download/${encodeURIComponent(filename)}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
      });
  };

  const deleteFile = async (filename) => {
    try {
      const res = await fetch(`/api/uploads/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao deletar arquivo');
      message.success('Arquivo deletado!');
      fetchFiles();
    } catch (err) {
      message.error(err.message);
    }
  };

  const columns = [
    {
      title: 'Arquivo',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Space>
          <FileOutlined style={{ color: '#1890ff' }} />
          <span style={{ wordBreak: 'break-all' }}>{text}</span>
        </Space>
      ),
    },
    { title: 'Tamanho', dataIndex: 'size', key: 'size', width: 110 },
    {
      title: 'Data',
      dataIndex: 'date',
      key: 'date',
      width: 160,
      render: (text) => new Date(text).toLocaleString('pt-BR'),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Button type="primary" size="small" icon={<DownloadOutlined />} onClick={() => downloadFile(record.name)}>
            Baixar
          </Button>
          {can('uploads:delete') && (
            <Popconfirm
              title="Deletar arquivo?"
              description="Esta ação não pode ser desfeita."
              onConfirm={() => deleteFile(record.name)}
              okText="Deletar"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
            >
              <Button danger size="small" icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Uploads</h2>

      <Alert
        message="Arquivos compartilhados"
        description="Envie e baixe arquivos diretamente pelo manager — o acesso é controlado pelo seu login, sem senha separada."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card style={{ marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <Dragger
          multiple={false}
          showUploadList={false}
          disabled={uploading}
          beforeUpload={handleUpload}
          accept=".png,.jpg,.jpeg,.gif,.webp,.svg,.pdf,.doc,.docx,.xml,.xls,.xlsx,.mp4,.webm,.mov"
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Clique ou arraste um arquivo para enviar</p>
          <p className="ant-upload-hint">Imagens, PDF, Word, Excel, XML, vídeo (MP4/WEBM/MOV) · Máx 250 MB</p>
        </Dragger>
      </Card>

      <Card
        title={
          <Space>
            <FileOutlined />
            <span>Arquivos enviados</span>
          </Space>
        }
        extra={<Button icon={<ReloadOutlined />} onClick={fetchFiles} loading={loading} />}
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
      >
        <Table
          columns={columns}
          dataSource={files}
          rowKey="name"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'Nenhum arquivo enviado ainda.' }}
          size="middle"
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
};

export default Uploads;
