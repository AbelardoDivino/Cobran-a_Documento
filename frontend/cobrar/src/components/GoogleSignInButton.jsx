import React from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

// Botão "Entrar com Google" (Google Identity Services).
// Só renderiza quando REACT_APP_GOOGLE_CLIENT_ID está configurado —
// sem isso retorna null (seguro para testes e para quem não usa Google).
export default function GoogleSignInButton({ onSuccess, onError }) {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  if (!clientId) return null;
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="google-btn">
        <GoogleLogin
          onSuccess={(response) => onSuccess(response.credential)}
          onError={() => onError && onError()}
          text="signin_with"
          shape="rectangular"
          width={320}
        />
      </div>
    </GoogleOAuthProvider>
  );
}
