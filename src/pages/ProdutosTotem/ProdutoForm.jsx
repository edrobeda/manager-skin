import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button, Card, Input, Form, Select, Space, Tag, InputNumber, Checkbox, message,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { produtosTotemService } from '../../services/produtosTotemService';
import { api } from '../../services/api';
import { useTenant } from '../../contexts/TenantContext';
import RichTextEditor from '../../components/RichTextEditor';
import ImageUpload from '../../components/ImageUpload/ImageUpload';
import VideoUpload from '../../components/VideoUpload/VideoUpload';

const STATUS_COLOR = { ativo: 'green', agendado: 'blue', expirando: 'orange', encerrado: 'default' };

export default function ProdutoForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { isSuper } = useTenant();
  const [eventos, setEventos] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [produto, setProduto] = useState(null);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const eventosData = await api.get('/eventos');
        setEventos(eventosData.eventos ?? []);

        if (isSuper) {
          const tenantsData = await api.get('/tenants');
          setTenants(tenantsData.tenants ?? []);
        }

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
          {isSuper && (
            <Form.Item
              name="tenant_id" label="Tenant"
              rules={[{ required: true, message: 'Selecione o tenant' }]}
            >
              <Select
                disabled={editing}
                placeholder="Selecione o tenant"
                options={tenants.map(t => ({ value: t.id, label: t.nome }))}
              />
            </Form.Item>
          )}

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

          <Space size={32}>
            <Form.Item name="imagem_produto_url" label="Imagem do produto">
              <ImageUpload />
            </Form.Item>
            <Form.Item name="imagem_banner_url" label="Imagem do banner">
              <ImageUpload />
            </Form.Item>
          </Space>

          <Form.Item name="video_url" label="URL do vídeo (YouTube, opcional)">
            <Input placeholder="https://youtube.com/..." />
          </Form.Item>

          <Form.Item
            name="video_local_url"
            label="Vídeo local (backup, tocado direto no totem sem depender do YouTube)"
          >
            <VideoUpload />
          </Form.Item>

          <Form.Item name="url_ficha" label="URL da ficha completa (QR code no totem, opcional)">
            <Input placeholder="https://vetnil.com.br/produto/..." />
          </Form.Item>

          <Form.Item name="serie" label="Série (agrupamento no totem, opcional)">
            <Input placeholder="Ex: Lançamento Vetnil 2026" />
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

          <Form.Item name="destaque" valuePropName="checked" initialValue={false}>
            <Checkbox>Destaque no carrossel do totem</Checkbox>
          </Form.Item>

          <Form.Item name="banner_institucional" valuePropName="checked" initialValue={false}>
            <Checkbox>
              Banner institucional (aparece só no carrossel, mesmo com o produto inativo — use pra banners sem produto de verdade por trás)
            </Checkbox>
          </Form.Item>

          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
            Salvar
          </Button>
        </Form>
      </Card>
    </>
  );
}
