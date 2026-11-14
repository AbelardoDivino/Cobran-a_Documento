const crypto = require('crypto');

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function parseAmount(raw) {
  if (typeof raw === 'number') return raw;
  let s = String(raw ?? '').trim().replace(/R\$/g, '').replace(/\s/g, '');
  if (!s) return NaN;
  const negative = /^\(.*\)$/.test(s) || s.endsWith('-');
  s = s.replace(/[()]/g, '').replace(/-$/, '');
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && hasDot) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (hasComma) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (hasDot) {
    const parts = s.split('.');
    if (parts.length > 2) s = parts.join('');
  }
  const value = Number(s);
  if (Number.isNaN(value)) return NaN;
  return negative ? -Math.abs(value) : value;
}

function parseDate(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  const iso = s.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (iso) return new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));
  const br = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (br) {
    const year = br[3].length === 2 ? 2000 + +br[3] : +br[3];
    return new Date(Date.UTC(year, +br[2] - 1, +br[1]));
  }
  const fallback = new Date(s);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function hashRow(date, description, amount, occurrence) {
  return crypto
    .createHash('sha1')
    .update(`${date.toISOString()}|${normalize(description)}|${amount.toFixed(2)}|${occurrence}`)
    .digest('hex');
}

const DATE_KEYS = ['data', 'date', 'dt', 'data movimento', 'data da transacao', 'data lancamento'];
const DESC_KEYS = [
  'descricao',
  'description',
  'historico',
  'historico',
  'memo',
  'lancamento',
  'lancamento',
  'detalhe',
  'estabelecimento',
];
const AMOUNT_KEYS = ['valor', 'amount', 'value', 'montante', 'quantia'];
const DEBIT_KEYS = ['debito', 'debito', 'saida', 'saida'];
const CREDIT_KEYS = ['credito', 'credito', 'entrada'];

function findIndex(headers, keys) {
  for (let i = 0; i < headers.length; i += 1) {
    if (keys.includes(headers[i])) return i;
  }
  return -1;
}

function detectDelimiter(line) {
  const counts = { ';': (line.match(/;/g) || []).length, ',': (line.match(/,/g) || []).length, '\t': (line.match(/\t/g) || []).length };
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
}

function splitLine(line, delimiter) {
  const cells = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (ch === delimiter && !quoted) {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells.map((c) => c.trim().replace(/^"|"$/g, ''));
}

function parseCsv(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (!lines.length) return [];

  const delimiter = detectDelimiter(lines[0]);
  const firstCells = splitLine(lines[0], delimiter).map(normalize);
  const hasHeader = DATE_KEYS.includes(firstCells[0]) || firstCells.some((c) => AMOUNT_KEYS.includes(c) || DESC_KEYS.includes(c));

  let dateIdx = 0;
  let descIdx = 1;
  let amountIdx = 2;
  let debitIdx = -1;
  let creditIdx = -1;
  let start = 0;

  if (hasHeader) {
    dateIdx = findIndex(firstCells, DATE_KEYS);
    descIdx = findIndex(firstCells, DESC_KEYS);
    amountIdx = findIndex(firstCells, AMOUNT_KEYS);
    debitIdx = findIndex(firstCells, DEBIT_KEYS);
    creditIdx = findIndex(firstCells, CREDIT_KEYS);
    start = 1;
  }

  const rows = [];
  for (let i = start; i < lines.length; i += 1) {
    const cells = splitLine(lines[i], delimiter);
    const date = parseDate(cells[dateIdx]);
    if (!date) continue;

    let amount = NaN;
    if (amountIdx >= 0 && cells[amountIdx] !== undefined) amount = parseAmount(cells[amountIdx]);
    if (Number.isNaN(amount) && (debitIdx >= 0 || creditIdx >= 0)) {
      const debit = debitIdx >= 0 ? parseAmount(cells[debitIdx]) : NaN;
      const credit = creditIdx >= 0 ? parseAmount(cells[creditIdx]) : NaN;
      if (!Number.isNaN(credit) && credit !== 0) amount = Math.abs(credit);
      else if (!Number.isNaN(debit) && debit !== 0) amount = -Math.abs(debit);
    }
    if (Number.isNaN(amount) || amount === 0) continue;

    const description = (cells[descIdx] || 'Lancamento importado').slice(0, 200);
    rows.push({ date, description, amount });
  }
  return finalize(rows, 'csv');
}

function parseOfx(text) {
  const content = String(text || '');
  const blocks = content.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) || [];
  const rows = [];
  for (const block of blocks) {
    const pick = (tag) => {
      const m = block.match(new RegExp(`<${tag}>([^<\r\n]+)`, 'i'));
      return m ? m[1].trim() : '';
    };
    const rawDate = pick('DTPOSTED');
    const date = rawDate
      ? parseDate(`${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`)
      : null;
    const amount = parseAmount(pick('TRNAMT'));
    const description = (pick('MEMO') || pick('NAME') || 'Lancamento importado').slice(0, 200);
    const fitid = pick('FITID');
    if (!date || Number.isNaN(amount) || amount === 0) continue;
    rows.push({ date, description, amount, fitid });
  }
  return finalize(rows, 'ofx');
}

