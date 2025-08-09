'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function StudentLoginPage() {
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
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-card-foreground mb-6 text-center">Student Sign In</h1>
        {resetMode ? (
          <form onSubmit={onReset} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input className="w-full px-3 py-2 border border-border rounded-md bg-background"
                value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </div>
            <button disabled={submitting} className="w-full bg-action text-action-foreground py-2 rounded-md">
              {submitting ? 'Sending...' : 'Send Password Reset Email'}
            </button>
            <button type="button" onClick={() => setResetMode(false)} className="w-full mt-2 text-sm text-primary">
              Back to Sign In
            </button>
          </form>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input className="w-full px-3 py-2 border border-border rounded-md bg-background"
                value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </div>
            <div>
              <label className="block text-sm mb-1">Password</label>
              <input className="w-full px-3 py-2 border border-border rounded-md bg-background"
                value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            </div>
            <button disabled={submitting} className="w-full bg-action text-action-foreground py-2 rounded-md">
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
            <button type="button" onClick={() => setResetMode(true)} className="w-full mt-2 text-sm text-primary">
              Forgot password?
            </button>
          </form>
        )}
        <div className="mt-6 space-y-1">
          <button onClick={() => router.push('/login/teacher')} className="w-full text-sm text-primary">
            Sign in as Teacher
          </button>
          <button onClick={() => router.push('/login/admin')} className="w-full text-sm text-primary">
            Sign in as Admin
          </button>
        </div>
      </div>
    </div>
  );
}
