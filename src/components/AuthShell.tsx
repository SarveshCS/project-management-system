'use client';

import React from 'react';

export default function AuthShell({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 md:p-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        </div>
        <div className="bg-card border border-border rounded-lg p-6 md:p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
