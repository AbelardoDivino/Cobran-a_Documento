import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// Pedido do contador (autenticado), com refetch para refletir uploads do cliente
export function useRequest(id) {
  const qc = useQueryClient();
  const detail = useQuery({
    queryKey: ['request', id],
    queryFn: async () => (await api.get(`/api/requests/${id}`)).data,
    enabled: !!id,
    refetchInterval: 10000,
  });
  const create = useMutation({
    mutationFn: async (payload) => (await api.post('/api/requests', payload)).data,
  });
  const review = useMutation({
    mutationFn: async ({ requestId, itemId, ...body }) =>
      (await api.patch(`/api/requests/${requestId}/items/${itemId}`, body)).data,
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['request', v.requestId] }),
  });
  return { detail, create, review };
}

// Checklist público (sem login), com polling para refletir aprovação do contador
export function usePublicRequest(token) {
  return useQuery({
    queryKey: ['public-request', token],
    queryFn: async () => (await api.get(`/api/public/requests/${token}`)).data,
    enabled: !!token,
    refetchInterval: 8000,
  });
}
