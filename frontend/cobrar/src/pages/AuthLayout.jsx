import React from 'react';
import { Link } from 'react-router-dom';
import { Upload, Tags, Users, ArrowLeft } from 'lucide-react';
import { BrandMark } from '../components/Sidebar';

export default function AuthLayout({ eyebrow, title, sub, children, switchText, switchLink, switchLabel }) {
  return (
    <div className="auth-screen">
      <div className="auth-brand">
        <div className="brand-row">
          <BrandMark /> Portal do Contador
        </div>
        <div>
          <h2>O mês fecha. O saldo aparece. A planilha some.</h2>
          <p>
            Contas, lançamentos e extratos de banco no mesmo lugar. Categorias automáticas,
            saldo real por conta e um time inteiro olhando o mesmo número.
          </p>
          <ul className="auth-points">
            <li>
              <Upload /> Importe CSV ou OFX e não digite mais nada
            </li>
            <li>
              <Tags /> Categorias automáticas e resumo por mês
            </li>
            <li>
              <Users /> Espaço compartilhado com até 10 pessoas no Pro
            </li>
          </ul>
        </div>
        <div className="auth-foot">
          <Link to="/" className="auth-back">
            <ArrowLeft size={14} /> Voltar ao site
          </Link>
        </div>
      </div>
      <div className="auth-side">
        <div className="auth-card">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p className="sub">{sub}</p>
          {children}
          <p className="auth-switch">
            {switchText} <Link to={switchLink}>{switchLabel}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
