import { useState } from 'react';
import { Upload, Button, Image, Space, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { api } from '../../services/api';

// Componente controlado (value/onChange) — compatível direto com Form.Item, sem precisar de valuePropName
export default function ImageUpload({ value, onChange }) {
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
        <Image src={value} width={120} height={120} style={{ objectFit: 'cover', borderRadius: 8 }} />
      )}
      <Upload accept="image/*" showUploadList={false} customRequest={customRequest}>
        <Button icon={<UploadOutlined />} loading={loading}>
          {value ? 'Trocar imagem' : 'Enviar imagem'}
        </Button>
      </Upload>
    </Space>
  );
}
