import { useState } from 'react';
import { Form, Input, Button, Card, Space, message, Checkbox } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { webService } from '../../services/webService';

const AddWeb = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateURL = (value) => {
    if (!value) return Promise.reject(new Error('URL é obrigatória'));
    try {
      new URL(value);
      return Promise.resolve();
    } catch {
      return Promise.reject(new Error('URL inválida'));
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await webService.create({
        name: values.name,
        url: values.url,
        description: values.description || '',
        favorite: values.favorite || false
      });

      message.success('Página web adicionada com sucesso!');
      navigate('/dashboard/webs');
    } catch (error) {
      message.error('Erro ao adicionar página web');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 24 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/dashboard/webs')}
          style={{ paddingLeft: 0 }}
        >
          Voltar
        </Button>
      </div>

      <Card title="Adicionar Nova Página Web">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            label="Nome da Página"
            name="name"
            rules={[{ required: true, message: 'Nome é obrigatório' }]}
          >
            <Input placeholder="Ex: Google" />
          </Form.Item>

          <Form.Item
            label="URL"
            name="url"
            rules={[{ validator: (_, value) => validateURL(value) }]}
          >
            <Input placeholder="https://example.com" />
          </Form.Item>

          <Form.Item
            label="Descrição"
            name="description"
          >
            <Input.TextArea
              placeholder="Descrição opcional"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="favorite"
            valuePropName="checked"
            initialValue={false}
          >
            <Checkbox>Adicionar aos favoritos</Checkbox>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Adicionar Página
              </Button>
              <Button onClick={() => navigate('/dashboard/webs')}>
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AddWeb;
