import type { ReactNode } from 'react';

export function StatusChip({ tone, children }: { tone: 'good' | 'warn' | 'neutral' | 'danger' | 'info'; children: ReactNode }) {
  const symbol = tone === 'good' ? '✓' : tone === 'warn' ? '!' : tone === 'danger' ? '⚠' : tone === 'info' ? 'i' : '•';
  return <span className={`status-chip status-${tone}`}><span aria-hidden="true">{symbol}</span>{children}</span>;
}
