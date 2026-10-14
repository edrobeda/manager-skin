import { useEffect, useState } from 'react';
import { Table, Tag, Typography, Select, Space, message } from 'antd';
import { api } from '../../services/api';

const { Title } = Typography;

// Mesma tela que Portal/Faturas, só que pro STAFF ver faturas de TODOS os
// tenants (GET /api/core/faturas, superadmin) em vez de só a do próprio
// tenant logado (GET /api/portal/faturas) — por isso tem coluna de Cliente,
// que a versão do portal não precisa.
const STATUS_COLOR = {
  aberta: 'blue',
  paga: 'green',
  vencida: 'red',
  cancelada: 'default',
};

const centavosParaReal = (centavos) =>
  ((centavos || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Cobranca() {
  const [faturas, setFaturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(undefined);

  const load = async (statusFiltro) => {
    setLoading(true);
    try {
      const query = statusFiltro ? `?status=${encodeURIComponent(statusFiltro)}` : '';
      const data = await api.get(`/core/faturas${query}`);
      setFaturas(data.faturas);
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(status); }, [status]);

  const columns = [
    { title: 'Cliente', dataIndex: 'tenant_nome', key: 'tenant_nome', render: (v, row) => v || row.tenant_slug },
    { title: 'Produto', dataIndex: 'produto_nome', key: 'produto_nome', render: (v) => v || '—' },
    { title: 'Competência', dataIndex: 'competencia', key: 'competencia', render: (v) => v || '—' },
    { title: 'Valor', dataIndex: 'valor_centavos', key: 'valor_centavos', render: centavosParaReal },
    { title: 'Vencimento', dataIndex: 'vencimento', key: 'vencimento', render: (v) => v ? new Date(v).toLocaleDateString('pt-BR') : '—' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag color={STATUS_COLOR[s] || 'default'}>{(s || '').toUpperCase()}</Tag>,
    },
    {
      title: 'Pagamento',
      key: 'pagamento',
      render: (_, row) => row.link_pagamento
        ? <a href={row.link_pagamento} target="_blank" rel="noopener noreferrer">Ver no Asaas</a>
        : '—',
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <Title level={4} style={{ margin: 0 }}>Cobrança</Title>
        <Space>
          <Select
            allowClear
            placeholder="Filtrar por status"
            style={{ width: 180 }}
            value={status}
            onChange={setStatus}
            options={[
              { value: 'aberta', label: 'Aberta' },
              { value: 'paga', label: 'Paga' },
              { value: 'vencida', label: 'Vencida' },
              { value: 'cancelada', label: 'Cancelada' },
            ]}
          />
        </Space>
      </div>

      <Table
        rowKey="id"
        dataSource={faturas}
        columns={columns}
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
}
