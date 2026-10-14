import { Layout } from 'antd';

const { Footer } = Layout;

// Versão/data do build atual — injetadas em tempo de build (ver vite.config.js
// + docker-base/deploy-manager-skin.sh), não em runtime. Serve pra conferir
// na própria tela qual deploy está no ar, sem precisar entrar no servidor
// (pergunta que já veio no chat: "já está no ar o manager novo?"). Em
// `npm run dev` local essas vars não existem — cai no fallback "dev".
const versao = import.meta.env.VITE_APP_VERSION || 'dev';
const dataBuild = import.meta.env.VITE_BUILD_DATE || null;

export default function VersionFooter() {
  return (
    <Footer style={{ textAlign: 'center', padding: '8px 24px', fontSize: 12, color: '#999' }}>
      v{versao}{dataBuild ? ` · ${dataBuild}` : ''}
    </Footer>
  );
}
