import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button, Card, Input, Form, Select, Space, Tag, InputNumber, message,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { produtosTotemService } from '../../services/produtosTotemService';
import { api } from '../../services/api';
import RichTextEditor from '../../components/RichTextEditor';

const STATUS_COLOR = { ativo: 'green', agendado: 'blue', expirando: 'orange', encerrado: 'default' };

export default function ProdutoForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [eventos, setEventos] = useState([]);
  const [produto, setProduto] = useState(null);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const eventosData = await api.get('/eventos');
        setEventos(eventosData.eventos ?? []);

        if (editing) {
          const data = await produtosTotemService.getById(id);
          setProduto(data);
          form.setFieldsValue(data);
        }
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
        await produtosTotemService.update(id, values);
        message.success('Produto atualizado');
      } else {
        await produtosTotemService.create(values);
        message.success('Produto criado');
      }
      navigate('/dashboard/produtos-totem');
    } catch (e) {
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard/produtos-totem')}>
          Voltar
        </Button>
        <h2 style={{ margin: 0 }}>{editing ? `Editar produto — ${produto?.nome ?? ''}` : 'Novo produto'}</h2>
      </Space>

      <Card loading={loading}>
        <Form form={form} layout="vertical">
          <Space.Compact block>
            <Form.Item
              name="linha" label="Linha (categoria)" style={{ flex: 1 }}
              rules={[{ required: true, message: 'Informe a linha do produto' }]}
            >
              <Input placeholder="Ex: Caninos" />
            </Form.Item>
            <Form.Item
              name="nome" label="Nome do produto" style={{ flex: 1, marginLeft: 8 }}
              rules={[{ required: true, message: 'Informe o nome do produto' }]}
            >
              <Input placeholder="Ex: ProbioUp" />
            </Form.Item>
          </Space.Compact>

          {editing && (
            <Form.Item label="Slug (gerado automaticamente)">
              <Input value={produto?.slug} disabled />
            </Form.Item>
          )}

          <Form.Item name="descricao_curta" label="Descrição curta">
            <Input placeholder="Ex: O up que faltava na saúde intestinal do pets!" maxLength={500} />
          </Form.Item>

          <Form.Item name="descricao" label="Descrição completa">
            <RichTextEditor />
          </Form.Item>

          <Space.Compact block>
            <Form.Item name="imagem_produto_url" label="URL imagem do produto" style={{ flex: 1 }}>
              <Input placeholder="https://..." />
            </Form.Item>
            <Form.Item name="imagem_banner_url" label="URL imagem do banner" style={{ flex: 1, marginLeft: 8 }}>
              <Input placeholder="https://..." />
            </Form.Item>
          </Space.Compact>

          <Form.Item name="video_url" label="URL do vídeo (YouTube, opcional)">
            <Input placeholder="https://youtube.com/..." />
          </Form.Item>

          <Space.Compact block>
            <Form.Item name="evento_id" label="Evento vinculado (opcional)" style={{ flex: 1 }}>
              <Select
                allowClear
                placeholder="Sem vínculo (visível em qualquer evento do tenant)"
                options={eventos.map(e => ({
                  value: e.id,
                  label: (
                    <Space>
                      <Tag color={STATUS_COLOR[e.status] ?? 'default'}>{e.status}</Tag>
                      {e.nome}
                    </Space>
                  ),
                }))}
              />
            </Form.Item>
            <Form.Item name="ordem" label="Ordem de exibição" initialValue={0} style={{ width: 160, marginLeft: 8 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>

          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
            Salvar
          </Button>
        </Form>
      </Card>
    </>
  );
}
