import React from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../components/Sidebar';

export default function Terms() {
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
        <h1>Termos de Uso</h1>
        <p>Última atualização: outubro de 2026.</p>

        <h2>1. Serviço</h2>
        <p>
          O Portal do Contador oferece controle financeiro (contas, lançamentos, importação de
          extratos) e cobrança de documentos de clientes por links públicos. O serviço é fornecido
          no estado em que se encontra, com esforço de disponibilidade contínua.
        </p>

        <h2>2. Conta e segurança</h2>
        <p>
          Você é responsável pela veracidade dos dados cadastrados, pela guarda da senha e pelas
          ações realizadas na sua conta. O e-mail precisa ser confirmado para aceitar convites de
          equipe. Não compartilhe o link público de solicitação com pessoas que não devam enviar
          documentos.
        </p>

        <h2>3. Planos e pagamento</h2>
        <p>
          Os planos e preços são os exibidos na página de assinatura. O pagamento é processado pelo
          Mercado Pago via Pix, boleto ou cartão. O Pro é liberado após a confirmação do pagamento e
          vale pelo período do plano contratado.
        </p>
        <p>
          A renovação gera uma nova cobrança antes do vencimento: Pix e boleto são emitidos
          automaticamente e enviados por e-mail; no cartão, você recebe um aviso para informar o
          cartão novamente, pois ele não é armazenado. O período é estendido somente após a
          confirmação do pagamento. Não há cobrança recorrente automática no cartão.
        </p>

        <h2>4. Cancelamento e reembolso</h2>
        <p>
          Você pode cancelar a renovação a qualquer momento. O acesso Pro permanece até o fim do
          período já pago; depois, a conta volta ao plano Begin, mantendo o histórico. Pedidos de
          reembolso são analisados conforme o Código de Defesa do Consumidor e as regras do meio de
          pagamento.
        </p>

        <h2>5. Uso aceitável</h2>
        <p>
          É proibido usar o serviço para fraude, envio de arquivos ilícitos, tentativa de acesso a
          contas de terceiros, sobrecarga deliberada ou violação de direitos. Podemos suspender
          contas que violem estes termos ou a lei.
        </p>

        <h2>6. Dados de clientes</h2>
        <p>
          Ao cadastrar clientes e solicitar documentos, você atua como controlador desses dados e
          deve informar seus clientes sobre a finalidade e a retenção. O Portal do Contador atua
          como operador, conforme a Política de Privacidade. A exclusão de um cliente apaga os
          pedidos e arquivos vinculados.
        </p>

        <h2>7. Limitação de responsabilidade</h2>
        <p>
          Não respondemos por indisponibilidades de terceiros (bancos, Mercado Pago, Google,
          provedores de e-mail), por decisões tomadas com base nas informações do painel nem por
          danos indiretos. O serviço não substitui contabilidade, consultoria fiscal ou jurídica.
        </p>

        <h2>8. Alterações e foro</h2>
        <p>
          Podemos atualizar estes termos; mudanças relevantes serão comunicadas na conta ou por
          e-mail. Aplica-se a legislação brasileira, com foro no domicílio do consumidor quando
          cabível.
        </p>

        <p>
          Dúvidas: <strong>contato@portaldocontador.com.br</strong>.
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
