import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Finances from '../pages/Finances';
import Team from '../pages/Team';

jest.mock('../hooks/useFinance', () => ({
  __esModule: true,
  useFinanceOverview: () => ({
    data: {
      totals: { income: 5000, expense: 1250.5, net: 3749.5, balance: 8749.5 },
      byCategory: [
        { category: 'Alimentação', total: 900, count: 4 },
        { category: 'Impostos', total: 350.5, count: 1 },
      ],
      monthly: [{ month: '2026-09', in: 4000, out: 2000 }],
      accounts: [{ id: 'a1', name: 'Conta PJ', bank: 'BB', balance: 8749.5 }],
    },
    isLoading: false,
    error: null,
  }),
  useAccounts: () => ({ data: [{ _id: 'a1', name: 'Conta PJ', bank: 'BB' }] }),
}));
jest.mock('../hooks/useWorkspace', () => ({
  __esModule: true,
  useWorkspace: () => ({
    data: {
      workspace: { tier: 'begin' },
      me: { role: 'owner' },
      limits: { members: 1, banks: null },
      members: [
        { id: 'm1', name: 'Ana', email: 'ana@t.com', role: 'owner', status: 'active' },
        { id: 'm2', name: '', email: 'socio@t.com', role: 'member', status: 'invited' },
      ],
    },
    isLoading: false,
  }),
  useInviteMember: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useRemoveMember: () => ({ mutate: jest.fn() }),
  useSetTier: () => ({ mutate: jest.fn() }),
}));
jest.mock('../hooks/useAuth', () => ({
  __esModule: true,
  default: () => ({ user: { name: 'Ana', email: 'ana@t.com' }, logout: jest.fn() }),
}));
jest.mock('../components/Sidebar', () => ({
  __esModule: true,
  default: () => <aside data-testid="sidebar" />,
  BrandMark: () => null,
}));

function wrap(ui) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

test('dashboard financeiro mostra saldo, categorias e contas', () => {
  wrap(<Finances />);
  expect(screen.getByText('Finanças')).toBeInTheDocument();
  expect(screen.getByText('Para onde foi o dinheiro')).toBeInTheDocument();
  expect(screen.getAllByText('Alimentação').length).toBeGreaterThan(0);
  expect(screen.getByText('Conta PJ')).toBeInTheDocument();
  expect(screen.getAllByText(/R\$\s*8\.749,50/).length).toBeGreaterThan(0);
});

test('equipe mostra membros, plano e limites', () => {
  wrap(<Team />);
  expect(screen.getByText('Equipe')).toBeInTheDocument();
  expect(screen.getByText('ana@t.com')).toBeInTheDocument();
  expect(screen.getByText('socio@t.com')).toBeInTheDocument();
  expect(screen.getByText('Convidado')).toBeInTheDocument();
  expect(screen.getByText('Plano atual')).toBeInTheDocument();
});
