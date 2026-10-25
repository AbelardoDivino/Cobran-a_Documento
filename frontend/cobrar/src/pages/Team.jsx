import React, { useState } from 'react';
import { Users, UserPlus, Trash2, Sparkles, ArrowRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { Link } from 'react-router-dom';
import { useWorkspace, useInviteMember, useRemoveMember } from '../hooks/useWorkspace';

export default function Team() {
  const { data, isLoading } = useWorkspace();
  const invite = useInviteMember();
  const remove = useRemoveMember();
  const [form, setForm] = useState({ email: '', name: '' });
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const tier = data?.workspace?.tier || 'begin';
  const isOwner = data?.me?.role === 'owner';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      const member = await invite.mutateAsync(form);
      setOk(
        member.status === 'invited'
          ? `Convite registrado para ${member.email}. Ao criar a conta com esse e-mail, a pessoa entra automaticamente.`
          : `${member.name || member.email} entrou no workspace.`
      );
      setForm({ email: '', name: '' });
    } catch (err) {
      setError(err?.response?.data?.error || 'Não foi possível convidar.');
    }
  };

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <div className="page-head">
          <div>
            <h1>Equipe</h1>
            <p>Quem pode lançar e acompanhar as finanças deste workspace.</p>
          </div>
        </div>

        <div className="stats">
          <div className="stat">
            <div className="num">{data?.members?.length ?? 0}</div>
            <div className="lbl">
              <Users size={13} /> Pessoas no workspace
            </div>
          </div>
          <div className="stat">
            <div className="num" style={{ textTransform: 'capitalize' }}>
              {tier}
            </div>
            <div className="lbl">Plano atual</div>
          </div>
          <div className="stat">
            <div className="num">{data?.limits?.members ?? 1}</div>
            <div className="lbl">Limite de pessoas</div>
          </div>
          <div className="stat">
            <div className="num">∞</div>
            <div className="lbl">Contas bancárias</div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>
            <Sparkles size={17} /> Planos
          </h3>
          <div className="plans">
            <div className={`plan${tier === 'begin' ? ' sel' : ''}`}>
              <span className="pname">Begin</span>
              <div className="pprice">1 pessoa</div>
              <span className="pper">bancos ilimitados · R$ 40/mês</span>
            </div>
            <div className={`plan${tier === 'pro' ? ' sel' : ''}`}>
              <span className="pname">Pro</span>
              <div className="pprice">10 pessoas</div>
              <span className="pper">bancos ilimitados · R$ 90/mês</span>
            </div>
          </div>
          <p className="muted" style={{ marginBottom: isOwner && tier !== 'pro' ? 12 : 0 }}>
            O Pro é liberado automaticamente após a confirmação do pagamento.
            {!isOwner && ' Somente o dono do espaço pode assinar.'}
          </p>
          {isOwner && tier !== 'pro' && (
            <Link className="btn primary" to="/billing">
              Assinar o Pro <ArrowRight size={16} />
            </Link>
          )}
        </div>

        {isOwner && (
          <form className="card" onSubmit={submit}>
            <h3 style={{ marginTop: 0 }}>
              <UserPlus size={17} /> Convidar pessoa
            </h3>
            <div className="row">
              <label className="field" style={{ flex: 2 }}>
                E-mail
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="socio@escritorio.com.br"
                  required
                />
              </label>
              <label className="field" style={{ flex: 2 }}>
                Nome (opcional)
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </label>
            </div>
            {error && <p className="error">{error}</p>}
            {ok && <p className="ok-line">{ok}</p>}
            <button className="btn primary" type="submit" disabled={invite.isPending}>
              <UserPlus size={16} /> {invite.isPending ? 'Convidando…' : 'Convidar'}
            </button>
          </form>
        )}

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Membros</h3>
          {isLoading && <p className="muted">Carregando…</p>}
          <div className="table-wrap"><table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Papel</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(data?.members || []).map((m) => (
                <tr key={m.id}>
                  <td>{m.name || '—'}</td>
                  <td className="muted">{m.email}</td>
                  <td>
                    <span className="tag">{m.role === 'owner' ? 'Dono' : 'Membro'}</span>
                  </td>
                  <td className="muted">{m.status === 'active' ? 'Ativo' : 'Convidado'}</td>
                  <td style={{ textAlign: 'right' }}>
                    {isOwner && m.role !== 'owner' && (
                      <button
                        className="btn ghost danger"
                        title="Remover"
                        onClick={() => remove.mutate(m.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      </main>
    </div>
  );
}

