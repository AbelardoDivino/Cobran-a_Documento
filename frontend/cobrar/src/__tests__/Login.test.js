import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';

const mockLogin = jest.fn();
const mockLoginWithGoogle = jest.fn();
jest.mock('../hooks/useAuth', () => ({
  __esModule: true,
  default: () => ({ login: mockLogin, loginWithGoogle: mockLoginWithGoogle }),
}));

jest.mock('../components/GoogleSignInButton', () => (props) => (
  <button data-testid="google" onClick={() => props.onSuccess('fake-token')}>
    Google
  </button>
));

function setup() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

test('Etapa 1 — login válido chama a API e erro inválido aparece sem redirecionar', async () => {
  mockLogin.mockResolvedValueOnce({ accessToken: 'abc' });
  setup();
  fireEvent.change(screen.getByTestId('email'), { target: { value: 'c@c.com' } });
  fireEvent.change(screen.getByTestId('password'), { target: { value: '123456' } });
  fireEvent.click(screen.getByTestId('submit'));
  await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('c@c.com', '123456'));

  mockLogin.mockRejectedValueOnce(new Error('401'));
  fireEvent.click(screen.getByTestId('submit'));
  await waitFor(() => expect(screen.getByTestId('login-error')).toBeInTheDocument());
});

test('Google novo pede tipo de conta e envia os dados empresariais', async () => {
  mockLoginWithGoogle.mockRejectedValueOnce({
    response: { status: 428, data: { code: 'ACCOUNT_TYPE_REQUIRED' } },
  });
  mockLoginWithGoogle.mockResolvedValueOnce({ accessToken: 'abc' });
  setup();

  fireEvent.click(screen.getByTestId('google'));
  await waitFor(() => expect(screen.getByTestId('google-type')).toBeInTheDocument());
  expect(mockLoginWithGoogle).toHaveBeenCalledWith('fake-token');

  fireEvent.click(screen.getByText('Empresa'));
  fireEvent.change(screen.getByTestId('google-office'), { target: { value: 'Escritorio Silva' } });
  fireEvent.change(screen.getByTestId('google-cnpj'), { target: { value: '12345678000190' } });
  fireEvent.click(screen.getByTestId('google-type-continue'));

  await waitFor(() =>
    expect(mockLoginWithGoogle).toHaveBeenLastCalledWith('fake-token', {
      accountType: 'business',
      officeName: 'Escritorio Silva',
      companyCnpj: '12345678000190',
    })
  );
});

test('Google empresarial sem nome da empresa mostra erro', async () => {
  mockLoginWithGoogle.mockRejectedValueOnce({
    response: { status: 428, data: { code: 'ACCOUNT_TYPE_REQUIRED' } },
  });
  setup();
  fireEvent.click(screen.getByTestId('google'));
  await waitFor(() => expect(screen.getByTestId('google-type')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Empresa'));
  fireEvent.click(screen.getByTestId('google-type-continue'));
  await waitFor(() => expect(screen.getByTestId('google-type-error')).toHaveTextContent('nome da empresa'));
});
