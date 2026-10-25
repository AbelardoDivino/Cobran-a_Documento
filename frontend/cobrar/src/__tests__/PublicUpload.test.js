import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PublicUpload from '../pages/PublicUpload';

jest.mock('../hooks/useRequest', () => ({
  __esModule: true,
  usePublicRequest: () => ({
    data: {
      competencia: '2026-09',
      dueDate: new Date().toISOString(),
      items: [
        { id: '1', label: 'Extrato bancário', status: 'pending' },
        { id: '2', label: 'Notas fiscais', status: 'pending' },
        { id: '3', label: 'Recibos', status: 'pending' },
      ],
    },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
  useRequest: () => ({}),
}));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ token: 'fake-token' }),
}));

test('Etapa 3/4 — checklist público exibe 3 itens pendentes + aviso LGPD', () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <PublicUpload />
      </MemoryRouter>
    </QueryClientProvider>
  );
  expect(screen.getAllByText('pendente')).toHaveLength(3);
  expect(screen.getByText(/enviado diretamente para o seu escritório/i)).toBeInTheDocument();
});
