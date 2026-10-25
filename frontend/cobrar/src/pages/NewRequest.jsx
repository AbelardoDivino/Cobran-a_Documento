import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useRequest } from '../hooks/useRequest';

export default function NewRequest() {
  const { id: clientId } = useParams();
  const navigate = useNavigate();
  const { create } = useRequest();
  const [error, setError] = useState('');
  const { register, control, handleSubmit } = useForm({
    defaultValues: {
      competencia: '2026-09',
      dueDate: '',
      items: [{ label: 'Extrato bancário' }, { label: 'Notas fiscais emitidas' }, { label: 'Recibos e comprovantes' }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const onSubmit = async (values) => {
    setError('');
    try {
      const payload = {
        clientId,
        competencia: values.competencia,
        dueDate: values.dueDate,
        items: values.items.map((i) => i.label).filter(Boolean),
      };
      const data = await create.mutateAsync(payload);
      navigate(`/clients/${clientId}?request=${data.request._id}`);
    } catch {
      setError('Não foi possível criar o pedido. Confira os campos.');
    }
  };

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <div className="page-head">
          <div>
            <h1>Novo pedido</h1>
            <p>Monte o checklist da competência e gere o link do cliente.</p>
          </div>
          <div className="page-actions">
            <Link className="btn ghost" to={`/clients/${clientId}`}>
              <ArrowLeft size={16} /> Voltar
            </Link>
          </div>
        </div>
        <form className="card" onSubmit={handleSubmit(onSubmit)}>
          <div className="row">
            <label className="field" style={{ flex: 1 }}>
              Competência (AAAA-MM)
              <input {...register('competencia')} data-testid="competencia" />
            </label>
            <label className="field" style={{ flex: 1 }}>
              Prazo para o cliente
              <input type="date" {...register('dueDate')} data-testid="duedate" />
            </label>
          </div>
          <h3>O que pedir ao cliente</h3>
          {fields.map((f, i) => (
            <div className="row" key={f.id} style={{ marginBottom: 10 }}>
              <input {...register(`items.${i}.label`)} data-testid={`item-${i}`} placeholder="Ex.: Extrato bancário" />
              <button
                type="button"
                className="btn danger"
                onClick={() => remove(i)}
                title="Remover item"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button type="button" className="btn" onClick={() => append({ label: '' })}>
            <Plus size={16} /> Adicionar item
          </button>
          {error && <p className="error" style={{ marginTop: 14 }}>{error}</p>}
          <div style={{ marginTop: 18 }}>
            <button className="btn primary" type="submit" data-testid="create-request">
              Criar pedido e gerar link
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
