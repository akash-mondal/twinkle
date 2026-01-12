'use client';

import { motion } from 'framer-motion';
import { Loader2, Check, X } from 'lucide-react';

type TxStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error';

interface TxButtonProps {
  onClick: () => void;
  status: TxStatus;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  successMessage?: string;
  errorMessage?: string;
}

export function TxButton({
  onClick,
  status,
  children,
  disabled = false,
  className = '',
  successMessage = 'Success!',
  errorMessage = 'Failed',
}: TxButtonProps) {
  const isLoading = status === 'pending' || status === 'confirming';
  const isDisabled = disabled || isLoading;

  const baseClass = "relative px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2";

  const statusClasses = {
    idle: 'bg-purple-500 hover:bg-purple-600 text-white',
    pending: 'bg-purple-500/70 text-white cursor-wait',
    confirming: 'bg-purple-500/70 text-white cursor-wait',
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseClass} ${statusClasses[status]} ${className}`}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
    >
      {status === 'idle' && children}

      {status === 'pending' && (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Confirm in wallet...</span>
        </>
      )}

      {status === 'confirming' && (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Confirming...</span>
        </>
      )}

      {status === 'success' && (
        <>
          <Check className="w-4 h-4" />
          <span>{successMessage}</span>
        </>
      )}

      {status === 'error' && (
        <>
          <X className="w-4 h-4" />
          <span>{errorMessage}</span>
        </>
      )}
    </motion.button>
  );
}
