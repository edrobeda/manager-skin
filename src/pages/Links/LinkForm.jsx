import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Input, Form, InputNumber, Checkbox, Space, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { linkService } from '../../services/linkService';

const validateURL = (value) => {
  if (!value) return Promise.reject(new Error('URL é obrigatória'));
  try {
    new URL(value);
    return Promise.resolve();
  } catch {
    return Promise.reject(new Error('URL inválida'));
  }
};

export default function LinkForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    const load = async () => {
      try {
        const data = await linkService.getById(id);
        setLink(data);
        form.setFieldsValue(data);
      } catch (e) {
        message.error(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        await linkService.update(id, values);
        message.success('Link atualizado');
      } else {
        await linkService.create(values);
        message.success('Link criado');
      }
      navigate('/dashboard/links');
    } catch (e) {
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard/links')}>
          Voltar
        </Button>
        <h2 style={{ margin: 0 }}>{editing ? `Editar link — ${link?.label ?? ''}` : 'Novo link'}</h2>
      </Space>

      <Card loading={loading} style={{ maxWidth: 600 }}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="label" label="Texto do botão"
            rules={[{ required: true, message: 'Informe o texto exibido no botão' }]}
          >
            <Input placeholder="Ex: Fale no WhatsApp" maxLength={255} />
          </Form.Item>

          <Form.Item
            name="url" label="URL de destino"
            rules={[{ validator: (_, value) => validateURL(value) }]}
          >
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item name="icon_url" label="Ícone (URL da imagem, opcional)">
            <Input placeholder="https://.../icone.svg" />
          </Form.Item>

          <Form.Item name="position" label="Ordem de exibição" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="active" valuePropName="checked" initialValue={true}>
            <Checkbox>Ativo (aparece em eventifylab.com/links)</Checkbox>
          </Form.Item>

          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
            Salvar
          </Button>
        </Form>
      </Card>
    </>
  );
}
