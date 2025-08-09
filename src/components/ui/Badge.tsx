'use client';

import React from 'react';

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: 'primary' | 'accent' | 'action' | 'destructive' | 'muted';
};

const toneMap = {
  primary: 'bg-primary/10 text-primary',
  accent: 'bg-accent/10 text-accent',
  action: 'bg-action/10 text-action',
  destructive: 'bg-destructive/10 text-destructive',
  muted: 'bg-muted text-muted-foreground',
};

export function Badge({ className = '', tone = 'muted', ...props }: BadgeProps) {
  return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${toneMap[tone]} ${className}`} {...props} />;
}

export default Badge;
