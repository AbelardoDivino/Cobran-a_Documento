import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export function useWorkspace() {
  return useQuery({
    queryKey: ['workspace'],
    queryFn: async () => (await api.get('/api/workspace')).data,
  });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/api/workspace/invite', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace'] }),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/api/workspace/members/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace'] }),
  });
}

export function useSetTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tier) => (await api.patch('/api/workspace/tier', { tier })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace'] }),
  });
}