function finalize(rows, source) {
  const seen = new Map();
  return rows.map((row) => {
    const base = `${row.date.toISOString()}|${normalize(row.description)}|${row.amount.toFixed(2)}`;
    const occurrence = (seen.get(base) || 0) + 1;
    seen.set(base, occurrence);
    return {
      date: row.date,
      description: row.description,
      amount: Math.abs(row.amount),
      type: row.amount < 0 ? 'out' : 'in',
      externalId: row.fitid || hashRow(row.date, row.description, row.amount, occurrence),
      source,
    };
  });
}

function detectFormat(filename, content) {
  const name = normalize(filename);
  if (name.endsWith('.ofx') || /<OFX>|<STMTTRN>/i.test(content)) return 'ofx';
  if (name.endsWith('.pdf')) return 'pdf';
  return 'csv';
}

// Extrai transacoes de texto de PDF de extrato bancario (heuristica).
function parsePdfText(text) {
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows = [];
  // Padrao: data (dd/mm ou dd/mm/yyyy) ... valor (numero com virgula)
  const dateRe = /(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/;
  const amountRe = /(-?\s*R?\$?\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})|-?\d+(?:,\d{2}))/;
  for (const line of lines) {
    const dm = line.match(dateRe);
    if (!dm) continue;
    const date = parseDate(dm[1]);
    if (!date) continue;
    const am = line.match(amountRe);
    if (!am) continue;
    const amount = parseAmount(am[1]);
    if (Number.isNaN(amount) || amount === 0) continue;
    // descricao = resto da linha sem data e valor
    let desc = line.replace(dm[1], '').replace(am[1], '').trim();
    desc = desc.replace(/\s{2,}/g, ' ').slice(0, 200) || 'Lancamento importado';
    rows.push({ date, description: desc, amount });
  }
  return finalize(rows, 'pdf');
}

function parseStatement({ filename = '', content = '' }) {
  if (!content || !String(content).trim()) {
    const err = new Error('Arquivo vazio');
    err.status = 400;
    throw err;
  }
  const format = detectFormat(filename, content);
  let rows;
  if (format === 'pdf') {
    rows = parsePdfText(content);
  } else {
    rows = format === 'ofx' ? parseOfx(content) : parseCsv(content);
  }
  if (!rows.length) {
    const err = new Error(
      'Nenhum lancamento encontrado. Use CSV com colunas data, descricao e valor, OFX do banco, ou PDF do extrato.'
    );
    err.status = 400;
    throw err;
  }
  return { format, rows };
}

module.exports = { parseStatement, parseCsv, parseOfx, parseAmount, parseDate, normalize, parsePdfText };
