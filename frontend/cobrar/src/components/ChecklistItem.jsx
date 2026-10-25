import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import StatusBadge from './StatusBadge';
import UploadDropzone from './UploadDropzone';

export default function ChecklistItem({ item, onUpload, uploading, publicMode }) {
  const needsUpload = item.status === 'pending' || item.status === 'rejected';
  return (
    <div className="card item" data-testid={`item-${item.id || item._id}`}>
      <div className="item-head">
        <strong>{item.label}</strong>
        <StatusBadge status={item.status} />
      </div>
      {item.status === 'rejected' && item.rejectReason && (
        <p className="reject">O contador pediu ajuste: {item.rejectReason}</p>
      )}
      {needsUpload && <UploadDropzone onFile={(f) => onUpload(item, f)} disabled={uploading} />}
      {uploading && <div className="spin" />}
      {item.status === 'approved' && (
        <p className="ok-line">
          <CheckCircle2 size={16} style={{ verticalAlign: -3 }} /> Documento aprovado
        </p>
      )}
      {!publicMode && item.status === 'received' && (
        <p className="muted">Aguardando sua revisão (aprovar ou rejeitar).</p>
      )}
    </div>
  );
}
