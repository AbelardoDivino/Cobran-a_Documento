import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Upload, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useFinanceOverview, useAccounts } from '../hooks/useFinance';
import { brl, pct, monthLabel, periodRange } from '../utils/format';

const PRESETS = [
  { id: 'month', label: 'Este mês' },
  { id: 'quarter', label: '3 meses' },
  { id: 'year', label: 'Ano' },
];

export default function Finances() {
  const [preset, setPreset] = useState('month');
  const range = periodRange(preset);
  const { data, isLoading, error } = useFinanceOverview(range);
  const { data: accounts } = useAccounts();

  const totals = data?.totals || { income: 0, expense: 0, net: 0, balance: 0 };
  const byCategory = data?.byCategory || [];
  const monthly = data?.monthly || [];
  const topCategory = byCategory[0]?.total || 0;
  const maxMonth = Math.max(1, ...monthly.map((m) => Math.max(m.in, m.out)));

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <div className="page-head">
          <div>
            <h1>Finanças</h1>
            <p>Veja para onde o dinheiro está indo, banco por banco.</p>
          </div>
          <div className="chips">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                className={`chip${preset === p.id ? ' sel' : ''}`}
                onClick={() => setPreset(p.id)}
                data-testid={`period-${p.id}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="error">
            Não foi possível carregar o resumo: {error?.response?.data?.error || error.message}
          </p>
        )}

        {!isLoading && accounts && accounts.length === 0 ? (
          <div className="card empty-state">
            <Wallet size={30} style={{ color: 'var(--pine)' }} />
            <h2>Comece cadastrando uma conta</h2>
            <p className="muted">
              Cadastre o banco e importe o extrato (CSV ou OFX). O sistema categoriza cada saída
              e mostra o que está consumindo seu caixa.
            </p>
            <div className="row" style={{ justifyContent: 'center' }}>
              <Link className="btn primary" to="/financas/contas">
                Cadastrar conta
              </Link>
              <Link className="btn" to="/financas/importar">
                <Upload size={16} /> Importar extrato
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="stats">
              <div className="stat">
                <div className="num">{brl(totals.balance)}</div>
                <div className="lbl">Saldo em contas</div>
              </div>
              <div className="stat">
                <div className="num money-in">{brl(totals.income)}</div>
                <div className="lbl">
                  <ArrowUpRight size={13} /> Entradas no período
                </div>
              </div>
              <div className="stat">
                <div className="num money-out">{brl(totals.expense)}</div>
                <div className="lbl">
                  <ArrowDownRight size={13} /> Saídas no período
                </div>
              </div>
              <div className="stat">
                <div className={`num ${totals.net >= 0 ? 'money-in' : 'money-out'}`}>
                  {brl(totals.net)}
                </div>
                <div className="lbl">
                  <TrendingUp size={13} /> Resultado do período
                </div>
              </div>
            </div>

            <div className="grid-2">
              <div className="card">
                <h3 style={{ marginTop: 0 }}>Para onde foi o dinheiro</h3>
                {byCategory.length === 0 ? (
                  <p className="muted">Nenhuma saída no período. Importe um extrato para ver aqui.</p>
                ) : (
                  <div className="bars">
                    {byCategory.map((c) => (
                      <div className="bar-row" key={c.category}>
                        <span className="bar-label">{c.category}</span>
                        <div className="bar-track">
                          <div
                            className="bar-fill expense"
                            style={{ width: `${Math.max(4, pct(c.total, topCategory))}%` }}
                          />
                        </div>
                        <span className="bar-value">{brl(c.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card">
                <h3 style={{ marginTop: 0 }}>Últimos 6 meses</h3>
                {monthly.length === 0 ? (
                  <p className="muted">Sem histórico ainda.</p>
                ) : (
                  <div className="month-chart">
                    {monthly.map((m) => (
                      <div className="month-col" key={m.month}>
                        <div className="month-bars">
                          <div
                            className="month-bar in"
                            style={{ height: `${Math.max(3, (m.in / maxMonth) * 100)}%` }}
                            title={`Entradas: ${brl(m.in)}`}
                          />
                          <div
                            className="month-bar out"
                            style={{ height: `${Math.max(3, (m.out / maxMonth) * 100)}%` }}
                            title={`Saídas: ${brl(m.out)}`}
                          />
                        </div>
                        <span className="month-lbl">{monthLabel(m.month)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="legend">
                  <span>
                    <i className="dot in" /> Entradas
                  </span>
                  <span>
                    <i className="dot out" /> Saídas
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0 }}>Contas e bancos</h3>
                <Link className="btn" to="/financas/contas">
                  Gerenciar
                </Link>
              </div>
              <div className="table-wrap"><table className="table">
                <thead>
                  <tr>
                    <th>Conta</th>
                    <th>Banco</th>
                    <th style={{ textAlign: 'right' }}>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.accounts || []).map((a) => (
                    <tr key={a.id}>
                      <td>{a.name}</td>
                      <td className="muted">{a.bank || '—'}</td>
                      <td style={{ textAlign: 'right' }} className={a.balance >= 0 ? 'money-in' : 'money-out'}>
                        {brl(a.balance)}
                      </td>
                    </tr>
                  ))}
                  {(data?.accounts || []).length === 0 && (
                    <tr>
                      <td colSpan={3} className="muted">
                        Nenhuma conta cadastrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table></div>
            </div>
          </>
        )}

        {isLoading && (
          <p className="muted">
            <AlertCircle size={14} /> Carregando finanças…
          </p>
        )}
      </main>
    </div>
  );
}

