'use client';

import React from 'react';
import { Navigation } from './Navigation';

export default function AppShell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>{children}</div>
    </div>
  );
}
