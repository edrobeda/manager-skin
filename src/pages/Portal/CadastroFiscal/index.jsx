import { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Row, Col } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { api } from '../../../services/api';

const { Title, Text } = Typography;

export default function CadastroFiscal() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/portal/faturamento');
      const f = data.faturamento;
      if (f) {
        form.setFieldsValue({
          razao_social: f.razao_social,
          documento: f.documento,
          ie: f.ie,
          logradouro: f.endereco?.logradouro,
          numero: f.endereco?.numero,
          complemento: f.endereco?.complemento,
          bairro: f.endereco?.bairro,
          cidade: f.endereco?.cidade,
          uf: f.endereco?.uf,
          cep: f.endereco?.cep,
          contato_financeiro_nome: f.contato_financeiro_nome,
          contato_financeiro_email: f.contato_financeiro_email,
          contato_financeiro_telefone: f.contato_financeiro_telefone,
          email_nota_fiscal: f.email_nota_fiscal,
        });
      }
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      const payload = {
        razao_social: values.razao_social,
        documento: values.documento,
        ie: values.ie,
        endereco: {
          logradouro: values.logradouro,
          numero: values.numero,
          complemento: values.complemento,
          bairro: values.bairro,
          cidade: values.cidade,
          uf: values.uf,
          cep: values.cep,
        },
        contato_financeiro_nome: values.contato_financeiro_nome,
        contato_financeiro_email: values.contato_financeiro_email,
        contato_financeiro_telefone: values.contato_financeiro_telefone,
        email_nota_fiscal: values.email_nota_fiscal,
      };
      await api.put('/portal/faturamento', payload);
      message.success('Cadastro fiscal salvo');
    } catch (e) {
      if (e.message) message.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Title level={4} style={{ marginTop: 0 }}>Cadastro Fiscal</Title>
      <Text type="secondary">Dados usados na emissão de notas fiscais e no contato financeiro.</Text>

      <Card style={{ marginTop: 16 }} loading={loading}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={16}>
              <Form.Item name="razao_social" label="Razão social" rules={[{ required: true, message: 'Informe a razão social' }]}>
                <Input placeholder="Razão social" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="documento" label="CNPJ/CPF" rules={[{ required: true, message: 'Informe o documento' }]}>
                <Input placeholder="00.000.000/0000-00" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="ie" label="Inscrição estadual">
                <Input placeholder="Opcional" />
              </Form.Item>
            </Col>
            <Col xs={24} md={16}>
              <Form.Item name="email_nota_fiscal" label="Email para nota fiscal" rules={[{ type: 'email', message: 'Email inválido' }]}>
                <Input placeholder="financeiro@empresa.com" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5}>Endereço</Title>
          <Row gutter={16}>
            <Col xs={24} md={16}>
              <Form.Item name="logradouro" label="Logradouro">
                <Input placeholder="Rua/Avenida" />
              </Form.Item>
            </Col>
            <Col xs={12} md={4}>
              <Form.Item name="numero" label="Número">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={12} md={4}>
              <Form.Item name="cep" label="CEP">
                <Input placeholder="00000-000" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="complemento" label="Complemento">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="bairro" label="Bairro">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={16} md={6}>
              <Form.Item name="cidade" label="Cidade">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={8} md={2}>
              <Form.Item name="uf" label="UF">
                <Input maxLength={2} style={{ textTransform: 'uppercase' }} />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5}>Contato financeiro</Title>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="contato_financeiro_nome" label="Nome">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="contato_financeiro_email" label="Email" rules={[{ type: 'email', message: 'Email inválido' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="contato_financeiro_telefone" label="Telefone">
                <Input placeholder="(00) 00000-0000" />
              </Form.Item>
            </Col>
          </Row>

          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
            Salvar
          </Button>
        </Form>
      </Card>
    </div>
  );
}
