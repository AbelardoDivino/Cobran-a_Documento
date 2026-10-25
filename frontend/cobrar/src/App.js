import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import useAuth from './hooks/useAuth';
import Landing from './pages/Landing';
import Login from './pages/Login';
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
            <Route path="/register" element={<Register />} />
            <Route path="/privacidade" element={<Privacy />} />
            <Route path="/termos" element={<Terms />} />
            <Route path="/dashboard" element={<Private><Dashboard /></Private>} />
            <Route path="/clients/:id" element={<Private><ClientDetail /></Private>} />
            <Route
              path="/clients/:id/requests/new"
              element={<Private><NewRequest /></Private>}
            />
            <Route path="/u/:token" element={<PublicUpload />} />
            <Route path="/billing" element={<Private><Billing /></Private>} />
            <Route path="/financas" element={<Private><Finances /></Private>} />
            <Route path="/financas/contas" element={<Private><FinancesAccounts /></Private>} />
            <Route
              path="/financas/lancamentos"
              element={<Private><FinancesTransactions /></Private>}
            />
            <Route path="/financas/importar" element={<Private><FinancesImport /></Private>} />
            <Route path="/equipe" element={<Private><Team /></Private>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
