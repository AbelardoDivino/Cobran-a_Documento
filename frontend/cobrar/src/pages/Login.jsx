import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import AuthLayout from './AuthLayout';
import GoogleSignInButton from '../components/GoogleSignInButton';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
});

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const verified = searchParams.get('verified');
  const [error, setError] = useState('');
  const [pendingGoogle, setPendingGoogle] = useState(null);
  const [tipo, setTipo] = useState('personal');
  const [officeName, setOfficeName] = useState('');
  const [companyCnpj, setCompanyCnpj] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [savingGoogle, setSavingGoogle] = useState(false);
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setError('');
    try {
      await login(values.email, values.password);
      navigate('/financas');
    } catch (e) {
      if (e?.response?.status === 429) {
        setError('Muitas tentativas de login. Aguarde 15 minutos e tente de novo.');
      } else {
        setError('Credenciais inválidas. Verifique e tente de novo.');
      }
    }
  };

  const onGoogle = async (idToken) => {
    setError('');
    setGoogleError('');
    try {
      await loginWithGoogle(idToken);
      navigate('/financas');
    } catch (e) {
      if (e?.response?.data?.code === 'ACCOUNT_TYPE_REQUIRED') {
        setPendingGoogle(idToken);
        return;
      }
      const apiMsg = e?.response?.data?.error;
      setError(apiMsg ? `Não foi possível entrar com o Google: ${apiMsg}` : 'Não foi possível entrar com o Google. Tente de novo.');
    }
  };

  const finishGoogle = async (event) => {
    event.preventDefault();
    setGoogleError('');
    if (tipo === 'business' && officeName.trim().length < 2) {
      setGoogleError('Informe o nome da empresa');
      return;
    }
    setSavingGoogle(true);
    try {
      await loginWithGoogle(pendingGoogle, {
        accountType: tipo,
        officeName: tipo === 'business' ? officeName.trim() : '',
        companyCnpj: tipo === 'business' ? companyCnpj.trim() : '',
      });
      navigate('/financas');
    } catch (e) {
      setGoogleError(e?.response?.data?.error || 'Não foi possível concluir o cadastro.');
    } finally {
      setSavingGoogle(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Sua conta"
      title="Entrar"
      sub="Acesse o saldo, os lançamentos e o mês fechado."
      switchText="Ainda não tem conta?"
      switchLink="/register"
      switchLabel="Criar conta"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        {verified === '1' && <p className="auth-ok">E-mail confirmado. Faça login para continuar.</p>}
        {verified === '0' && (
          <p className="error">Link inválido ou expirado. Entre e peça um novo link.</p>
        )}
        <label className="field">
          E-mail
          <input type="email" placeholder="voce@exemplo.com" {...register('email')} data-testid="email" />
          {formState.errors.email && <span className="error">{formState.errors.email.message}</span>}
        </label>
        <label className="field">
          Senha
          <input type="password" placeholder="Sua senha" {...register('password')} data-testid="password" />
        </label>
        {error && <p className="error" data-testid="login-error">{error}</p>}
        <button className="btn primary" type="submit" data-testid="submit">
          Entrar
        </button>
      </form>
      <div className="auth-divider">
        <span>ou</span>
      </div>
      {!pendingGoogle && (
        <GoogleSignInButton
          onSuccess={onGoogle}
          onError={() => setError('Não foi possível entrar com o Google. Tente de novo.')}
        />
      )}
      {pendingGoogle && (
        <form className="google-type" onSubmit={finishGoogle} data-testid="google-type">
          <h3>Primeiro acesso com Google</h3>
          <p className="muted">Como você vai usar o Portal do Contador?</p>
          <div className="seg" role="group" aria-label="Tipo de conta">
            <button
              type="button"
              className={tipo === 'personal' ? 'on' : ''}
              onClick={() => setTipo('personal')}
            >
              Pessoal
            </button>
            <button
              type="button"
              className={tipo === 'business' ? 'on' : ''}
              onClick={() => setTipo('business')}
            >
              Empresa
            </button>
          </div>
          {tipo === 'business' && (
            <>
              <label className="field">
                Nome da empresa
                <input
                  value={officeName}
                  onChange={(e) => setOfficeName(e.target.value)}
                  placeholder="Escritório Silva"
                  data-testid="google-office"
                />
              </label>
              <label className="field">
                CNPJ (opcional)
                <input
                  value={companyCnpj}
                  onChange={(e) => setCompanyCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  data-testid="google-cnpj"
                />
              </label>
            </>
          )}
          {googleError && (
            <p className="error" data-testid="google-type-error">
              {googleError}
            </p>
          )}
          <div className="google-type-actions">
            <button className="btn primary" type="submit" disabled={savingGoogle} data-testid="google-type-continue">
              {savingGoogle ? 'Entrando...' : 'Continuar'}
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => {
                setPendingGoogle(null);
                setGoogleError('');
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
