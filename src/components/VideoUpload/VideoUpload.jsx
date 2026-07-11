import { useState } from 'react';
import { Upload, Button, Space, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { api } from '../../services/api';

// Componente controlado (value/onChange) — compatível direto com Form.Item, sem precisar de valuePropName
export default function VideoUpload({ value, onChange }) {
  const [loading, setLoading] = useState(false);

  const customRequest = async ({ file, onSuccess, onError }) => {
    setLoading(true);
    try {
      const { url } = await api.upload('/totem-uploads', file);
      onChange?.(url);
      onSuccess?.(url);
    } catch (e) {
      message.error(e.message);
      onError?.(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical">
      {value && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video src={value} controls width={220} style={{ borderRadius: 8, background: '#000' }} />
      )}
      <Upload accept="video/mp4,video/webm,video/quicktime" showUploadList={false} customRequest={customRequest}>
        <Button icon={<UploadOutlined />} loading={loading}>
          {value ? 'Trocar vídeo' : 'Enviar vídeo'}
        </Button>
      </Upload>
    </Space>
  );
}
