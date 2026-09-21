import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Switch, Popconfirm, Typography, Space, message, Empty, Card, Statistic, Row, Col, Image } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, LinkOutlined, HolderOutlined, CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { linkService } from '../../services/linkService';

const { Text, Link: TextLink } = Typography;

// padrao oficial AntD pra Table com drag-and-drop via @dnd-kit: a LINHA
// inteira vira o item sortable (useSortable), mas o "pegar" pro arraste so
// deve responder na alcinha (HolderOutlined) — nao na linha toda, senao um
// clique comum em "Editar"/switch tambem tentaria iniciar um arraste. O
// Context passa os listeners do dnd-kit da linha pra dentro da celula da
// alcinha, sem precisar prop-drilling manual em cada coluna.
const RowContext = createContext({});

function DragHandle() {
  const { setActivatorNodeRef, listeners } = useContext(RowContext);
  return (
    <HolderOutlined
      ref={setActivatorNodeRef}
      style={{ touchAction: 'none', cursor: 'grab', color: '#999' }}
      {...listeners}
    />
  );
}

function DraggableRow(props) {
  const {
    attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging,
  } = useSortable({ id: props['data-row-key'] });

  const style = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    ...(isDragging ? { position: 'relative', zIndex: 10, background: '#fafafa' } : {}),
  };

  const contextValue = useMemo(() => ({ setActivatorNodeRef, listeners }), [setActivatorNodeRef, listeners]);

  return (
    <RowContext.Provider value={contextValue}>
      <tr {...props} ref={setNodeRef} style={style} {...attributes} />
    </RowContext.Provider>
  );
}

export default function Links() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrInfo, setQrInfo] = useState(null);
  const [qrLoading, setQrLoading] = useState(true);
  const navigate = useNavigate();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = async () => {
    try {
      setLoading(true);
      const data = await linkService.getAll();
      setLinks(data);
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadQrInfo = async () => {
    try {
      setQrLoading(true);
      const data = await linkService.getQrInfo();
      setQrInfo(data);
    } catch (e) {
      message.error(e.message);
    } finally {
      setQrLoading(false);
    }
  };

  useEffect(() => { load(); loadQrInfo(); }, []);

  const handleDelete = async (id) => {
    try {
      await linkService.delete(id);
      setLinks(prev => prev.filter(l => l.id !== id));
      message.success('Link removido');
    } catch (e) {
      message.error(e.message);
    }
  };

  const handleToggleActive = async (record) => {
    try {
      const updated = await linkService.toggleActive(record.id);
      setLinks(prev => prev.map(l => (l.id === updated.id ? updated : l)));
    } catch (e) {
      message.error(e.message);
    }
  };

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = links.findIndex((l) => l.id === active.id);
    const newIndex = links.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(links, oldIndex, newIndex);
    setLinks(reordered); // otimista — ja mostra a nova ordem na hora
    try {
      const saved = await linkService.reorder(reordered.map((l) => l.id));
      setLinks(saved);
    } catch (e) {
      message.error(e.message);
      load(); // desfaz o otimismo se o servidor recusar
    }
  };

  const columns = [
    { key: 'sort', title: '', width: 40, render: () => <DragHandle /> },
    {
      title: 'Label', dataIndex: 'label', key: 'label',
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: 'URL', dataIndex: 'url', key: 'url',
      render: (url) => (
        <TextLink href={url} target="_blank" rel="noopener">
          {url.length > 50 ? `${url.slice(0, 50)}…` : url}
        </TextLink>
      ),
    },
    {
      title: 'Ativo', dataIndex: 'active', key: 'active', width: 100,
      render: (active, record) => (
        <Switch
          checked={active}
          checkedChildren="Sim"
          unCheckedChildren="Não"
          onChange={() => handleToggleActive(record)}
        />
      ),
    },
    {
      title: 'Ações', key: 'acoes', width: 100,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/dashboard/links/${record.id}/editar`)} />
          <Popconfirm
            title="Remover este link?"
            description="Ele some da página eventifylab.com/links imediatamente."
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
      <Card style={{ marginBottom: 24 }} loading={qrLoading}>
        <h2 style={{ marginTop: 0 }}>Link e QR code da página</h2>
        {qrInfo && (
          <Row gutter={24} align="middle">
            <Col flex="none">
              <Image src={qrInfo.qrPngUrl} width={140} style={{ border: '1px solid #eee', borderRadius: 8 }} />
            </Col>
            <Col flex="auto">
              <Space direction="vertical" size={4} style={{ marginBottom: 12 }}>
                <Text>Link curto (rastreável, fixo — nunca muda):</Text>
                <Text code copyable={{ text: qrInfo.url, icon: <CopyOutlined /> }}>{qrInfo.url}</Text>
              </Space>
              <Space wrap>
                <Button icon={<DownloadOutlined />} href={qrInfo.qrPngUrl} download>Baixar PNG</Button>
                <Button icon={<DownloadOutlined />} href={qrInfo.qrSvgUrl} download>Baixar SVG</Button>
              </Space>
              <Row gutter={32} style={{ marginTop: 20 }}>
                <Col>
                  <Statistic title="Escaneamentos" value={qrInfo.totalEscaneamentos} />
                </Col>
                <Col>
                  <Statistic
                    title="Último escaneamento"
                    value={qrInfo.ultimoEscaneamentoEm
                      ? new Date(qrInfo.ultimoEscaneamentoEm).toLocaleString('pt-BR')
                      : '—'}
                  />
                </Col>
              </Row>
            </Col>
          </Row>
        )}
      </Card>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 16, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>Links (eventifylab.com/links)</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/dashboard/links/novo')}>
          Novo link
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          <Table
            rowKey="id"
            dataSource={links}
            columns={columns}
            loading={loading}
            pagination={false}
            components={{ body: { row: DraggableRow } }}
            locale={{
              emptyText: (
                <Empty
                  image={<LinkOutlined style={{ fontSize: 32 }} />}
                  description="Nenhum link cadastrado ainda"
                >
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/dashboard/links/novo')}>
                    Criar o primeiro link
                  </Button>
                </Empty>
              ),
            }}
          />
        </SortableContext>
      </DndContext>
    </>
  );
}
