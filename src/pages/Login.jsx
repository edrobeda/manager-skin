import { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const getSlugFromHost = () => {
  const parts = window.location.hostname.split('.');
  // *.eventifylab.com → slug é o primeiro segmento
  // manager.eventifylab.com e localhost → sem slug (superadmin)
  if (parts.length >= 3 && parts[0] !== 'manager') return parts[0];
  return null;
};

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const slug = getSlugFromHost();

  const onFinish = async ({ email, password }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Credenciais inválidas');

      localStorage.setItem('session', JSON.stringify({
        token: data.token,
        user: data.user,
        tenant: data.tenant,
      }));
      message.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', borderRadius: 12 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
            Eventify<span style={{ color: '#10b981' }}>Lab</span>
          </h1>
          <p style={{ color: '#666', marginTop: 8 }}>
            {slug ? `Portal — ${slug}` : 'Painel administrativo'}
          </p>
        </div>

        <Form name="login" onFinish={onFinish} layout="vertical" size="large">
          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Informe seu email' }, { type: 'email', message: 'Email inválido' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: 'Informe sua senha' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Senha" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block
              style={{ height: 45, borderRadius: 8 }}>
              Entrar
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <a href="https://eventifylab.com" style={{ color: '#666' }}>← Voltar para o site</a>
        </div>
      </Card>
    </div>
  );
};

export default Login;
