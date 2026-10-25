export function brl(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number(value || 0)
  );
}

export function pct(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export function monthLabel(ym) {
  const [year, month] = String(ym).split('-');
  if (!year || !month) return ym;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return date.toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', '');
}

export function dayLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
}

export function periodRange(preset) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const iso = (date) => date.toISOString().slice(0, 10);
  if (preset === 'year') {
    return { from: iso(new Date(Date.UTC(year, 0, 1))), to: iso(now) };
  }
  if (preset === 'quarter') {
    return { from: iso(new Date(Date.UTC(year, Math.max(0, month - 2), 1))), to: iso(now) };
  }
  return { from: iso(new Date(Date.UTC(year, month, 1))), to: iso(now) };
}
