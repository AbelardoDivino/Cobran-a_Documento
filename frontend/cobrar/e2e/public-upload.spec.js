// Etapa 4 — E2E do upload público (Playwright).
// Pré-requisitos: backend em http://localhost:4000 e frontend em http://localhost:3000.
// Cria um pedido via API, abre /u/:token sem sessão e faz upload de um arquivo.
const { test, expect } = require('@playwright/test');

const API = process.env.API_URL || 'http://localhost:4000';
const WEB = process.env.WEB_URL || 'http://localhost:3000';

test('upload público sem login muda status para recebido', async ({ page, request }) => {
  const email = `e2e-${Date.now()}@teste.com`;
  await request.post(`${API}/api/auth/register`, {
    data: { name: 'E2E Contador', email, password: '123456' },
  });
  const login = await request.post(`${API}/api/auth/login`, {
    data: { email, password: '123456' },
  });
  const { accessToken } = await login.json();

  const cli = await request.post(`${API}/api/clients`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { name: 'Empresa E2E', email: 'emp@e2e.com' },
  });
  const client = await cli.json();

  const ped = await request.post(`${API}/api/requests`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      clientId: client._id,
      competencia: '2026-09',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      items: ['Extrato bancário'],
    },
  });
  const { request: docRequest } = await ped.json();

  // sem nenhum cookie de sessão
  await page.context().clearCookies();
  await page.goto(`${WEB}/u/${docRequest.publicToken}`);
  await expect(page.getByText('Extrato bancário')).toBeVisible();
  await expect(page.getByText(/enviado diretamente/i)).toBeVisible();

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: 'extrato.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 fake e2e'),
  });
  await expect(page.getByText('recebido')).toBeVisible({ timeout: 15000 });
});
