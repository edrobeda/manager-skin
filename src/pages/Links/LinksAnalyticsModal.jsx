import { useEffect, useState } from 'react';
import { Modal, Table, Button, Tag, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { linkService } from '../../services/linkService';

// mesmo espirito do export de Leads do totem vetnil (ver
// pages/Leads/ExportModal.jsx) — busca o registro cru da API e monta o
// arquivo no navegador (xlsx.js), sem passar por um endpoint de export
// dedicado no backend.
const TIPO_LABELS = {
  pagina_links: { label: 'Página vista', color: 'blue' },
  clique_links: { label: 'Clique em botão', color: 'green' },
  link_externo: { label: 'Escaneou o QR', color: 'purple' },
};

export default function LinksAnalyticsModal({ open, onClose }) {
  const [acessos, setAcessos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    linkService.getAnalytics()
      .then(setAcessos)
      .catch((e) => message.error(e.message))
      .finally(() => setLoading(false));
  }, [open]);

  const handleExport = () => {
    if (!acessos.length) return message.warning('Nenhum dado para exportar');
    const rows = acessos.map((a) => ({
      'Data/Hora': new Date(a.criado_em).toLocaleString('pt-BR'),
      'Evento': TIPO_LABELS[a.tipo]?.label || a.tipo,
      'Referência': a.referencia_label || '',
      'Sessão (visita)': a.sessao_id || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Navegação');
    XLSX.writeFile(wb, `links-navegacao-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const columns = [
    {
      title: 'Data/hora', dataIndex: 'criado_em', key: 'criado_em',
      render: (v) => new Date(v).toLocaleString('pt-BR'),
      sorter: (a, b) => new Date(a.criado_em) - new Date(b.criado_em),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Evento', dataIndex: 'tipo', key: 'tipo',
      render: (v) => {
        const t = TIPO_LABELS[v] || { label: v, color: 'default' };
        return <Tag color={t.color}>{t.label}</Tag>;
      },
      filters: Object.entries(TIPO_LABELS).map(([value, t]) => ({ text: t.label, value })),
      onFilter: (value, record) => record.tipo === value,
    },
    { title: 'Referência', dataIndex: 'referencia_label', key: 'referencia_label' },
    {
      title: 'Sessão (visita)', dataIndex: 'sessao_id', key: 'sessao_id',
      render: (v) => v ? <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v.slice(0, 8)}</span> : '—',
    },
  ];

  return (
    <Modal
      title="Relatório de navegação — eventifylab.com/links"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="export" icon={<DownloadOutlined />} onClick={handleExport}>Exportar XLSX</Button>,
        <Button key="close" type="primary" onClick={onClose}>Fechar</Button>,
      ]}
      width={820}
      destroyOnHidden
    >
      <Table
        rowKey="id"
        dataSource={acessos}
        columns={columns}
        loading={loading}
        size="small"
        pagination={{ pageSize: 10 }}
      />
    </Modal>
  );
}
