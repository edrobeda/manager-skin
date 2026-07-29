import { useState } from 'react';
import { Modal, Checkbox, Radio, Space, Divider, message } from 'antd';
import * as XLSX from 'xlsx';
import { api } from '../../services/api';

const fmtDate = (v) => v ? new Date(v).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '';
const fmtCpf  = (v) => v ? v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '';
const fmtBool = (v) => v ? 'Sim' : 'Não';

const FIELD_GROUPS = [
  {
    key: 'lead',
    label: 'Lead',
    fields: [
      { key: 'nome', label: 'Nome' },
      { key: 'cpf', label: 'CPF', format: fmtCpf },
      { key: 'email', label: 'Email' },
      { key: 'telefone', label: 'Telefone' },
      { key: 'perfil', label: 'Perfil' },
      { key: 'aceita_marketing', label: 'Aceita marketing', format: fmtBool },
      { key: 'tenant_nome', label: 'Tenant' },
      { key: 'criado_em', label: 'Cadastrado em', format: fmtDate },
    ],
  },
  {
    key: 'partida',
    label: 'Partida',
    fields: [
      { key: 'codigo', label: 'Código' },
      { key: 'status', label: 'Status' },
      { key: 'quiz_acertos', label: 'Acertos no quiz' },
      { key: 'jogado_em', label: 'Jogado em', format: fmtDate },
      { key: 'operador', label: 'Operador' },
      { key: 'entregue_em', label: 'Entregue em', format: fmtDate },
      { key: 'email_enviado', label: 'Email enviado', format: fmtBool },
    ],
  },
  {
    key: 'premio',
    label: 'Prêmio',
    fields: [
      { key: 'premio_nome', label: 'Prêmio' },
      { key: 'premio_subnome', label: 'Subnome do prêmio' },
      { key: 'premio_tier', label: 'Tier' },
    ],
  },
];

const ALL_FIELDS = FIELD_GROUPS.flatMap(g => g.fields.map(f => ({ ...f, group: g.key })));
const FIELD_MAP = Object.fromEntries(ALL_FIELDS.map(f => [f.key, f]));
const DETALHE_GROUPS = new Set(['partida', 'premio']);
const DEFAULT_KEYS = ['nome', 'cpf', 'email', 'telefone', 'perfil', 'tenant_nome', 'criado_em'];
const STORAGE_KEY = 'leadsExport:campos';

const loadSavedKeys = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) && saved.length ? saved.filter(k => FIELD_MAP[k]) : DEFAULT_KEYS;
  } catch {
    return DEFAULT_KEYS;
  }
};

const pickRow = (source, keys) => {
  const row = {};
  for (const key of keys) {
    const field = FIELD_MAP[key];
    const raw = source[key];
    row[field.label] = field.format ? field.format(raw) : (raw ?? '');
  }
  return row;
};

const buildRows = (clientes, selectedKeys, ultimaSomente) => {
  const leadKeys = selectedKeys.filter(k => FIELD_MAP[k].group === 'lead');
  const detalheKeys = selectedKeys.filter(k => DETALHE_GROUPS.has(FIELD_MAP[k].group));

  if (!detalheKeys.length) {
    return clientes.map(c => pickRow(c, leadKeys));
  }

  return clientes.flatMap(c => {
    const todas = c.partidas?.length ? c.partidas : [{}];
    const partidas = ultimaSomente ? [todas[0]] : todas;
    return partidas.map(p => ({ ...pickRow(c, leadKeys), ...pickRow(p, detalheKeys) }));
  });
};

const ExportModal = ({ open, onClose, tenantId, search, filenamePrefix }) => {
  const [selected, setSelected] = useState(loadSavedKeys);
  const [formato, setFormato] = useState('xlsx');
  const [ultimaSomente, setUltimaSomente] = useState(true);
  const [loading, setLoading] = useState(false);

  const temDetalhe = selected.some(k => DETALHE_GROUPS.has(FIELD_MAP[k]?.group));

  const toggleField = (key) => {
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const toggleGroup = (groupKey, checked) => {
    const groupKeys = FIELD_GROUPS.find(g => g.key === groupKey).fields.map(f => f.key);
    setSelected(prev => checked
      ? [...new Set([...prev, ...groupKeys])]
      : prev.filter(k => !groupKeys.includes(k)));
  };

  const handleExport = async () => {
    if (!selected.length) return message.warning('Selecione pelo menos um campo');
    setLoading(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));

      const qs = tenantId ? `?tenant_id=${tenantId}` : '';
      const data = await api.get(`/clientes/export${qs}`);
      const q = search?.trim().toLowerCase();
      const clientes = q
        ? (data.clientes || []).filter(c =>
            c.nome?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q) ||
            c.cpf?.includes(q) ||
            c.telefone?.includes(q) ||
            c.perfil?.toLowerCase().includes(q))
        : (data.clientes || []);

      if (!clientes.length) return message.warning('Nenhum dado para exportar');

      const rows = buildRows(clientes, selected, ultimaSomente);
      const ws = XLSX.utils.json_to_sheet(rows);
      const filename = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}`;

      if (formato === 'xlsx') {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Leads');
        XLSX.writeFile(wb, `${filename}.xlsx`);
      } else {
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      message.success(`${rows.length} linha${rows.length !== 1 ? 's' : ''} exportada${rows.length !== 1 ? 's' : ''}`);
      onClose();
    } catch (err) {
      message.error(err.message);
    }
    setLoading(false);
  };

  return (
    <Modal
      title="Exportar leads"
      open={open}
      onCancel={onClose}
      onOk={handleExport}
      okText="Exportar"
      confirmLoading={loading}
      width={560}
      destroyOnHidden
    >
      {FIELD_GROUPS.map(group => {
        const groupKeys = group.fields.map(f => f.key);
        const allChecked = groupKeys.every(k => selected.includes(k));
        const someChecked = groupKeys.some(k => selected.includes(k));
        return (
          <div key={group.key} style={{ marginBottom: 16 }}>
            <Checkbox
              checked={allChecked}
              indeterminate={someChecked && !allChecked}
              onChange={e => toggleGroup(group.key, e.target.checked)}
            >
              <strong>{group.label}</strong>
            </Checkbox>
            <div style={{ marginLeft: 24, marginTop: 8 }}>
              <Space wrap>
                {group.fields.map(f => (
                  <Checkbox key={f.key} checked={selected.includes(f.key)} onChange={() => toggleField(f.key)}>
                    {f.label}
                  </Checkbox>
                ))}
              </Space>
            </div>
          </div>
        );
      })}

      <Divider style={{ margin: '12px 0' }} />

      <Space size={24} wrap align="start">
        <div>
          <div style={{ marginBottom: 4, color: '#888', fontSize: 12 }}>Formato</div>
          <Radio.Group value={formato} onChange={e => setFormato(e.target.value)}>
            <Radio.Button value="xlsx">XLSX</Radio.Button>
            <Radio.Button value="csv">CSV</Radio.Button>
          </Radio.Group>
        </div>

        {temDetalhe && (
          <div>
            <div style={{ marginBottom: 4, color: '#888', fontSize: 12 }}>Partidas por lead</div>
            <Radio.Group value={ultimaSomente} onChange={e => setUltimaSomente(e.target.value)}>
              <Radio.Button value={true}>Somente a última</Radio.Button>
              <Radio.Button value={false}>Todas (uma linha por partida)</Radio.Button>
            </Radio.Group>
          </div>
        )}
      </Space>
    </Modal>
  );
};

export default ExportModal;
