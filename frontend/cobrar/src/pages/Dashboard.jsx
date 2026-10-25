import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus, ChevronRight, Building2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useClients } from '../hooks/useClients';

export default function Dashboard() {
  const { list, create } = useClients();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const clients = list.data || [];

  const submit = async (e) => {
    e.preventDefault();
    await create.mutateAsync(form);
    setForm({ name: '', email: '', phone: '' });
    setOpen(false);
  };

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <div className="page-head">
          <div>
            <h1>Clientes</h1>
            <p>Quem tem documento a enviar aparece aqui — sem planilha.</p>
          </div>
          <div className="page-actions">
            <button className="btn primary" onClick={() => setOpen((v) => !v)} data-testid="client-submit">
              <UserPlus /> Novo cliente
            </button>
          </div>
        </div>

        <div className="stats">
          <div className="stat">
            <div className="num">{clients.length}</div>
            <div className="lbl">clientes ativos</div>
          </div>
          <div className="stat">
            <div className="num">—</div>
            <div className="lbl">pedidos no mês</div>
          </div>
          <div className="stat">
            <div className="num">—</div>
            <div className="lbl">documentos pendentes</div>
          </div>
        </div>

        {open && (
          <form className="card" onSubmit={submit}>
            <h2>Cadastrar cliente</h2>
            <div className="row">
              <input
                placeholder="Nome da empresa"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                data-testid="client-name"
              />
              <input
                placeholder="E-mail"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <input
                placeholder="WhatsApp / telefone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn primary" type="submit">
                Salvar cliente
              </button>
              <button className="btn ghost" type="button" onClick={() => setOpen(false)}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {list.isLoading && <div className="spin" />}
        {!list.isLoading && clients.length === 0 && (
          <div className="empty">
            <Users />
            <p>
              <strong>Nenhum cliente ainda.</strong>
              <br />
              Cadastre o primeiro para gerar o link de documentos.
            </p>
          </div>
        )}
        <div className="client-grid" data-testid="client-list">
          {clients.map((c) => (
            <Link to={`/clients/${c._id}`} key={c._id} className="client-card">
              <span className="avatar">
                <Building2 size={20} />
              </span>
              <span>
                <strong>{c.name}</strong>
                <span>{c.email}</span>
              </span>
              <ChevronRight className="go" size={20} />
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
