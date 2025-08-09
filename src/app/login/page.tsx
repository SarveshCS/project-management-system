'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import AuthShell from '@/components/AuthShell';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const { user, loading, signInWithEmail, resetPassword } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await signInWithEmail(email, password);
    } finally {
      setSubmitting(false);
    }
  };

  const onReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await resetPassword(email);
      setResetMode(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthShell title="Sign In">
      <div className="mb-4 rounded-md border border-border bg-card p-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Test Admin Account</p>
        <p>Email: <span className="font-mono text-foreground">testadmin@niet.co.in</span></p>
        <p>Password: <span className="font-mono text-foreground">niet@1234</span></p>
      </div>

      {resetMode ? (
        <form onSubmit={onReset} className="space-y-4">
          <div>
            <Label className="mb-1">Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <Button disabled={submitting} variant="action" fullWidth>
            {submitting ? 'Sending...' : 'Send Password Reset Email'}
          </Button>
          <Button type="button" onClick={() => setResetMode(false)} variant="ghost" fullWidth>
            Back to Sign In
          </Button>
        </form>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label className="mb-1">Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div>
            <Label className="mb-1">Password</Label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </div>
          <Button disabled={submitting} variant="action" fullWidth>
            {submitting ? 'Signing in...' : 'Sign In'}
          </Button>
          <Button type="button" onClick={() => setResetMode(true)} variant="ghost" fullWidth>
            Forgot password?
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
