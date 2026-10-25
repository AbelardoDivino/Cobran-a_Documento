import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Billing from '../pages/Billing';

jest.mock('../hooks/useBilling', () => ({
  __esModule: true,
  useBilling: () => ({
    status: { data: { subscription: { status: 'pending', plan: 'mensal', method: 'card' } } },
    subscribeCard: { mutateAsync: jest.fn(), isPending: false },
    chargePix: { mutateAsync: jest.fn(), isPending: false },
    chargeBoleto: { mutateAsync: jest.fn(), isPending: false },
  }),
}));
jest.mock('../hooks/useAuth', () => ({
  __esModule: true,
  default: () => ({ user: { email: 'c@c.com' }, logout: jest.fn() }),
}));
jest.mock('../components/PaymentBrickWrapper', () => ({
  __esModule: true,
  default: ({ method }) => <div data-testid="brick-stub">brick:{method}</div>,
}));

function renderBilling() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <Billing />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

test('trocar método mostra o painel certo (cartão, Pix e boleto)', () => {
  renderBilling();
  expect(screen.getByTestId('brick-stub')).toHaveTextContent('brick:card');

  fireEvent.click(screen.getByTestId('method-pix'));
  expect(screen.getByTestId('pix-panel')).toBeInTheDocument();
  expect(screen.getByTestId('create-pix')).toBeInTheDocument();
  expect(screen.queryByTestId('brick-stub')).not.toBeInTheDocument();

  fireEvent.click(screen.getByTestId('method-boleto'));
  expect(screen.getByTestId('boleto-panel')).toBeInTheDocument();
  expect(screen.getByLabelText(/^Nome$/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/CPF/i)).toBeInTheDocument();
  expect(screen.getByTestId('create-boleto')).toBeInTheDocument();
});
