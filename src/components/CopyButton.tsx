import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string | null | undefined;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  label = 'Copiar',
  className = '',
  size = 'sm',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  const isSmall = size === 'sm';

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!text}
      title={text ? 'Copiar mensaje al portapapeles' : 'Sin mensaje disponible'}
      className={`inline-flex items-center justify-center gap-1.5 font-medium rounded transition-colors ${
        copied
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
          : !text
          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100'
      } ${isSmall ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm'} ${className}`}
    >
      {copied ? (
        <>
          <Check className={isSmall ? 'w-3.5 h-3.5 text-emerald-600' : 'w-4 h-4 text-emerald-600'} />
          <span>¡Copiado!</span>
        </>
      ) : (
        <>
          <Copy className={isSmall ? 'w-3.5 h-3.5 text-slate-500' : 'w-4 h-4 text-slate-500'} />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};
