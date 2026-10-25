import React from 'react';
import clsx from 'clsx';

const LABELS = {
  pending: 'pendente',
  received: 'recebido',
  approved: 'aprovado',
  rejected: 'rejeitado',
  active: 'ativa',
  canceled: 'cancelada',
};

export default function StatusBadge({ status }) {
  return (
    <span className={clsx('badge', `badge-${status}`)} data-testid={`status-${status}`}>
      {LABELS[status] || status}
    </span>
  );
}
