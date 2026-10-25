import React from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../components/Sidebar';

export default function Privacy() {
  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-wrap lp-nav-in">
          <Link to="/" className="lp-brand">
            <BrandMark /> Portal do Contador
          </Link>
          <div className="lp-nav-actions">
            <Link className="btn ghost" to="/login">
              Entrar
            </Link>
            <Link className="btn primary" to="/register">
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      <main className="lp-wrap legal">
        <h1>Política de Privacidade</h1>
        <p>Última atualização: outubro de 2026.</p>

        <h2>1. Quem trata os dados</h2>
        <p>
          O Portal do Contador é operado pelo responsável indicado nos dados de contratação. Para
          exercer direitos ou tirar dúvidas, fale com o encarregado de dados pelo e-mail{' '}
          <strong>privacidade@portaldocontador.com.br</strong>.
        </p>

        <h2>2. Dados que tratamos</h2>
        <ul>
          <li>
            <strong>Cadastro:</strong> nome, e-mail, senha (armazenada apenas como hash), tipo de
            conta, nome da empresa e CNPJ.
          </li>
          <li>
            <strong>Documentos:</strong> arquivos PDF, PNG e JPG enviados pelos seus clientes nos
            links públicos de solicitação.
          </li>
          <li>
            <strong>Financeiro:</strong> contas, lançamentos, extratos importados (CSV/OFX) e
            categorias.
          </li>
          <li>
            <strong>Pagamento:</strong> plano, status e histórico de cobranças. Os dados do cartão
            são informados diretamente ao Mercado Pago; o Portal do Contador não armazena o número
            do cartão.
          </li>
          <li>
            <strong>Uso e segurança:</strong> endereço IP, data/hora de acesso e registros técnicos
            necessários para operar e proteger o serviço.
          </li>
        </ul>

        <h2>3. Para que usamos e com qual base legal</h2>
        <ul>
          <li>Executar o contrato: criar a conta, processar cobranças, guardar documentos e gerar o painel financeiro.</li>
          <li>Cumprir obrigações legais e regulatórias, inclusive fiscais e de prevenção a fraude.</li>
          <li>Legítimo interesse: segurança, prevenção a abuso, suporte e melhoria do serviço.</li>
          <li>Consentimento, quando necessário, para comunicações específicas.</li>
        </ul>

        <h2>4. Compartilhamento</h2>
        <p>
          Compartilhamos apenas o necessário com operadores de pagamento (Mercado Pago), login
          federado (Google), envio de e-mails (provedor SMTP) e infraestrutura de hospedagem e banco
          de dados. Não vendemos dados pessoais.
        </p>

        <h2>5. Retenção e exclusão</h2>
        <p>
          Os dados são mantidos enquanto a conta estiver ativa e pelo prazo necessário ao cumprimento
          de obrigações legais. Ao excluir um cliente, os pedidos, itens de checklist e arquivos
          enviados são apagados. Você pode solicitar a exclusão da conta pelo canal de contato.
        </p>

        <h2>6. Seus direitos</h2>
        <p>
          Você pode pedir confirmação do tratamento, acesso, correção, anonimização, portabilidade,
          eliminação de dados desnecessários e informação sobre compartilhamentos, conforme a LGPD.
          Responderemos no prazo legal. Para proteger sua conta, podemos pedir confirmação de
          identidade.
        </p>

        <h2>7. Segurança</h2>
        <p>
          Usamos HTTPS, senhas com hash, confirmação de e-mail para aceitar convites, acesso
          autenticado aos arquivos e limitação de tentativas de login. Nenhum sistema é totalmente
          imune; em caso de incidente relevante, comunicaremos os afetados e a ANPD conforme a lei.
        </p>

        <h2>8. Cookies e armazenamento local</h2>
        <p>
          O painel usa armazenamento local do navegador apenas para manter a sessão (tokens de
          acesso e atualização). Não usamos cookies de publicidade nem rastreamento de terceiros.
        </p>

        <h2>9. Alterações</h2>
        <p>
          Podemos atualizar esta política para refletir mudanças no serviço ou na lei. A versão
          vigente estará sempre nesta página, com a data de atualização.
        </p>
      </main>

      <footer className="lp-foot">
        <div className="lp-wrap lp-foot-in">
          <span className="lp-brand">
            <BrandMark /> Portal do Contador
          </span>
          <span>
            <Link to="/privacidade">Privacidade</Link> · <Link to="/termos">Termos</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
