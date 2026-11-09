const repo = require('./finance.repository');
const workspaceService = require('../workspace/workspace.service');
const { parseStatement } = require('./import.parser');
const { categorize, CATEGORIES } = require('./categorizer');

const MAX_IMPORT_ROWS = 5000;
const MAX_CONTENT_BYTES = 3 * 1024 * 1024;

function startOfMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfDay(value) {
  const date = new Date(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    date.setUTCHours(23, 59, 59, 999);
  }
  return date;
}

function resolvePeriod({ from, to } = {}) {
  const now = new Date();
  const start = from ? new Date(from) : startOfMonth(now);
  const end = to ? endOfDay(to) : new Date(now.getTime());
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    const err = new Error('Período inválido');
    err.status = 400;
    throw err;
  }
  return { from: start, to: end };
}

async function getWorkspaceId(userId) {
  const { workspace } = await workspaceService.getContext(userId);
  return workspace._id;
}

async function overview(userId, query) {
  const workspaceId = await getWorkspaceId(userId);
  const period = resolvePeriod(query);
  return repo.summary(workspaceId, period);
}

async function listAccounts(userId) {
  const workspaceId = await getWorkspaceId(userId);
  return repo.listAccounts(workspaceId);
}

async function createAccount(userId, data) {
  const workspaceId = await getWorkspaceId(userId);
  if (!data.name || !String(data.name).trim()) {
    const err = new Error('Dê um nome para a conta');
    err.status = 400;
    throw err;
  }
  const raw = String(data.initialBalance ?? 0).trim();
  let normalized;
  if (raw.includes(',')) {
    normalized = raw.replace(/\./g, '').replace(',', '.');
  } else if ((raw.match(/\./g) || []).length > 1) {
    normalized = raw.replace(/\./g, '');
  } else {
    normalized = raw;
  }
  const initialBalance = Number(normalized) || 0;
  if (Number.isNaN(initialBalance)) {
    const err = new Error('Saldo inicial inválido');
    err.status = 400;
    throw err;
  }
  return repo.createAccount(workspaceId, {
    name: String(data.name).trim(),
    bank: data.bank ? String(data.bank).trim() : '',
    type: data.type || 'checking',
    initialBalance,
  });
}

async function updateAccount(userId, accountId, data) {
  const workspaceId = await getWorkspaceId(userId);
  const allowed = {};
  if (data.name !== undefined) allowed.name = String(data.name).trim();
  if (data.bank !== undefined) allowed.bank = String(data.bank).trim();
  if (data.type !== undefined) allowed.type = data.type;
  if (data.initialBalance !== undefined) {
    const value = Number(data.initialBalance);
    if (Number.isNaN(value)) {
      const err = new Error('Saldo inicial inválido');
      err.status = 400;
      throw err;
    }
    allowed.initialBalance = value;
  }
  return repo.updateAccount(workspaceId, accountId, allowed);
}

async function archiveAccount(userId, accountId) {
  const workspaceId = await getWorkspaceId(userId);
  return repo.archiveAccount(workspaceId, accountId);
}

async function listTransactions(userId, query) {
  const workspaceId = await getWorkspaceId(userId);
  const normalized = { ...query };
  if (query.from) normalized.from = new Date(query.from);
  if (query.to) normalized.to = endOfDay(query.to);
  return repo.listTransactions(workspaceId, normalized);
}

async function createTransaction(userId, data) {
  const workspaceId = await getWorkspaceId(userId);
  const account = await repo.getAccount(workspaceId, data.accountId);
  const amount = Math.abs(Number(String(data.amount ?? 0).replace(',', '.')) || 0);
  if (!data.date || Number.isNaN(amount) || amount === 0) {
    const err = new Error('Informe data, descrição e valor');
    err.status = 400;
    throw err;
  }
  const type = data.type === 'in' ? 'in' : 'out';
  const description = String(data.description || '').trim() || 'Lançamento';
  const doc = {
    workspaceId,
    accountId: account._id,
    date: new Date(data.date),
    description,
    amount,
    type,
    category: data.category || categorize(description, type),
    source: 'manual',
    externalId: null,
  };
  return require('../../models/Transaction').create(doc);
}

async function deleteTransaction(userId, id) {
  const workspaceId = await getWorkspaceId(userId);
  return repo.deleteTransaction(workspaceId, id);
}

