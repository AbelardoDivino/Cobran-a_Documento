import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAccounts, useImportStatement } from '../hooks/useFinance';

const EXAMPLE = 'data;descricao;valor\n01/10/2026;Supermercado Extra;-150,50\n05/10/2026;Pagamento de cliente;2000,00';

export default function FinancesImport() {
  const { data: accounts } = useAccounts();
  const importStatement = useImportStatement();
  const [accountId, setAccountId] = useState('');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const onFile = (e) => {
    setResult(null);
    setError('');
    setFile(e.target.files?.[0] || null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    const target = accountId || accounts?.[0]?._id;
    if (!target) {
      setError('Cadastre uma conta antes de importar.');
      return;
    }
    if (!file) {
      setError('Escolha o arquivo do extrato (CSV ou OFX).');
      return;
    }
    const content = await file.text();
    try {
      const data = await importStatement.mutateAsync({
        accountId: target,
        filename: file.name,
        content,
      });
      setResult(data);
      setFile(null);
      e.target.reset();
    } catch (err) {
      setError(err?.response?.data?.error || 'Não foi possível importar o arquivo.');
    }
  };

  const downloadExample = () => {
    const blob = new Blob([EXAMPLE], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo-extrato.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <div className="page-head">
          <div>
            <h1>Importar extrato</h1>
            <p>CSV ou OFX do seu banco. Reimportar o mesmo arquivo não duplica nada.</p>
          </div>
        </div>

        <form className="card" onSubmit={submit}>
          <h3 style={{ marginTop: 0 }}>
            <Upload size={17} /> Enviar arquivo
          </h3>
          <div className="row">
            <label className="field" style={{ flex: 1 }}>
              Conta de destino
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                <option value="">Selecione…</option>
                {(accounts || []).map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name} {a.bank ? `· ${a.bank}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="field" style={{ flex: 2 }}>
              Arquivo (.csv, .ofx, .txt)
              <input type="file" accept=".csv,.ofx,.txt,text/csv,text/plain" onChange={onFile} />
            </label>
          </div>

          {error && <p className="error">{error}</p>}

          <div className="row">
            <button className="btn primary" type="submit" disabled={importStatement.isPending}>
              <Upload size={16} /> {importStatement.isPending ? 'Importando…' : 'Importar extrato'}
            </button>
            <button type="button" className="btn ghost" onClick={downloadExample}>
              Baixar modelo CSV
            </button>
          </div>
        </form>

        {result && (
          <div className="card" data-testid="import-result">
            <h3 style={{ marginTop: 0 }}>
              <CheckCircle2 size={17} style={{ color: 'var(--ok-ink)' }} /> Importação concluída
            </h3>
            <p>
              Formato <strong>{result.format.toUpperCase()}</strong> · {result.found} lançamentos
              lidos · <strong>{result.imported}</strong> importados
              {result.duplicates > 0 && ` · ${result.duplicates} já existiam (ignorados)`}.
            </p>
          </div>
        )}

        <div className="card">
          <h3 style={{ marginTop: 0 }}>
            <FileText size={17} /> Formatos aceitos
          </h3>
          <p className="muted">
            <strong>CSV:</strong> precisa ter uma coluna de data, uma de descrição e uma de valor
            (valor negativo = saída). Separador <code>;</code> ou <code>,</code>. Nomes aceitos:
            data/date, descrição/histórico/memo, valor/amount.
          </p>
          <p className="muted">
            <strong>OFX:</strong> o arquivo padrão exportado pelo internet banking. Datas, valores
            e identificadores vêm do próprio banco — é o formato mais confiável.
          </p>
          <pre className="code-block">{EXAMPLE}</pre>
        </div>
      </main>
    </div>
  );
}
