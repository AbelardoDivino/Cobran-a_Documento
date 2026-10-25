import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import AuthLayout from './AuthLayout';

const schema = z
  .object({
    accountType: z.enum(['personal', 'business']),
    name: z.string().min(2, 'Nome muito curto'),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    officeName: z.string().optional(),
    companyCnpj: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.accountType === 'business' && (!v.officeName || v.officeName.trim().length < 2)) {
      ctx.addIssue({ code: 'custom', path: ['officeName'], message: 'Informe o nome da empresa' });
    }
  });

export default function Register() {
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState('');
  const { register, handleSubmit, watch, setValue, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { accountType: 'personal' },
  });
  const tipo = watch('accountType');

  const onSubmit = async (values) => {
    setError('');
    try {
      await signup({
        ...values,
        officeName: values.accountType === 'business' ? values.officeName : '',
        companyCnpj: values.accountType === 'business' ? values.companyCnpj : '',
      });
      navigate(params.get('plano') === 'pro' ? '/billing' : '/financas');
    } catch (err) {
      setError(err?.response?.data?.error || 'Não foi possível criar a conta. Tente outro e-mail.');
    }
  };

  return (
    <AuthLayout
      eyebrow="Comece agora"
      title="Criar conta"
      sub="A partir de R$ 40/mês. Sem instalação e sem fidelidade."
      switchText="Já tem conta?"
      switchLink="/login"
      switchLabel="Entrar"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" {...register('accountType')} />
        <div className="seg" role="group" aria-label="Tipo de conta">
          <button
            type="button"
            className={tipo === 'personal' ? 'on' : ''}
            onClick={() => setValue('accountType', 'personal')}
          >
            Uso pessoal
          </button>
          <button
            type="button"
            className={tipo === 'business' ? 'on' : ''}
            onClick={() => setValue('accountType', 'business')}
          >
            Empresa
          </button>
        </div>

        <label className="field">
          Seu nome
          <input placeholder="Maria Silva" {...register('name')} />
          {formState.errors.name && <span className="error">{formState.errors.name.message}</span>}
        </label>

        {tipo === 'business' && (
          <div className="row">
            <label className="field" style={{ flex: 2 }}>
              Empresa
              <input placeholder="Silva Contabilidade" {...register('officeName')} />
              {formState.errors.officeName && (
                <span className="error">{formState.errors.officeName.message}</span>
              )}
            </label>
            <label className="field" style={{ flex: 1 }}>
              CNPJ
              <input placeholder="00.000.000/0000-00" {...register('companyCnpj')} />
            </label>
          </div>
        )}

        <label className="field">
          E-mail
          <input type="email" placeholder="voce@exemplo.com" {...register('email')} />
          {formState.errors.email && <span className="error">{formState.errors.email.message}</span>}
        </label>
        <label className="field">
          Senha
          <input type="password" placeholder="Mínimo 8 caracteres" {...register('password')} />
          {formState.errors.password && (
            <span className="error">{formState.errors.password.message}</span>
          )}
        </label>

        {error && <p className="error">{error}</p>}
        <button className="btn primary" type="submit">
          Criar conta
        </button>
        <p className="auth-terms">
          Ao criar a conta você concorda com o uso dos seus dados para operar o serviço (LGPD).
          Veja a <Link to="/privacidade">Política de Privacidade</Link> e os{' '}
          <Link to="/termos">Termos de Uso</Link>.
        </p>
      </form>
    </AuthLayout>
  );
}
