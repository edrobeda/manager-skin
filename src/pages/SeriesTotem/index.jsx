import { useEffect, useState } from 'react';
import {
  Table, Button, Switch, Popconfirm, Typography, Space, message, Input, Modal, Form, Alert,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, ArrowUpOutlined, ArrowDownOutlined, SaveOutlined,
} from '@ant-design/icons';
import { seriesTotemService } from '../../services/seriesTotemService';

const { Text } = Typography;

// Troca dois itens de lugar sem mutar o array original
const mover = (lista, de, para) => {
  const nova = [...lista];
  [nova[de], nova[para]] = [nova[para], nova[de]];
  return nova;
};

export default function SeriesTotem() {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvandoOrdem, setSalvandoOrdem] = useState(false);
  const [ordemSuja, setOrdemSuja] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form] = Form.useForm();

  const load = async () => {
    try {
      setLoading(true);
      setSeries(await seriesTotemService.getAll());
      setOrdemSuja(false);
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleMover = (index, direcao) => {
    const destino = index + direcao;
    if (destino < 0 || destino >= series.length) return;
    setSeries(mover(series, index, destino));
    setOrdemSuja(true);
  };

  const handleSalvarOrdem = async () => {
    setSalvandoOrdem(true);
    try {
      await seriesTotemService.salvarOrdem(series.map(s => s.id));
      message.success('Ordem das séries salva');
      setOrdemSuja(false);
    } catch (e) {
      message.error(e.message);
    } finally {
      setSalvandoOrdem(false);
    }
  };

  const handleSalvarSerie = async () => {
    const { nome } = await form.validateFields();
    try {
      if (editando.id) {
        await seriesTotemService.update(editando.id, { nome });
        message.success('Série renomeada');
      } else {
        await seriesTotemService.create({ nome });
        message.success('Série criada');
      }
      setEditando(null);
      load();
    } catch (e) {
      message.error(e.message);
    }
  };

  const handleToggleAtivo = async (record, ativo) => {
    try {
      const serie = await seriesTotemService.update(record.id, { ativo });
      setSeries(prev => prev.map(s => s.id === serie.id ? serie : s));
    } catch (e) {
      message.error(e.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await seriesTotemService.delete(id);
      message.success('Série removida — os produtos dela ficaram sem série');
      load();
    } catch (e) {
      message.error(e.message);
    }
  };

  const columns = [
    {
      title: 'Ordem', key: 'ordem', width: 120,
      render: (_, __, index) => (
        <Space size={4}>
          <Button size="small" icon={<ArrowUpOutlined />} disabled={index === 0}
            onClick={() => handleMover(index, -1)} />
          <Button size="small" icon={<ArrowDownOutlined />} disabled={index === series.length - 1}
            onClick={() => handleMover(index, 1)} />
          <Text type="secondary">{index + 1}º</Text>
        </Space>
      ),
    },
    {
      title: 'Nome da seção no totem', dataIndex: 'nome', key: 'nome',
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: 'Status', dataIndex: 'ativo', key: 'ativo', width: 110,
      render: (ativo, record) => (
        <Switch
          checked={ativo}
          checkedChildren="Ativa"
          unCheckedChildren="Inativa"
          onChange={(val) => handleToggleAtivo(record, val)}
        />
      ),
    },
    {
      title: 'Ações', key: 'acoes', width: 100,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />}
            onClick={() => { setEditando(record); form.setFieldsValue({ nome: record.nome }); }} />
          <Popconfirm
            title="Remover esta série?"
            description="Os produtos dela ficam sem série e caem no fim do totem."
            onConfirm={() => handleDelete(record.id)}
            okText="Remover"
            okButtonProps={{ danger: true }}
            cancelText="Cancelar"
          >
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 16 }}>
        <h2 style={{ margin: 0 }}>Séries do Totem</h2>
        <Space>
          {ordemSuja && (
            <Button type="primary" icon={<SaveOutlined />} loading={salvandoOrdem} onClick={handleSalvarOrdem}>
              Salvar ordem
            </Button>
          )}
          <Button icon={<PlusOutlined />}
            onClick={() => { setEditando({}); form.setFieldsValue({ nome: '' }); }}>
            Nova série
          </Button>
        </Space>
      </div>

      <Alert
        type="info" showIcon style={{ marginBottom: 16 }}
        message="A ordem daqui é a ordem das seções na tela inicial do totem."
        description="Use as setas para reordenar e clique em Salvar ordem. Produtos sem série aparecem por último."
      />

      <Table
        rowKey="id"
        dataSource={series}
        columns={columns}
        loading={loading}
        pagination={false}
        locale={{ emptyText: 'Nenhuma série cadastrada' }}
      />

      <Modal
        open={!!editando}
        title={editando?.id ? 'Renomear série' : 'Nova série'}
        onCancel={() => setEditando(null)}
        onOk={handleSalvarSerie}
        okText="Salvar"
        cancelText="Cancelar"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="nome" label="Nome da seção"
            rules={[{ required: true, message: 'Informe o nome da série' }]}
          >
            <Input placeholder="Ex: Últimos Lançamentos" maxLength={255} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
