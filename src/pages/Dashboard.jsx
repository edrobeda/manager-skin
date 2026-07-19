import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Alert, Space } from 'antd';
import { UserOutlined, TrophyOutlined, RiseOutlined, QuestionCircleOutlined, CalendarOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../services/api';
import { useTenant } from '../contexts/TenantContext';

const Dashboard = () => {
  const { tenant } = useTenant();
  const [stats, setStats] = useState({ clientes: 0, partidas: 0, premios: 0, quiz: 0 });
  const [recentes, setRecentes] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [c, p, pr, q, ev] = await Promise.all([
          api.get('/clientes'),
          api.get('/partidas'),
          api.get('/premios'),
          api.get('/quiz'),
          api.get('/eventos/alertas').catch(() => ({ alertas: [] })),
        ]);
        setStats({
          clientes: c.clientes?.length ?? 0,
          partidas: p.partidas?.length ?? 0,
          premios: pr.premios?.length ?? 0,
          quiz: q.quiz?.length ?? 0,
        });
        setRecentes((p.partidas ?? []).slice(0, 5));
        setAlertas(ev.alertas ?? []);
      } catch {
        // silencioso
      }
      setLoading(false);
    };
    load();
  }, []);

  const columns = [
    { title: 'Jogador', dataIndex: 'cliente_nome', key: 'cliente_nome' },
    { title: 'Prêmio', dataIndex: 'premio_nome', key: 'premio_nome', render: v => v ? <Tag color="green">{v}</Tag> : <Tag>Sem prêmio</Tag> },
    { title: 'Acertos', dataIndex: 'quiz_acertos', key: 'quiz_acertos', width: 90, align: 'center' },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 110, render: v => <Tag color={v === 'entregue' ? 'success' : 'processing'}>{v}</Tag> },
    { title: 'Data', dataIndex: 'jogado_em', key: 'jogado_em', width: 140, render: v => new Date(v).toLocaleString('pt-BR') },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>{tenant ? `Dashboard — ${tenant.nome}` : 'Dashboard'}</h2>

      {/* Alertas de eventos */}
      {alertas.length > 0 && (
        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
          {alertas.map((ev) => (
            <Alert
              key={ev.id}
              type={ev.status === 'encerrado' ? 'warning' : 'info'}
              icon={ev.status === 'encerrado' ? <WarningOutlined /> : <CalendarOutlined />}
              showIcon
              message={
                ev.status === 'encerrado'
                  ? `Evento encerrado: ${ev.nome}`
                  : `Evento encerrando hoje: ${ev.nome}`
              }
              description={
                ev.status === 'encerrado'
                  ? `Encerrou em ${dayjs(ev.data_fim).format('DD/MM/YYYY HH:mm')}`
                  : `Encerra às ${dayjs(ev.data_fim).format('HH:mm')} de hoje`
              }
            />
          ))}
        </Space>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <Statistic title="Jogadores" value={stats.clientes} prefix={<UserOutlined style={{ color: '#10b981' }} />} valueStyle={{ color: '#10b981' }} loading={loading} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <Statistic title="Partidas" value={stats.partidas} prefix={<RiseOutlined style={{ color: '#1890ff' }} />} valueStyle={{ color: '#1890ff' }} loading={loading} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <Statistic title="Prêmios" value={stats.premios} prefix={<TrophyOutlined style={{ color: '#faad14' }} />} valueStyle={{ color: '#faad14' }} loading={loading} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <Statistic title="Perguntas Quiz" value={stats.quiz} prefix={<QuestionCircleOutlined style={{ color: '#722ed1' }} />} valueStyle={{ color: '#722ed1' }} loading={loading} />
          </Card>
        </Col>
      </Row>

      <Card title="Partidas Recentes" style={{ marginTop: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }} bordered={false}>
        <Table columns={columns} dataSource={recentes} rowKey="id" pagination={false} size="middle" loading={loading}
          locale={{ emptyText: 'Nenhuma partida registrada ainda.' }} scroll={{ x: 'max-content' }} />
      </Card>
    </div>
  );
};

export default Dashboard;
