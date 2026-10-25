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
  const initialBalance = Number(data.initialBalance || 0);
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
  const amount = Math.abs(Number(data.amount));
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
};
