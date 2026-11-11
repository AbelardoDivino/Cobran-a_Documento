import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useBilling } from '../hooks/useBilling';

const ADMIN_EMAIL = 'admin@teste.com';

export default function RequirePaid({ children }) {
  const { user } = useAuth();
  const { status } = useBilling();

  if (user?.email === ADMIN_EMAIL) return children;

  if (status.isLoading) {
    return <div className="spin" style={{ margin: '40px auto' }} />;
  }

  const sub = status.data?.subscription;
  const active = sub && sub.status === 'active';
  if (!active) {
    return <Navigate to="/billing" replace />;
  }
  return children;
}
