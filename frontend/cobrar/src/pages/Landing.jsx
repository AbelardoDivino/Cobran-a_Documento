import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Upload,
  Tags,
  Landmark,
  Users,
  QrCode,
  CreditCard,
  ShieldCheck,
  Check,
  FileCheck2,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { BrandMark } from '../components/Sidebar';

const FEATURES = [
  {
    Icon: Upload,
    title: 'Importe o extrato. Não digite nada.',
    text: 'CSV ou OFX de qualquer banco. A gente lê datas, valores e sinais, ignora cabeçalho e ainda impede lançamento duplicado quando você reimporta o mesmo mês.',
  },
  {
    Icon: Tags,
    title: 'Cada saída no lugar certo, sozinha.',
    text: 'Supermercado vira Alimentação. DAS vira Impostos. Uber vira Transporte. Você revisa só o que fugiu da regra — e o ranking de categorias mostra o que está pesando.',
  },
  {
    Icon: Landmark,
    title: 'Saldo real, banco por banco.',
    text: 'Saldo inicial mais tudo que entrou e saiu. Conta corrente, poupança, carteira e cartão no mesmo painel, com resultado do mês e comparativo dos últimos seis.',
  },
  {
    Icon: Users,
    title: 'A empresa toda olhando o mesmo número.',
    text: 'Comece sozinho ou convide o time. O plano Pro libera até 10 pessoas no mesmo espaço, com dono e membros — sem exportar planilha por e-mail.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Crie o espaço',
    text: 'Escolha uso pessoal ou empresarial. Se for empresa, informe o CNPJ e o nome — é o que aparece no painel.',
  },
  {
    n: '02',
    title: 'Cadastre a conta e importe',
    text: 'Banco, saldo inicial e o arquivo do extrato. Em segundos o mês inteiro está classificado e somado.',
  },
  {
    n: '03',
    title: 'Decida com o mês fechado',
    text: 'Saldo, entradas, saídas e categorias. O que sobrou de verdade, não o que o app do banco disse.',
  },
];

const LEDGER_ROWS = [
  { d: '05 out', name: 'Recebimento — Projeto site', tag: 'Receitas', value: '+ R$ 4.200,00', in: true },
  { d: '07 out', name: 'Fornecedor de informática', tag: 'Equipamentos', value: '− R$ 1.890,00', in: false },
  { d: '10 out', name: 'DAS — Simples Nacional', tag: 'Impostos', value: '− R$ 380,90', in: false },
];

const HERO_BARS = [38, 62, 47, 80, 55, 92];

