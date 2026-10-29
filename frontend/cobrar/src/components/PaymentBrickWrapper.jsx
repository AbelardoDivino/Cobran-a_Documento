import React, { useEffect, useState } from 'react';

// Isola o @mercadopago/sdk-react: se o Brick mudar de versão, o impacto fica aqui.
export default function PaymentBrickWrapper({ method, amount, onToken, disabled }) {
  const [Brick, setBrick] = useState(null);
  const [sdkError, setSdkError] = useState('');
  const [payError, setPayError] = useState('');
  const publicKey = process.env.REACT_APP_MERCADOPAGO_PUBLIC_KEY || '';

  useEffect(() => {
    let mounted = true;
    if (!publicKey) {
      setSdkError('Pagamento indisponível: Public Key do Mercado Pago não configurada.');
      return undefined;
    }
    import('@mercadopago/sdk-react')
      .then((sdk) => {
        if (mounted) {
          sdk.initMercadoPago(publicKey, { locale: 'pt-BR' });
          setBrick({ Payment: sdk.Payment });
          setSdkError('');
        }
      })
      .catch(() => setSdkError('Falha ao carregar o SDK de pagamento.'));
    return () => {
      mounted = false;
    };
  }, [publicKey]);

  if (sdkError) return <p className="error">{sdkError}</p>;
  if (!Brick) return <p className="muted">Carregando pagamento…</p>;

  const initialization = { amount, payer: { email: '' } };
  const customization = {
    paymentMethods: {
      creditCard: method === 'card' ? 'all' : [],
      debitCard: method === 'card' ? 'all' : [],
      mercadoPago: [],
      bankTransfer: method === 'pix' ? 'all' : [],
      ticket: method === 'boleto' ? 'all' : [],
      maxInstallments: 1,
    },
  };

  return (
    <div>
      <Brick.Payment
        initialization={initialization}
        customization={customization}
        onSubmit={async (param) => {
          setPayError('');
          try {
            await onToken(param);
          } catch (e) {
            setPayError(e?.response?.data?.error || e?.message || 'Pagamento recusado. Tente novamente.');
          }
        }}
      />
      {payError && <p className="error" style={{ marginTop: 12 }}>{payError}</p>}
    </div>
  );
}
