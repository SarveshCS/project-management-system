'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import AuthShell from '@/components/AuthShell';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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
      <AuthShell title="Complete Your Profile">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label className="mb-1">Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <Button disabled={saving} variant="action" fullWidth>
            {saving ? 'Saving...' : 'Save and Continue'}
          </Button>
        </form>
      </AuthShell>
    </ProtectedRoute>
  );
}