async function exportXlsx(userId, query) {
  const workspaceId = await getWorkspaceId(userId);
  const period = resolvePeriod(query);
  const accounts = await repo.listAccounts(workspaceId);
  const txs = await repo.listTransactions(workspaceId, {
    from: period.from,
    to: period.to,
    accountId: query.accountId,
    type: query.type,
    limit: 100000,
  });

  const ExcelJS = require('exceljs');
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Portal do Contador';
  wb.created = new Date();

  // Aba 1: Lançamentos
  const ws = wb.addWorksheet('Lançamentos');
  ws.columns = [
    { header: 'Data', key: 'date', width: 12 },
    { header: 'Descrição', key: 'description', width: 40 },
    { header: 'Categoria', key: 'category', width: 18 },
    { header: 'Conta', key: 'account', width: 20 },
    { header: 'Tipo', key: 'type', width: 10 },
    { header: 'Valor (R$)', key: 'amount', width: 14 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const t of txs.items || []) {
    ws.addRow({
      date: new Date(t.date).toLocaleDateString('pt-BR'),
      description: t.description,
      category: t.category,
      account: t.accountId?.name || '—',
      type: t.type === 'in' ? 'Entrada' : 'Saída',
      amount: t.amount,
    });
  }
  // Totais
  const income = (txs.items || []).filter((t) => t.type === 'in').reduce((s, t) => s + t.amount, 0);
  const expense = (txs.items || []).filter((t) => t.type === 'out').reduce((s, t) => s + t.amount, 0);
  ws.addRow({});
  ws.addRow({ description: 'Total entradas', amount: income });
  ws.addRow({ description: 'Total saídas', amount: expense });
  ws.addRow({ description: 'Saldo do período', amount: income - expense });

  // Aba 2: Contas
  const ws2 = wb.addWorksheet('Contas');
  ws2.columns = [
    { header: 'Conta', key: 'name', width: 25 },
    { header: 'Banco', key: 'bank', width: 20 },
    { header: 'Tipo', key: 'type', width: 16 },
    { header: 'Saldo inicial', key: 'initial', width: 16 },
    { header: 'Entradas', key: 'in', width: 14 },
    { header: 'Saídas', key: 'out', width: 14 },
    { header: 'Saldo atual', key: 'balance', width: 16 },
  ];
  ws2.getRow(1).font = { bold: true };
  for (const a of accounts) {
    const agg = a.period || { in: 0, out: 0 };
    ws2.addRow({
      name: a.name,
      bank: a.bank || '—',
      type: a.type,
      initial: a.initialBalance,
      in: agg.in || 0,
      out: agg.out || 0,
      balance: a.balance ?? a.initialBalance,
    });
  }

  // Aba 3: Resumo por categoria
  const byCat = {};
  for (const t of txs.items || []) {
    if (t.type !== 'out') continue;
    byCat[t.category] = (byCat[t.category] || 0) + t.amount;
  }
  const ws3 = wb.addWorksheet('Por categoria');
  ws3.columns = [
    { header: 'Categoria', key: 'cat', width: 25 },
    { header: 'Total saídas (R$)', key: 'total', width: 18 },
  ];
  ws3.getRow(1).font = { bold: true };
  Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, total]) => ws3.addRow({ cat, total }));

  const buffer = await wb.xlsx.writeBuffer();
  return { buffer, filename: `financeiro-${period.from.toISOString().slice(0, 10)}-${period.to.toISOString().slice(0, 10)}.xlsx` };
}

async function importStatement(userId, { accountId, filename = '', content = '' }) {
  const workspaceId = await getWorkspaceId(userId);
  const account = await repo.getAccount(workspaceId, accountId);

  if (Buffer.byteLength(String(content), 'utf8') > MAX_CONTENT_BYTES) {
    const err = new Error('Arquivo muito grande (máx. 3 MB)');
    err.status = 413;
    throw err;
  }

  const { format, rows } = parseStatement({ filename, content });
  if (rows.length > MAX_IMPORT_ROWS) {
    const err = new Error(`Máximo de ${MAX_IMPORT_ROWS} lançamentos por arquivo`);
    err.status = 413;
    throw err;
  }

  const docs = rows.map((row) => ({
    workspaceId,
    accountId: account._id,
    date: row.date,
    description: row.description,
    amount: row.amount,
    type: row.type,
    category: categorize(row.description, row.type),
    source: row.source,
    externalId: row.externalId,
  }));

  const result = await repo.insertTransactions(docs);
  return {
    format,
    account: { id: account._id, name: account.name },
    found: rows.length,
    imported: result.inserted,
    duplicates: result.duplicates,
  };
}

function categories() {
  return CATEGORIES;
}

module.exports = {
  overview,
  listAccounts,
  createAccount,
  updateAccount,
  archiveAccount,
  listTransactions,
  createTransaction,
  deleteTransaction,
  importStatement,
  categories,
  resolvePeriod,
  exportXlsx,
};
