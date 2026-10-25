import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../pages/Dashboard';

const mockCreate = jest.fn();
jest.mock('../hooks/useClients', () => ({
  __esModule: true,
  useClients: () => ({
    list: { data: [{ _id: '1', name: 'Empresa X', email: 'x@x.com' }], isLoading: false },
    create: { mutateAsync: mockCreate },
  }),
  useClient: () => ({ data: null }),
}));
jest.mock('../hooks/useAuth', () => ({
  __esModule: true,
  default: () => ({ user: { email: 'c@c.com' }, logout: jest.fn() }),
}));

test('Etapa 2 — Dashboard lista clientes e criar dispara a API', async () => {
  mockCreate.mockResolvedValueOnce({ _id: '2' });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </QueryClientProvider>
  );
  expect(screen.getByText('Empresa X')).toBeInTheDocument();
  fireEvent.click(screen.getByTestId('client-submit'));
  fireEvent.change(screen.getByTestId('client-name'), { target: { value: 'Empresa Y' } });
  fireEvent.click(screen.getByText('Salvar cliente'));
  await waitFor(() => expect(mockCreate).toHaveBeenCalled());
});
