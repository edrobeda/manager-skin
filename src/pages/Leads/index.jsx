import { useState, useEffect, useMemo } from 'react';
import { Card, Table, Button, Input, Select, Space, Tag, Badge, Tooltip, Statistic, Row, Col, message } from 'antd';
import { SearchOutlined, DownloadOutlined, ReloadOutlined, TeamOutlined } from '@ant-design/icons';
import { api } from '../../services/api';
import { useTenant } from '../../contexts/TenantContext';

const { Option } = Select;

const fmtDate = (v) => v ? new Date(v).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
const fmtCpf  = (v) => v ? v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '—';

const Leads = () => {
  const { isSuper } = useTenant();
  const [grupos, setGrupos] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState('todos');
  const [search, setSearch] = useState('');

  const loadGrupos = async () => {
    try {
      const data = await api.get('/clientes/grupos');
      setGrupos(data.grupos || []);
      if (!isSuper && data.grupos?.length === 1) {
        setSelectedTenant(String(data.grupos[0].id));
      }
    } catch (err) {
      message.error(err.message);
    }
  };

  const loadLeads = async () => {
    setLoading(true);
    try {
      const qs = selectedTenant !== 'todos' ? `?tenant_id=${selectedTenant}` : '';
      const data = await api.get(`/clientes${qs}`);
      setLeads(data.clientes || []);
    } catch (err) {
      message.error(err.message);
    }
    setLoading(false);
  };

  useEffect(() => { loadGrupos(); }, []);
  useEffect(() => { loadLeads(); }, [selectedTenant]);

  const filtered = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(l =>
      l.nome?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.cpf?.includes(q) ||
      l.telefone?.includes(q) ||
      l.perfil?.toLowerCase().includes(q)
    );
  }, [leads, search]);

  const exportCSV = () => {
    if (!filtered.length) return message.warning('Nenhum dado para exportar');

    const tenantLabel = selectedTenant === 'todos'
      ? 'todos'
      : grupos.find(g => String(g.id) === selectedTenant)?.slug || selectedTenant;

    const headers = ['Nome', 'CPF', 'Email', 'Telefone', 'Perfil', 'Tenant', 'Cadastrado em'];
    const rows = filtered.map(l => [
      l.nome,
      fmtCpf(l.cpf),
      l.email,
      l.telefone || '',
      l.perfil,
      l.tenant_nome || l.tenant_slug || '',
      fmtDate(l.criado_em),
    ]);

    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `leads-${tenantLabel}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalGeral = grupos.reduce((s, g) => s + (g.total_leads || 0), 0);

  const columns = [
    { title: 'Nome',     dataIndex: 'nome',     key: 'nome',     ellipsis: true },
    { title: 'Email',    dataIndex: 'email',    key: 'email',    ellipsis: true },
    { title: 'CPF',      dataIndex: 'cpf',      key: 'cpf',      render: fmtCpf, width: 140 },
    { title: 'Telefone', dataIndex: 'telefone', key: 'telefone', width: 130, render: v => v || '—' },
    { title: 'Perfil',   dataIndex: 'perfil',   key: 'perfil',   width: 100, render: v => v ? <Tag>{v}</Tag> : '—' },
    ...(isSuper ? [{
      title: 'Tenant', key: 'tenant', width: 110,
      render: (_, r) => <Tag color="blue">{r.tenant_slug || r.tenant_nome || '—'}</Tag>,
    }] : []),
    {
      title: 'Cadastro', dataIndex: 'criado_em', key: 'criado_em', width: 140,
      render: fmtDate, sorter: (a, b) => new Date(a.criado_em) - new Date(b.criado_em),
    },
  ];

  const selectedGrupo = grupos.find(g => String(g.id) === selectedTenant);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Leads</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadLeads} loading={loading}>Atualizar</Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={exportCSV}>Exportar CSV</Button>
        </Space>
      </div>

      {/* Cards de resumo por tenant */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col>
          <Card
            size="small"
            hoverable
            onClick={() => setSelectedTenant('todos')}
            style={{
              cursor: 'pointer', minWidth: 130,
              borderColor: selectedTenant === 'todos' ? '#10b981' : undefined,
              background: selectedTenant === 'todos' ? '#f0fdf4' : undefined,
            }}
          >
            <Statistic title="Todos" value={totalGeral} prefix={<TeamOutlined />} valueStyle={{ fontSize: 22 }} />
          </Card>
        </Col>
        {grupos.map(g => (
          <Col key={g.id}>
            <Card
              size="small"
              hoverable
              onClick={() => setSelectedTenant(String(g.id))}
              style={{
                cursor: 'pointer', minWidth: 130,
                borderColor: String(g.id) === selectedTenant ? (g.cor_primaria || '#1677ff') : undefined,
                background: String(g.id) === selectedTenant ? '#f0f9ff' : undefined,
              }}
            >
              <Statistic
                title={<Space size={4}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: g.cor_primaria || '#1677ff', display: 'inline-block' }} />
                  {g.nome}
                </Space>}
                value={g.total_leads}
                valueStyle={{ fontSize: 22 }}
              />
              {g.eventos?.length > 0 && (
                <div style={{ marginTop: 4, fontSize: 11, color: '#888' }}>
                  {g.eventos.map(e => (
                    <div key={e.id}>
                      <Badge
                        status={e.status === 'ativo' ? 'success' : e.status === 'agendado' ? 'processing' : 'default'}
                        text={<span style={{ fontSize: 11 }}>{e.nome}</span>}
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Buscar por nome, email, CPF, telefone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            allowClear
            style={{ maxWidth: 340 }}
          />
          {isSuper && (
            <Select
              value={selectedTenant}
              onChange={setSelectedTenant}
              style={{ minWidth: 180 }}
            >
              <Option value="todos">Todos os tenants</Option>
              {grupos.map(g => (
                <Option key={g.id} value={String(g.id)}>{g.nome} ({g.total_leads})</Option>
              ))}
            </Select>
          )}
          <span style={{ color: '#888', fontSize: 13, marginLeft: 'auto' }}>
            {filtered.length} lead{filtered.length !== 1 ? 's' : ''}
            {search ? ` (filtrado${filtered.length !== 1 ? 's' : ''})` : ''}
          </span>
        </div>

        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'] }}
          size="small"
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
};

export default Leads;
