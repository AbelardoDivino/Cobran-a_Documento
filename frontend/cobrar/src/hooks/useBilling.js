import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';

export function useBilling() {
  const status = useQuery({
    queryKey: ['billing-status'],
    queryFn: async () => (await api.get('/api/billing/status')).data,
  });
  const subscribeCard = useMutation({
    mutationFn: async (payload) => (await api.post('/api/billing/subscribe/card', payload)).data,
    onSuccess: () => status.refetch(),
  });
  const chargePix = useMutation({
    mutationFn: async (payload) => (await api.post('/api/billing/charge/pix', payload)).data,
    onSuccess: () => status.refetch(),
  });
  const chargeBoleto = useMutation({
    mutationFn: async (payload) => (await api.post('/api/billing/charge/boleto', payload)).data,
    onSuccess: () => status.refetch(),
  });
  return { status, subscribeCard, chargePix, chargeBoleto };
}
