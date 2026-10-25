import React, { useState } from 'react';
import { Plus, Archive, Building2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAccounts, useCreateAccount, useArchiveAccount } from '../hooks/useFinance';
import { brl } from '../utils/format';

const TYPES = [
  { id: 'checking', label: 'Conta corrente' },
  { id: 'savings', label: 'Poupança' },
  { id: 'credit', label: 'Cartão de crédito' },
  { id: 'cash', label: 'Dinheiro' },
  { id: 'investment', label: 'Investimento' },
  { id: 'other', label: 'Outra' },
];

const EMPTY = { name: '', bank: '', type: 'checking', initialBalance: '' };

export default function FinancesAccounts() {
  const { data: accounts, isLoading } = useAccounts();
  const createAccount = useCreateAccount();
  const archive = useArchiveAccount();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createAccount.mutateAsync({
        ...form,
        initialBalance: Number(String(form.initialBalance).replace(',', '.')) || 0,
      });
      setForm(EMPTY);
    } catch (err) {
      setError(err?.response?.data?.error || 'Não foi possível criar a conta.');
    }
  };

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <div className="page-head">
          <div>
            <h1>Contas e bancos</h1>
            <p>Sem limite de contas: cadastre quantos bancos você usar.</p>
          </div>
        </div>

        <form className="card" onSubmit={submit}>
          <h3 style={{ marginTop: 0 }}>
            <Plus size={17} /> Nova conta
          </h3>
          <div className="row">
            <label className="field" style={{ flex: 2 }}>
              Nome da conta
              <input value={form.name} onChange={set('name')} placeholder="Conta PJ" required />
            </label>
            <label className="field" style={{ flex: 2 }}>
              Banco
              <input value={form.bank} onChange={set('bank')} placeholder="Nubank, Itaú…" />
            </label>
          </div>
          <div className="row">
            <label className="field" style={{ flex: 1 }}>
              Tipo
              <select value={form.type} onChange={set('type')}>
                {TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field" style={{ flex: 1 }}>
              Saldo inicial (R$)
              <input
                value={form.initialBalance}
                onChange={set('initialBalance')}
                inputMode="decimal"
                placeholder="0,00"
              />
            </label>
          </div>
          {error && <p className="error">{error}</p>}
          <button className="btn primary" type="submit" disabled={createAccount.isPending}>
            <Plus size={16} /> {createAccount.isPending ? 'Salvando…' : 'Cadastrar conta'}
          </button>
        </form>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Suas contas</h3>
          {isLoading && <p className="muted">Carregando…</p>}
          <div className="table-wrap"><table className="table">
            <thead>
              <tr>
                <th>Conta</th>
                <th>Banco</th>
                <th>Tipo</th>
                <th style={{ textAlign: 'right' }}>Saldo inicial</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(accounts || []).map((a) => (
                <tr key={a._id}>
                  <td>
                    <Building2 size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />
                    {a.name}
                  </td>
                  <td className="muted">{a.bank || '—'}</td>
                  <td className="muted">{TYPES.find((t) => t.id === a.type)?.label || a.type}</td>
                  <td style={{ textAlign: 'right' }}>{brl(a.initialBalance)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn ghost danger"
                      title="Arquivar conta"
                      onClick={() => archive.mutate(a._id)}
                    >
                      <Archive size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {(accounts || []).length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="muted">
                    Nenhuma conta ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table></div>
        </div>
      </main>
    </div>
  );
}

