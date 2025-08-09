'use client';

import React from 'react';
import { LightMode, DarkMode, Computer } from '@mui/icons-material';
import { useTheme } from '@/contexts/ThemeContext';

type Props = {
  className?: string;
  compact?: boolean;
};

export default function ThemeToggle({ className = '', compact = false }: Props) {
  const { theme, setTheme } = useTheme();

  const btn = (key: 'light' | 'dark' | 'system', label: string, icon: React.ReactNode) => (
    <button
      key={key}
      onClick={() => setTheme(key)}
      className={`cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition ${
        theme === key
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-card text-card-foreground border-border hover:bg-muted'
      }`}
      aria-pressed={theme === key}
    >
      <span aria-hidden className="inline-flex items-center">{icon}</span>
      {!compact && <span>{label}</span>}
    </button>
  );

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {btn('light', 'Light', <LightMode fontSize="small" />)}
      {btn('dark', 'Dark', <DarkMode fontSize="small" />)}
      {btn('system', 'System', <Computer fontSize="small" />)}
    </div>
  );
}
