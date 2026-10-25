import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export function useClients() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ['clients'],
    queryFn: async () => (await api.get('/api/clients')).data,
  });
  const create = useMutation({
    mutationFn: async (payload) => (await api.post('/api/clients', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
  return { list, create };
}

export function useClient(id) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: async () => (await api.get(`/api/clients/${id}`)).data,
    enabled: !!id,
  });
}
