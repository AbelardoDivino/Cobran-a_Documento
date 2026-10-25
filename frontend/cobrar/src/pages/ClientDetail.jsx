import React, { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Copy, Check, FileText, ExternalLink } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import { useClient } from '../hooks/useClients';
import { useRequest } from '../hooks/useRequest';
import api from '../services/api';

export default function ClientDetail() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const client = useClient(id);
  const [requestId, setRequestId] = useState(search.get('request') || '');
  const req = useRequest(requestId || null);
  const [reason, setReason] = useState({});
  const [copied, setCopied] = useState(false);
  const detail = req.detail.data;

  const review = async (item, status) => {
    await req.review.mutateAsync({
      requestId,
      itemId: item._id || item.id,
      status,
      rejectReason: reason[item._id] || '',
    });
  };

  const copyLink = () => {
    const url = `${window.location.origin}/u/${detail.request.publicToken}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Arquivos são privados: o download exige o token do contador.
  const fileHref = (fileUrl) => {
    const token = localStorage.getItem('accessToken') || '';
    return `${api.defaults.baseURL}${fileUrl}?token=${encodeURIComponent(token)}`;
  };

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <div className="page-head">
          <div>
            <h1>{client.data?.name || 'Cliente'}</h1>
            <p>{client.data?.email} {client.data?.phone ? `· ${client.data.phone}` : ''}</p>
          </div>
          <div className="page-actions">
            <Link className="btn primary" to={`/clients/${id}/requests/new`}>
              <Plus /> Novo pedido
            </Link>
          </div>
        </div>

        <div className="card">
          <label className="field" style={{ margin: 0 }}>
            Acompanhar pedido
            <input
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              placeholder="Cole aqui o ID do pedido criado"
              data-testid="request-id"
            />
          </label>
        </div>

        {req.detail.isLoading && <div className="spin" />}

        {detail && (
          <div data-testid="request-detail">
            <div className="card">
              <div className="item-head">
                <h2 style={{ margin: 0 }}>
                  Competência {detail.request.competencia} · vence{' '}
                  {new Date(detail.request.dueDate).toLocaleDateString('pt-BR')}
                </h2>
              </div>
              <p className="muted" style={{ marginTop: 10 }}>
                Envie este link ao cliente no WhatsApp ou e-mail — ele abre sem login:
              </p>
              <div className="row">
                <code style={{ flex: 1 }}>/u/{detail.request.publicToken}</code>
                <button className="btn dark" onClick={copyLink}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copiado!' : 'Copiar link'}
                </button>
              </div>
            </div>

            {detail.items.map((item) => (
              <div className="card item" key={item._id} data-testid={`detail-${item._id}`}>
                <div className="item-head">
                  <strong>{item.label}</strong>
                  <StatusBadge status={item.status} />
                </div>
                {item.fileUrl && (
                  <a
                    className="file-link"
                    href={fileHref(item.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FileText /> Ver arquivo enviado <ExternalLink size={14} />
                  </a>
                )}
                {item.status === 'received' && (
                  <div className="row" style={{ marginTop: 12 }}>
                    <button className="btn primary" onClick={() => review(item, 'approved')}>
                      Aprovar
                    </button>
                    <input
                      placeholder="Motivo, se for recusar…"
                      value={reason[item._id] || ''}
                      onChange={(e) => setReason({ ...reason, [item._id]: e.target.value })}
                    />
                    <button className="btn danger" onClick={() => review(item, 'rejected')}>
                      Pedir ajuste
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
