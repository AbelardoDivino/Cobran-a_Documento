import React, { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

const ACCEPT = 'image/*,application/pdf';
const MAX_MB = 15;

export default function UploadDropzone({ onFile, disabled }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState('');

  const pick = (file) => {
    setError('');
    if (!file) return;
    const okType = file.type === 'application/pdf' || file.type.startsWith('image/');
    if (!okType) {
      setError('Tipo não permitido. Envie PDF, PNG ou JPG.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Arquivo maior que ${MAX_MB}MB.`);
      return;
    }
    onFile(file);
  };

  return (
    <div>
      <div
        className={`dropzone${drag ? ' drag' : ''}`}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          pick(e.dataTransfer.files?.[0]);
        }}
      >
        <UploadCloud />
        <p className="dropzone-title">Toque para enviar o documento</p>
        <p className="dropzone-sub">Foto da câmera, PDF, PNG ou JPG · até {MAX_MB}MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        capture="environment"
        style={{ display: 'none' }}
        disabled={disabled}
        onChange={(e) => pick(e.target.files?.[0])}
        data-testid="file-input"
      />
      {error && <p className="error">{error}</p>}
    </div>
  );
}
