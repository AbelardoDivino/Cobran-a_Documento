import React, { useState } from 'react';
import { Trash2, Plus, Filter } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useTransactions, useAccounts, useCreateTransaction, useDeleteTransaction } from '../hooks/useFinance';
import { brl, dayLabel } from '../utils/format';

const EMPTY = { accountId: '', date: '', description: '', amount: '', type: 'out', category: '' };

export default function FinancesTransactions() {
  const [filters, setFilters] = useState({ accountId: '', type: '', q: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const { data: accounts } = useAccounts();
  const params = { page, limit: 50, ...filters };
  Object.keys(params).forEach((k) => params[k] === '' && delete params[k]);
  const { data, isLoading } = useTransactions(params);
  const create = useCreateTransaction();
  const remove = useDeleteTransaction();

  const setFilter = (key) => (e) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: e.target.value }));
  };
  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await create.mutateAsync({
        accountId: form.accountId || accounts?.[0]?._id,
        date: form.date || new Date().toISOString(),
        description: form.description,
        amount: Number(String(form.amount).replace(',', '.')),
        type: form.type,
        category: form.category || undefined,
      });
      setForm(EMPTY);
      setShowForm(false);
    } catch (err) {
      setError(err?.response?.data?.error || 'Não foi possível salvar o lançamento.');
    }
  };

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <div className="page-head">
          <div>
            <h1>Lançamentos</h1>
            <p>Tudo que entrou e saiu, com categoria e conta.</p>
          </div>
          <button className="btn primary" onClick={() => setShowForm((v) => !v)}>
            <Plus size={16} /> Novo lançamento
          </button>
        </div>

        {showForm && (
          <form className="card" onSubmit={submit} data-testid="transaction-form">
            <h3 style={{ marginTop: 0 }}>Lançamento manual</h3>
            <div className="row">
              <label className="field" style={{ flex: 1 }}>
                Conta
                <select value={form.accountId} onChange={setField('accountId')} required>
                  <option value="">Selecione…</option>
                  {(accounts || []).map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field" style={{ flex: 1 }}>
                Data
                <input type="date" value={form.date} onChange={setField('date')} required />
              </label>
              <label className="field" style={{ flex: 1 }}>
                Tipo
                <select value={form.type} onChange={setField('type')}>
                  <option value="out">Saída</option>
                  <option value="in">Entrada</option>
                </select>
              </label>
            </div>
            <div className="row">
              <label className="field" style={{ flex: 3 }}>
                Descrição
                <input value={form.description} onChange={setField('description')} required />
              </label>
              <label className="field" style={{ flex: 1 }}>
                Valor (R$)
                <input value={form.amount} onChange={setField('amount')} inputMode="decimal" required />
              </label>
              <label className="field" style={{ flex: 1 }}>
                Categoria
                <input value={form.category} onChange={setField('category')} placeholder="Automática" />
              </label>
            </div>
            {error && <p className="error">{error}</p>}
            <button className="btn primary" type="submit" disabled={create.isPending}>
              Salvar lançamento
            </button>
          </form>
        )}

        <div className="card">
          <h3 style={{ marginTop: 0 }}>
            <Filter size={16} /> Filtros
          </h3>
          <div className="row">
            <label className="field" style={{ flex: 1 }}>
              Conta
              <select value={filters.accountId} onChange={setFilter('accountId')}>
                <option value="">Todas</option>
                {(accounts || []).map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field" style={{ flex: 1 }}>
              Tipo
              <select value={filters.type} onChange={setFilter('type')}>
                <option value="">Todos</option>
                <option value="in">Entradas</option>
                <option value="out">Saídas</option>
              </select>
            </label>
            <label className="field" style={{ flex: 1 }}>
              De
              <input type="date" value={filters.from} onChange={setFilter('from')} />
            </label>
            <label className="field" style={{ flex: 1 }}>
              Até
              <input type="date" value={filters.to} onChange={setFilter('to')} />
            </label>
            <label className="field" style={{ flex: 2 }}>
              Buscar
              <input value={filters.q} onChange={setFilter('q')} placeholder="descrição…" />
            </label>
          </div>
        </div>

        <div className="card">
          <div className="table-wrap"><table className="table" data-testid="transactions-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Conta</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(data?.items || []).map((t) => (
                <tr key={t._id}>
                  <td className="muted">{dayLabel(t.date)}</td>
                  <td>{t.description}</td>
                  <td>
                    <span className="tag">{t.category}</span>
                  </td>
                  <td className="muted">{t.accountId?.name || '—'}</td>
                  <td
                    style={{ textAlign: 'right', fontWeight: 700 }}
                    className={t.type === 'in' ? 'money-in' : 'money-out'}
                  >
                    {t.type === 'in' ? '+' : '−'} {brl(t.amount)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn ghost danger"
                      title="Excluir"
                      onClick={() => remove.mutate(t._id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && (data?.items || []).length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">
                    Nenhum lançamento encontrado. Importe um extrato ou crie um manual.
                  </td>
                </tr>
              )}
            </tbody>
          </table></div>
          {data && data.pages > 1 && (
            <div className="row" style={{ justifyContent: 'center', marginTop: 14 }}>
              <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </button>
              <span className="muted">
                Página {data.page} de {data.pages} · {data.total} lançamentos
              </span>
              <button className="btn" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
                Próxima
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

