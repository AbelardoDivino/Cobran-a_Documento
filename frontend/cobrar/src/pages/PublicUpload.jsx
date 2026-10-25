import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, CalendarDays, PartyPopper } from 'lucide-react';
import { BrandMark } from '../components/Sidebar';
import ChecklistItem from '../components/ChecklistItem';
import { usePublicRequest } from '../hooks/useRequest';
import api from '../services/api';

export default function PublicUpload() {
  const { token } = useParams();
  const { data, isLoading, isError, refetch } = usePublicRequest(token);
  const [uploading, setUploading] = useState(null);
  const [error, setError] = useState('');

  const upload = async (item, file) => {
    const id = item.id || item._id;
    setUploading(id);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.post(`/api/public/requests/${token}/items/${id}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refetch();
    } catch (e) {
      setError(e?.response?.data?.error || 'Não foi possível enviar o arquivo. Tente novamente.');
    } finally {
      setUploading(null);
    }
  };

  if (isLoading)
    return (
      <div className="public">
        <div className="spin" />
      </div>
    );
  if (isError || !data)
    return (
      <div className="public">
        <div className="card">
          <h1>Link inválido</h1>
          <p className="muted">
            Este pedido não foi encontrado. Confira o link com o seu contador.
          </p>
        </div>
      </div>
    );

  const items = data.items || [];
  const done = items.filter((i) => ['received', 'approved'].includes(i.status)).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;
  const allDone = items.length > 0 && done === items.length;

  return (
    <div className="public">
      <div className="public-top">
        <div className="brand-row">
          <BrandMark /> Portal do Contador
        </div>
        <h1>Olá! Envie seus documentos de {data.competencia}</h1>
        <span className="due">
          <CalendarDays size={15} /> Prazo: {new Date(data.dueDate).toLocaleDateString('pt-BR')}
        </span>
        <div className="progress">
          <i style={{ width: `${pct}%` }} />
        </div>
        <p style={{ margin: '10px 0 0', fontSize: '0.88rem', color: '#c9d4cb' }}>
          {done} de {items.length} documentos enviados
        </p>
      </div>

      <div className="privacy">
        <ShieldCheck />
        <span>
          Este documento é enviado diretamente para o seu escritório contábil e usado
          apenas para a contabilidade do seu negócio.
        </span>
      </div>

      {allDone && (
        <div className="card" style={{ borderColor: '#9fd8b4', background: '#f0faf3' }}>
          <p className="ok-line" style={{ margin: 0 }}>
            <PartyPopper size={16} style={{ verticalAlign: -3 }} /> Tudo enviado! O contador
            já foi avisado. Obrigado.
          </p>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {items.map((item) => (
        <ChecklistItem
          key={item.id}
          item={item}
          publicMode
          uploading={uploading === item.id}
          onUpload={upload}
        />
      ))}
    </div>
  );
}