export default function Landing() {
  const { user } = useAuth();
  const logged = Boolean(user);

  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-wrap lp-nav-in">
          <Link to="/" className="lp-brand">
            <BrandMark /> Portal do Contador
          </Link>
          <nav className="lp-links">
            <a href="#recursos">Recursos</a>
            <a href="#como">Como funciona</a>
            <a href="#planos">Planos</a>
          </nav>
          <div className="lp-nav-actions">
            {logged ? (
              <Link className="btn primary" to="/financas">
                Abrir painel <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link className="btn ghost" to="/login">
                  Entrar
                </Link>
                <Link className="btn primary" to="/register">
                  Começar agora
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="lp-wrap lp-hero">
          <div>
            <span className="lp-eyebrow">Controle financeiro para autônomos e pequenos negócios</span>
            <h1>
              Todo o dinheiro que entra e sai,
              <em> num só lugar.</em>
            </h1>
            <p className="lead">
              Contas, lançamentos e extratos organizados automaticamente. Saldo real por banco,
              categorias que fazem sentido e um time inteiro olhando o mesmo número.
            </p>
            <div className="lp-actions">
              <Link className="btn primary" to={logged ? '/financas' : '/register'}>
                {logged ? 'Ir para o painel' : 'Criar conta'} <ArrowRight size={17} />
              </Link>
              <a className="btn" href="#planos">
                Ver planos
              </a>
            </div>
            <p className="lp-trust">
              <span>A partir de R$ 40/mês</span>
              <span>CSV e OFX</span>
              <span>Cancele quando quiser</span>
            </p>
          </div>

          <div className="lp-ledger" aria-hidden="true">
            <div className="lp-ledger-top">
              <span>Visão geral · Outubro</span>
              <span className="lp-live">ao vivo</span>
            </div>
            <p className="lp-ledger-label">Saldo em contas</p>
            <p className="lp-ledger-balance">R$ 12.480,35</p>
            <div className="lp-ledger-split">
              <span className="in">↑ R$ 8.900,00 entradas</span>
              <span className="out">↓ R$ 5.312,40 saídas</span>
            </div>
            <div className="lp-bars">
              {HERO_BARS.map((h, i) => (
                <i key={i} style={{ height: `${h}%` }} className={i % 2 ? 'out' : 'in'} />
              ))}
            </div>
            <div className="lp-ledger-rows">
              {LEDGER_ROWS.map((r) => (
                <div className="lp-row" key={r.name}>
                  <span className="lp-row-d">{r.d}</span>
                  <span className="lp-row-name">
                    {r.name}
                    <em>{r.tag}</em>
                  </span>
                  <span className={r.in ? 'in' : 'out'}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-ribbon">
          <div className="lp-wrap lp-ribbon-in">
            <strong>Feito para quem fecha o mês sozinho</strong>
            <span>Autônomos</span>
            <span>MEI e pequenas empresas</span>
            <span>Escritórios contábeis</span>
            <span className="lp-ribbon-note">
              <FileCheck2 size={16} /> Também cobra documentos dos seus clientes
            </span>
          </div>
        </section>

        <section id="recursos" className="lp-section">
          <div className="lp-wrap">
            <span className="lp-kicker">O que resolve</span>
            <h2 className="lp-h2">Menos planilha. Mais decisão.</h2>
            <p className="lp-sub">
              O trabalho chato — digitar, classificar, somar e conferir — fica com o sistema.
              A leitura do mês fica com você.
            </p>
            <div className="lp-features">
              {FEATURES.map(({ Icon, title, text }) => (
                <article className="lp-feature" key={title}>
                  <span className="lp-ic">
                    <Icon size={20} />
                  </span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="como" className="lp-section lp-how">
          <div className="lp-wrap">
            <span className="lp-kicker">Como funciona</span>
            <h2 className="lp-h2">Do extrato ao saldo em três passos.</h2>
            <div className="lp-steps">
              {STEPS.map((s) => (
                <div className="lp-step" key={s.n}>
                  <span className="lp-step-n">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section lp-audience">
          <div className="lp-wrap lp-audience-grid">
            <div>
              <span className="lp-kicker">Para quem é</span>
              <h2 className="lp-h2">
                Nasceu para o Brasil que trabalha por conta própria.
              </h2>
            </div>
            <div className="lp-audience-cols">
              <div>
                <h3>Autônomo</h3>
                <p>Separe o dinheiro da pessoa do dinheiro do trabalho e saiba quanto sobrou no mês.</p>
              </div>
              <div>
                <h3>MEI e pequena empresa</h3>
                <p>Feche o caixa sem depender de planilha compartilhada ou de lembrar de cabeça.</p>
              </div>
              <div>
                <h3>Escritório contábil</h3>
                <p>Organize o financeiro do escritório e a cobrança de documentos dos clientes no mesmo login.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="planos" className="lp-section lp-plans">
          <div className="lp-wrap">
            <span className="lp-kicker">Planos</span>
            <h2 className="lp-h2">Comece no Begin. Suba quando o time crescer.</h2>
            <div className="lp-plans-grid">
              <article className="lp-plan">
                <div className="lp-plan-head">
                  <h3>Begin</h3>
                  <span className="lp-plan-price">R$ 40</span>
                  <span className="lp-plan-per">por mês · cancele quando quiser</span>
                </div>
                <ul>
                  <li><Check size={16} /> 1 pessoa</li>
                  <li><Check size={16} /> Contas e bancos ilimitados</li>
                  <li><Check size={16} /> Lançamentos manuais e importação CSV/OFX</li>
                  <li><Check size={16} /> Categorias automáticas e resumo mensal</li>
                </ul>
                <Link className="btn" to={logged ? '/financas' : '/register'}>
                  {logged ? 'Continuar no Begin' : 'Começar no Begin'}
                </Link>
              </article>

              <article className="lp-plan pro">
                <div className="lp-plan-head">
                  <h3>Pro</h3>
                  <span className="lp-plan-price">R$ 90</span>
                  <span className="lp-plan-per">por mês · cancele quando quiser</span>
                </div>
                <ul>
                  <li><Check size={16} /> Até 10 pessoas no mesmo espaço</li>
                  <li><Check size={16} /> Tudo do Begin</li>
                  <li><Check size={16} /> Cobrança de documentos dos clientes</li>
                  <li><Check size={16} /> Suporte prioritário</li>
                </ul>
                <div className="lp-pay">
                  <span><QrCode size={16} /> Pix</span>
                  <span><CreditCard size={16} /> Cartão</span>
                  <span><ShieldCheck size={16} /> Mercado Pago</span>
                </div>
                <Link className="btn gold" to={logged ? '/billing' : '/register?plano=pro'}>
                  Assinar o Pro <ArrowRight size={16} />
                </Link>
              </article>
            </div>
            <p className="lp-fine">
              O Begin custa R$ 40 por mês e o Pro R$ 90 por mês. Os dois podem ser cancelados a
              qualquer momento — o acesso continua até o fim do período pago.
            </p>
          </div>
        </section>

        <section className="lp-section lp-faq">
          <div className="lp-wrap lp-faq-grid">
            <div>
              <span className="lp-kicker">Dúvidas</span>
              <h2 className="lp-h2">Antes de começar.</h2>
            </div>
            <div className="lp-faq-list">
              <details>
                <summary>Preciso instalar alguma coisa?</summary>
                <p>Não. É tudo no navegador, no computador ou no celular. Seus dados ficam na nuvem.</p>
              </details>
              <details>
                <summary>Funciona com o extrato do meu banco?</summary>
                <p>Sim, se o banco exporta CSV ou OFX — o formato padrão de quase todos. Você também pode lançar manualmente.</p>
              </details>
              <details>
                <summary>Serve para pessoa física?</summary>
                <p>Serve. Na criação da conta escolha “Pessoal” e o painel se ajusta. Depois é só cadastrar suas contas.</p>
              </details>
              <details>
                <summary>O que acontece se eu cancelar o Pro?</summary>
                <p>Você volta ao Begin no fim do período pago, mantendo o histórico. Se houver mais de uma pessoa no espaço, remova os membros extras antes.</p>
              </details>
              <details>
                <summary>Como o pagamento é feito?</summary>
                <p>Pelo Mercado Pago, com Pix ou cartão de crédito. A liberação é automática após a confirmação.</p>
              </details>
            </div>
          </div>
        </section>

        <section className="lp-final">
          <div className="lp-wrap lp-final-in">
            <div>
              <h2>O próximo mês pode fechar sem planilha.</h2>
              <p>Crie a conta, cadastre uma conta bancária e importe o primeiro extrato. Leva menos que um café.</p>
            </div>
            <Link className="btn gold big" to={logged ? '/financas' : '/register'}>
              {logged ? 'Abrir meu painel' : 'Começar agora'} <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="lp-foot">
        <div className="lp-wrap lp-foot-in">
          <span className="lp-brand">
            <BrandMark /> Portal do Contador
          </span>
          <span>Controle financeiro e cobrança de documentos · Brasil</span>
          <span>
            <Link to="/login">Entrar</Link> · <Link to="/register">Criar conta</Link> ·{' '}
            <Link to="/privacidade">Privacidade</Link> · <Link to="/termos">Termos</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
