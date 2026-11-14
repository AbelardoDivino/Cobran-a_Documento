import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import api from '../services/api';
import AuthLayout from './AuthLayout';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres');
      return;
    }
    setBusy(true);
    try {
      await api.post('/api/auth/reset-password', { token, password });
      setOk(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err?.response?.data?.error || 'Não foi possível redefinir a senha.');
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout eyebrow="Conta" title="Link inválido" sub="Token ausente.">
        <p className="error">Link inválido ou expirado.</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Conta"
      title="Redefinir senha"
      sub="Crie uma nova senha para sua conta."
      switchText=""
      switchLink="/login"
      switchLabel="Voltar ao login"
    >
      {ok ? (
        <p className="auth-ok">Senha redefinida! Redirecionando para o login...</p>
      ) : (
        <form onSubmit={submit}>
          <label className="field">
            Nova senha
            <div style={{ position: 'relative' }}>
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
              >
                {show ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? 'Salvando...' : 'Redefinir senha'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
