import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  LogOut,
  Wallet,
  Landmark,
  ListOrdered,
  Upload,
  Users,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';

export function BrandMark() {
  return <span className="brand-mark">C</span>;
}

const LINKS = [
  { to: '/financas', label: 'Visão geral', Icon: Wallet, group: 'Financeiro', short: 'Visão' },
  { to: '/financas/contas', label: 'Contas e bancos', Icon: Landmark, group: 'Financeiro', short: 'Contas' },
  { to: '/financas/lancamentos', label: 'Lançamentos', Icon: ListOrdered, group: 'Financeiro', short: 'Lançar' },
  { to: '/financas/importar', label: 'Importar extrato', Icon: Upload, group: 'Financeiro', short: 'Extrato' },
  { to: '/equipe', label: 'Equipe', Icon: Users, group: 'Financeiro', short: 'Equipe' },
  { to: '/dashboard', label: 'Clientes', Icon: LayoutDashboard, group: 'Documentos', short: 'Clientes' },
  { to: '/billing', label: 'Plano e assinatura', Icon: CreditCard, group: 'Conta', short: 'Plano' },
];

export default function Sidebar() {
  const { user, logout, resendVerification } = useAuth();
  const navigate = useNavigate();
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);
  const initial = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();
  const groups = [...new Set(LINKS.map((l) => l.group))];

  const resend = async () => {
    setResending(true);
    try {
      await resendVerification();
      setResent(true);
    } catch {
      setResent(false);
    } finally {
      setResending(false);
    }
  };

  const exit = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <div className="mobilebar">
        <Link to="/" className="brand-row" style={{ padding: 0 }}>
          <BrandMark /> Portal
        </Link>
        <nav>
          {LINKS.map(({ to, short }) => (
            <NavLink key={to} to={to} end={to === '/financas'} className={({ isActive }) => (isActive ? 'active' : '')}>
              {short}
            </NavLink>
          ))}
        </nav>
        <button onClick={exit} title="Sair" className="mobile-exit" aria-label="Sair">
          <LogOut size={16} />
        </button>
      </div>
      <aside className="sidebar">
        <Link to="/" className="brand-row">
          <BrandMark /> Portal do Contador
        </Link>
        {user && user.emailVerified === false && (
          <button
            type="button"
            className="side-link verify-email"
            onClick={resend}
            disabled={resending || resent}
            title="Confirme seu e-mail para aceitar convites com segurança"
          >
            {resent ? 'Link enviado' : resending ? 'Enviando...' : 'Confirme seu e-mail'}
          </button>
        )}
        {groups.map((group) => (
          <React.Fragment key={group}>
            <div className="side-label">{group.toUpperCase()}</div>
            {LINKS.filter((l) => l.group === group).map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/financas'}
                className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}
              >
                <Icon /> {label}
              </NavLink>
            ))}
          </React.Fragment>
        ))}
        <div className="side-foot">
          <span className="avatar">{initial}</span>
          <span className="who">
            {user?.name || user?.email}
            <em>{user?.accountType === 'business' ? user?.officeName || 'Empresa' : 'Conta pessoal'}</em>
          </span>
          <button onClick={exit} title="Sair">
            <LogOut size={15} />
          </button>
        </div>
      </aside>
    </>
  );
}

