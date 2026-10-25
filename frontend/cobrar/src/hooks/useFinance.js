import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export function useFinanceOverview(params = {}) {
  return useQuery({
    queryKey: ['finance-overview', params],
    queryFn: async () => (await api.get('/api/finance/overview', { params })).data,
  });
}

export function useAccounts() {
  return useQuery({
    queryKey: ['finance-accounts'],
    queryFn: async () => (await api.get('/api/finance/accounts')).data,
  });
}

export function useTransactions(params = {}) {
  return useQuery({
    queryKey: ['finance-transactions', params],
    queryFn: async () => (await api.get('/api/finance/transactions', { params })).data,
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/api/finance/accounts', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-accounts'] });
      qc.invalidateQueries({ queryKey: ['finance-overview'] });
    },
  });
}

export function useArchiveAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/api/finance/accounts/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-accounts'] });
      qc.invalidateQueries({ queryKey: ['finance-overview'] });
    },
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/api/finance/transactions', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-transactions'] });
      qc.invalidateQueries({ queryKey: ['finance-overview'] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/api/finance/transactions/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-transactions'] });
      qc.invalidateQueries({ queryKey: ['finance-overview'] });
    },
  });
}

export function useImportStatement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/api/finance/import', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-transactions'] });
      qc.invalidateQueries({ queryKey: ['finance-overview'] });
      qc.invalidateQueries({ queryKey: ['finance-accounts'] });
    },
  });
}
