import { render, screen } from '@testing-library/react';
import App from './App';

test('App renderiza sem quebrar e expõe a tela de login', () => {
  render(<App />);
  expect(screen.getAllByText(/entrar/i).length).toBeGreaterThan(0);
});
