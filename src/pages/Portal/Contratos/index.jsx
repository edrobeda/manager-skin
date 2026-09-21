import { useEffect, useState } from 'react';
import { Table, Tag, Typography, message } from 'antd';
import { api } from '../../../services/api';

const { Title } = Typography;

const STATUS_COLOR = {
  ativo: 'green',
  suspenso: 'orange',
  cancelado: 'red',
};

const centavosParaReal = (centavos) =>
  ((centavos || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Contratos() {
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api.get('/portal/contratos');
        setContratos(data.contratos);
      } catch (e) {
        message.error(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const columns = [
    { title: 'Produto', dataIndex: 'produto_nome', key: 'produto_nome' },
    { title: 'Plano', dataIndex: 'plano', key: 'plano' },
    { title: 'Ciclo', dataIndex: 'ciclo', key: 'ciclo', render: (v) => v?.charAt(0).toUpperCase() + v?.slice(1) },
    { title: 'Valor', dataIndex: 'valor_centavos', key: 'valor_centavos', render: centavosParaReal },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag color={STATUS_COLOR[s] || 'default'}>{(s || '').toUpperCase()}</Tag>,
    },
    { title: 'Início', dataIndex: 'data_inicio', key: 'data_inicio', render: (v) => v ? new Date(v).toLocaleDateString('pt-BR') : '—' },
    { title: 'Fim', dataIndex: 'data_fim', key: 'data_fim', render: (v) => v ? new Date(v).toLocaleDateString('pt-BR') : '—' },
  ];

  return (
    <div>
      <Title level={4} style={{ marginTop: 0 }}>Contratos</Title>
      <Table
        rowKey="id"
        dataSource={contratos}
        columns={columns}
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
}
