'use client';

import React from 'react';

export function PageHeader({ title, subtitle, actions, className = '' }: { title: string; subtitle?: string; actions?: React.ReactNode; className?: string; }) {
  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8 ${className}`}>
      <div>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export default PageHeader;
