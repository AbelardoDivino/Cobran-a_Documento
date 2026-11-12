import React, { useState, useMemo } from 'react';
import { Calculator, Receipt } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const fmt = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Tabelas Simples Nacional (RBT12) - alíquota nominal e parcela a deduzir
const SIMPLES = {
  I: [[180000, 0.04, 0], [360000, 0.073, 5940], [720000, 0.095, 13860], [1800000, 0.107, 22500], [3600000, 0.143, 87300], [4800000, 0.19, 378000]],
  II: [[180000, 0.045, 0], [360000, 0.078, 5940], [720000, 0.1, 13860], [1800000, 0.112, 22500], [3600000, 0.147, 87300], [4800000, 0.3, 720000]],
  III: [[180000, 0.06, 0], [360000, 0.112, 9360], [720000, 0.135, 17640], [1800000, 0.16, 35640], [3600000, 0.21, 125640], [4800000, 0.33, 648000]],
  IV: [[180000, 0.045, 0], [360000, 0.09, 8100], [720000, 0.102, 15120], [1800000, 0.14, 44280], [3600000, 0.22, 198000], [4800000, 0.3, 508500]],
  V: [[180000, 0.155, 0], [360000, 0.18, 8100], [720000, 0.195, 11646], [1800000, 0.205, 15180], [3600000, 0.23, 39180], [4800000, 0.305, 138600]],
};

function simplesRate(anexo, rbt12) {
  const table = SIMPLES[anexo];
  for (const [limit, aliq, ded] of table) {
    if (rbt12 <= limit) {
      return { aliq, ded, effective: (rbt12 * aliq - ded) / rbt12 };
    }
  }
  return { aliq: table[table.length - 1][1], ded: table[table.length - 1][2], effective: (rbt12 * table[table.length - 1][1] - table[table.length - 1][2]) / rbt12 };
}

// Presunção de lucro por atividade (LP)
const PRESUNCAO = {
  comercio: 0.08,
  industria: 0.08,
  servicos: 0.32,
  transporte: 0.16,
  combustivel: 0.016,
};

