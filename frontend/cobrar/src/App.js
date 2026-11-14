import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import useAuth from './hooks/useAuth';
import RequirePaid from './components/RequirePaid';
import Landing from './pages/Landing';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ClientDetail from './pages/ClientDetail';
import NewRequest from './pages/NewRequest';
import PublicUpload from './pages/PublicUpload';
import Billing from './pages/Billing';
import Finances from './pages/Finances';
import FinancesAccounts from './pages/FinancesAccounts';
import FinancesTransactions from './pages/FinancesTransactions';
import FinancesImport from './pages/FinancesImport';
import Team from './pages/Team';
import TaxCalculator from './pages/TaxCalculator';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

const qc = new QueryClient();

function Private({ children }) {
  const { user } = useAuth();
  if (!user && !localStorage.getItem('accessToken')) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/register" element={<Register />} />
            <Route path="/privacidade" element={<Privacy />} />
            <Route path="/termos" element={<Terms />} />
            <Route path="/dashboard" element={<Private><RequirePaid><Dashboard /></RequirePaid></Private>} />
            <Route path="/clients/:id" element={<Private><RequirePaid><ClientDetail /></RequirePaid></Private>} />
            <Route
              path="/clients/:id/requests/new"
              element={<Private><RequirePaid><NewRequest /></RequirePaid></Private>}
            />
            <Route path="/u/:token" element={<PublicUpload />} />
            <Route path="/billing" element={<Private><Billing /></Private>} />
            <Route path="/financas" element={<Private><RequirePaid><Finances /></RequirePaid></Private>} />
            <Route path="/financas/contas" element={<Private><RequirePaid><FinancesAccounts /></RequirePaid></Private>} />
            <Route
              path="/financas/lancamentos"
              element={<Private><RequirePaid><FinancesTransactions /></RequirePaid></Private>}
            />
            <Route path="/financas/importar" element={<Private><RequirePaid><FinancesImport /></RequirePaid></Private>} />
            <Route path="/equipe" element={<Private><RequirePaid><Team /></RequirePaid></Private>} />
            <Route path="/impostos" element={<Private><RequirePaid><TaxCalculator /></RequirePaid></Private>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
