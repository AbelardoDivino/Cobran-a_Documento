import React, { useState } from 'react';
import { CreditCard, QrCode, Barcode, BadgeCheck } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import PaymentBrickWrapper from '../components/PaymentBrickWrapper';
import { useBilling } from '../hooks/useBilling';

const PLANS = [
  { id: 'mensal', name: 'Mensal', price: 90.0, per: 'por mês, cancele quando quiser' },
  { id: 'trimestral', name: 'Trimestral', price: 243.0, per: 'a cada 3 meses · 10% off' },
  { id: 'anual', name: 'Anual', price: 864.0, per: 'à vista · 20% off' },
];

const METHODS = [
  { id: 'card', label: 'Cartão', Icon: CreditCard, hint: 'pagamento único do ciclo' },
  { id: 'pix', label: 'Pix', Icon: QrCode, hint: 'aprovação na hora' },
  { id: 'boleto', label: 'Boleto', Icon: Barcode, hint: 'compensa em 1–2 dias úteis' },
];

const EMPTY_PAYER = {
  firstName: '',
  lastName: '',
  cpf: '',
  zipCode: '',
  streetName: '',
  streetNumber: '',
  neighborhood: '',
  city: '',
  state: '',
};

function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function Billing() {
  const [plan, setPlan] = useState('mensal');
  const [method, setMethod] = useState('card');
  const [payer, setPayer] = useState(EMPTY_PAYER);
  const { status, subscribeCard, chargePix, chargeBoleto } = useBilling();
  const [result, setResult] = useState(null);

  const amount = PLANS.find((p) => p.id === plan).price;
  const current = status.data?.subscription;
  const busy = subscribeCard.isPending || chargePix.isPending || chargeBoleto.isPending;
  const error = subscribeCard.error || chargePix.error || chargeBoleto.error;

  const setPayerField = (key) => (e) => setPayer((p) => ({ ...p, [key]: e.target.value }));

  const handleBrick = async (param) => {
    const formData = param?.formData || param;
    const cardToken = formData?.token;
    if (!cardToken) throw new Error('Não foi possível validar o cartão. Tente novamente.');
    const r = await subscribeCard.mutateAsync({
      plan,
      cardToken,
      cardBrand: formData?.payment_method_id || formData?.paymentMethodId || 'master',
      idempotencyKey: newIdempotencyKey(),
    });
    setResult({ kind: 'card', data: r });
  };

  const handlePix = async () => {
    const r = await chargePix.mutateAsync({ plan, idempotencyKey: newIdempotencyKey() });
    setResult({ kind: 'pix', data: r });
  };

  const handleBoleto = async (e) => {
    e.preventDefault();
    const r = await chargeBoleto.mutateAsync({
      plan,
      payer,
      idempotencyKey: newIdempotencyKey(),
    });
    setResult({ kind: 'boleto', data: r });
  };

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <div className="page-head">
          <div>
            <h1>Plano e assinatura</h1>
            <p>Assine o Pro para liberar até 10 pessoas no mesmo espaço. Pix ou cartão, liberação automática.</p>
          </div>
        </div>

        {current && (
          <div className="card status-line" data-testid="current-status">
            <BadgeCheck size={19} style={{ color: 'var(--pine)' }} />
            <span>
              Plano Pro · <StatusBadge status={current.status} /> · {current.method}
            </span>
          </div>
        )}

        <div className="card">
          <h3 style={{ marginTop: 0 }}>1 · Escolha o ciclo do Pro</h3>
          <div className="plans">
            {PLANS.map((p) => (
              <button
                key={p.id}
                className={`plan${plan === p.id ? ' sel' : ''}`}
                onClick={() => setPlan(p.id)}
                data-testid={`plan-${p.id}`}
              >
                <span className="pname">{p.name}</span>
                <div className="pprice">R${p.price.toFixed(2).replace('.', ',')}</div>
                <span className="pper">{p.per}</span>
              </button>
            ))}
          </div>

          <h3>2 · Como quer pagar?</h3>
          <div className="methods">
            {METHODS.map(({ id, label, Icon, hint }) => (
              <button
                key={id}
                className={`method${method === id ? ' sel' : ''}`}
                onClick={() => {
                  setMethod(id);
                  setResult(null);
                }}
                data-testid={`method-${id}`}
                title={hint}
              >
                <Icon /> {label}
              </button>
            ))}
          </div>
          <p className="muted" style={{ marginBottom: 0 }}>
            {method === 'card'
              ? 'O cartão não é armazenado. Antes do vencimento você recebe um e-mail para pagar novamente.'
              : 'A cada ciclo geramos automaticamente uma nova cobrança e enviamos por e-mail.'}
          </p>
        </div>

        <div className="card" data-testid="pay-area">
          <h3 style={{ marginTop: 0 }}>3 · Pagamento seguro via Mercado Pago</h3>

          {method === 'card' && (
            <PaymentBrickWrapper method="card" amount={amount} onToken={handleBrick} />
          )}

          {method === 'pix' && (
            <div data-testid="pix-panel">
              <p className="muted">
                Geramos o QR code na hora. Aponte a câmera do banco e o acesso libera assim que
                confirmar.
              </p>
              <button className="btn primary" onClick={handlePix} disabled={busy} data-testid="create-pix">
                <QrCode /> {busy ? 'Gerando…' : 'Gerar cobrança Pix'}
              </button>
            </div>
          )}

          {method === 'boleto' && (
            <form onSubmit={handleBoleto} data-testid="boleto-panel">
              <p className="muted">
                O boleto exige os dados do pagador (nome, CPF e endereço) por exigência do banco.
              </p>
              <div className="row">
                <label className="field" style={{ flex: 1 }}>
                  Nome
                  <input value={payer.firstName} onChange={setPayerField('firstName')} required />
                </label>
                <label className="field" style={{ flex: 1 }}>
                  Sobrenome
                  <input value={payer.lastName} onChange={setPayerField('lastName')} required />
                </label>
              </div>
              <div className="row">
                <label className="field" style={{ flex: 1 }}>
                  CPF
                  <input
                    value={payer.cpf}
                    onChange={setPayerField('cpf')}
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    required
                  />
                </label>
                <label className="field" style={{ flex: 1 }}>
                  CEP
                  <input
                    value={payer.zipCode}
                    onChange={setPayerField('zipCode')}
                    inputMode="numeric"
                    placeholder="00000-000"
                    required
                  />
                </label>
              </div>
              <div className="row">
                <label className="field" style={{ flex: 2 }}>
                  Rua
                  <input value={payer.streetName} onChange={setPayerField('streetName')} required />
                </label>
                <label className="field" style={{ flex: 1 }}>
                  Número
                  <input value={payer.streetNumber} onChange={setPayerField('streetNumber')} required />
                </label>
              </div>
              <div className="row">
                <label className="field" style={{ flex: 1 }}>
                  Bairro
                  <input value={payer.neighborhood} onChange={setPayerField('neighborhood')} required />
                </label>
                <label className="field" style={{ flex: 2 }}>
                  Cidade
                  <input value={payer.city} onChange={setPayerField('city')} required />
                </label>
                <label className="field" style={{ flex: '0 0 80px' }}>
                  UF
                  <input
                    value={payer.state}
                    onChange={setPayerField('state')}
                    maxLength={2}
                    placeholder="SP"
                    required
                  />
                </label>
              </div>
              <button className="btn primary" type="submit" disabled={busy} data-testid="create-boleto">
                <Barcode /> {busy ? 'Gerando…' : 'Gerar boleto'}
              </button>
            </form>
          )}

          {error && (
            <p className="error" style={{ marginTop: 14 }}>
              {error?.response?.data?.error || error.message || 'Não foi possível gerar a cobrança.'}
            </p>
          )}
        </div>

        {result?.kind === 'card' && (
          <p className="ok-line" data-testid="card-ok">
            {result.data?.charge?.status === 'approved'
              ? 'Pagamento aprovado! Plano Pro liberado.'
              : 'Assinatura criada! Assim que o pagamento confirmar, seu acesso libera automaticamente.'}
          </p>
        )}
        {result?.kind === 'pix' && (
          <div className="card" data-testid="pix-qr">
            <h2>Pix gerado — pague no app do banco</h2>
            {result.data.charge.pixQrBase64 && (
              <img
                src={`data:image/png;base64,${result.data.charge.pixQrBase64}`}
                alt="QR code Pix"
                style={{ width: 220, height: 220, display: 'block', marginBottom: 12 }}
              />
            )}
            <code>{result.data.charge.pixQrCode}</code>
          </div>
        )}
        {result?.kind === 'boleto' && (
          <div className="card" data-testid="boleto-link">
            <h2>Boleto gerado</h2>
            <p>
              <a href={result.data.charge.boletoUrl} target="_blank" rel="noreferrer">
                Abrir boleto
              </a>
            </p>
            {result.data.charge.boletoDigitableLine && (
              <p>
                Linha digitável: <code>{result.data.charge.boletoDigitableLine}</code>
              </p>
            )}
            <code>{result.data.charge.boletoBarcode}</code>
          </div>
        )}
      </main>
    </div>
  );
}
