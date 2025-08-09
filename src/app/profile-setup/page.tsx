'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function ProfileSetupPage() {
  const { user, completeProfile } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.profileCompleted) router.push('/dashboard');
  }, [user, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSaving(true);
    await completeProfile(fullName);
    setSaving(false);
    router.push('/dashboard');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-card border border-border rounded-lg p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-card-foreground mb-6 text-center">Complete Your Profile</h1>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Full Name</label>
              <input className="w-full px-3 py-2 border border-border rounded-md bg-background"
                value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <button disabled={saving} className="w-full bg-action text-action-foreground py-2 rounded-md">
              {saving ? 'Saving...' : 'Save and Continue'}
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