export default function TaxCalculator() {
  const [regime, setRegime] = useState('simples');
  const [anexo, setAnexo] = useState('III');
  const [atividade, setAtividade] = useState('servicos');
  const [receita, setReceita] = useState(10000);
  const [despesas, setDespesas] = useState(3000);
  const [folha, setFolha] = useState(2000);
  const [rbt12, setRbt12] = useState(120000);
  const [iss, setIss] = useState(5);

  const result = useMemo(() => {
    const r = Number(receita) || 0;
    const d = Number(despesas) || 0;
    const annual = r * 12;
    if (regime === 'mei') {
      const das = atividade === 'servicos' ? 80.85 : 75.60;
      return {
        lines: [
          { label: 'DAS-MEI (fixo mensal)', value: das },
          { label: 'INSS (incluso no DAS)', value: 0 },
        ],
        total: das,
        note: 'MEI: faturamento até R$ 81.000/ano. DAS fixo + INSS incluso. Acima do limite, migra para ME/EPP.',
      };
    }
    if (regime === 'simples') {
      const { effective } = simplesRate(anexo, Number(rbt12) || annual);
      const das = r * effective;
      return {
        lines: [
          { label: `DAS Simples (Anexo ${anexo})`, value: das },
          { label: 'Alíquota efetiva', value: (effective * 100).toFixed(2) + '%' },
        ],
        total: das,
        note: 'DAS inclui IRPJ, CSLL, PIS, COFINS, IPI, ICMS, ISS e INSS patronal (conforme anexo).',
      };
    }
    if (regime === 'presumido') {
      const pres = PRESUNCAO[atividade] || 0.32;
      const lucro = r * pres;
      const irpj = lucro * 0.15 + (lucro > 20000 ? (lucro - 20000) * 0.1 : 0);
      const csll = lucro * 0.09;
      const pis = r * 0.0065;
      const cofins = r * 0.03;
      const issVal = r * (Number(iss) / 100);
      const total = irpj + csll + pis + cofins + issVal;
      return {
        lines: [
          { label: 'IRPJ (15% + 10% adic.)', value: irpj },
          { label: 'CSLL (9%)', value: csll },
          { label: 'PIS (0,65%)', value: pis },
          { label: 'COFINS (3%)', value: cofins },
          { label: `ISS (${iss}%)`, value: issVal },
        ],
        total,
        note: 'Lucro Presumido: presunção de ' + (pres * 100).toFixed(1) + '% sobre a receita. ICMS pago à parte.',
      };
    }
    // Lucro Real
    const lucro = Math.max(0, r - d);
    const irpj = lucro * 0.15 + (lucro > 20000 ? (lucro - 20000) * 0.1 : 0);
    const csll = lucro * 0.09;
    const pis = r * 0.0165;
    const cofins = r * 0.076;
    const issVal = r * (Number(iss) / 100);
    const total = irpj + csll + pis + cofins + issVal;
    return {
      lines: [
        { label: 'IRPJ (15% + 10% adic.)', value: irpj },
        { label: 'CSLL (9%)', value: csll },
        { label: 'PIS (1,65%)', value: pis },
        { label: 'COFINS (7,6%)', value: cofins },
        { label: `ISS (${iss}%)`, value: issVal },
      ],
      total,
      note: 'Lucro Real: imposto sobre o lucro efetivo. PIS/COFINS não-cumulativos. INSS patronal sobre folha pago à parte.',
    };
  }, [regime, anexo, atividade, receita, despesas, rbt12, iss]);

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <div className="page-head">
          <div>
            <h1>Calculadora de impostos</h1>
            <p>Estimativa de tributos por regime. Valores aproximados — confirme com seu contador.</p>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Regime tributário</h3>
          <div className="seg" role="group">
            {[
              ['mei', 'MEI'],
              ['simples', 'Simples Nacional'],
              ['presumido', 'Lucro Presumido'],
              ['real', 'Lucro Real'],
            ].map(([v, l]) => (
              <button key={v} type="button" className={regime === v ? 'on' : ''} onClick={() => setRegime(v)}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Dados</h3>
          <div className="row">
            <label className="field" style={{ flex: 1 }}>
              Receita mensal (R$)
              <input type="number" value={receita} onChange={(e) => setReceita(e.target.value)} />
            </label>
            <label className="field" style={{ flex: 1 }}>
              Despesas mensais (R$)
              <input type="number" value={despesas} onChange={(e) => setDespesas(e.target.value)} />
            </label>
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <label className="field" style={{ flex: 1 }}>
              Folha de pagamento (R$)
              <input type="number" value={folha} onChange={(e) => setFolha(e.target.value)} />
            </label>
            {regime === 'simples' && (
              <label className="field" style={{ flex: 1 }}>
                Anexo
                <select value={anexo} onChange={(e) => setAnexo(e.target.value)}>
                  <option value="I">I - Comércio</option>
                  <option value="II">II - Indústria</option>
                  <option value="III">III - Serviços (com INSS)</option>
                  <option value="IV">IV - Serviços (sem INSS)</option>
                  <option value="V">V - Serviços profissionais</option>
                </select>
              </label>
            )}
            {regime === 'simples' && (
              <label className="field" style={{ flex: 1 }}>
                RBT12 (receita 12 meses)
                <input type="number" value={rbt12} onChange={(e) => setRbt12(e.target.value)} />
              </label>
            )}
            {(regime === 'presumido' || regime === 'real') && (
              <label className="field" style={{ flex: 1 }}>
                Atividade
                <select value={atividade} onChange={(e) => setAtividade(e.target.value)}>
                  <option value="comercio">Comércio</option>
                  <option value="industria">Indústria</option>
                  <option value="servicos">Serviços</option>
                  <option value="transporte">Transporte</option>
                </select>
              </label>
            )}
            {(regime === 'presumido' || regime === 'real') && (
              <label className="field" style={{ flex: 1 }}>
                ISS municipal (%)
                <input type="number" value={iss} onChange={(e) => setIss(e.target.value)} />
              </label>
            )}
            {regime === 'mei' && (
              <label className="field" style={{ flex: 1 }}>
                Atividade MEI
                <select value={atividade} onChange={(e) => setAtividade(e.target.value)}>
                  <option value="comercio">Comércio/Indústria</option>
                  <option value="servicos">Serviços</option>
                </select>
              </label>
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>
            <Calculator size={17} /> Resultado estimado (mensal)
          </h3>
          <table className="table">
            <tbody>
              {result.lines.map((l, i) => (
                <tr key={i}>
                  <td>{l.label}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    {typeof l.value === 'string' ? l.value : fmt(l.value)}
                  </td>
                </tr>
              ))}
              <tr>
                <td style={{ fontWeight: 700 }}>Total mensal</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(result.total)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Total anual (×12)</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(result.total * 12)}</td>
              </tr>
              <tr>
                <td>Alíquota efetiva sobre receita</td>
                <td style={{ textAlign: 'right' }}>{((result.total / (Number(receita) || 1)) * 100).toFixed(2)}%</td>
              </tr>
            </tbody>
          </table>
          <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
            <Receipt size={13} /> {result.note}
          </p>
          <p className="muted" style={{ fontSize: 12 }}>
            Valores aproximados para 2026. ICMS, INSS patronal sobre folha e contribuições acessórias não estão incluídos em todos os regimes. Sempre valide com o contador.
          </p>
        </div>
      </main>
    </div>
  );
}
