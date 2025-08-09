'use client';

import React from 'react';

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className = '', ...props }: LabelProps) {
  return <label className={`block text-sm font-medium text-card-foreground ${className}`} {...props} />;
}

export default Label;
