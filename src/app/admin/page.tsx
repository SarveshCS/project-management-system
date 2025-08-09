'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import toast from 'react-hot-toast';

const normalizeAllowedDomain = (value?: string) => {
  const v = (value || '').trim();
  if (!v) return '';
  const lower = v.toLowerCase();
  return lower === 'false' || lower === '0' || lower === 'no' ? '' : v;
};

const allowedDomain = normalizeAllowedDomain(process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || process.env.ALLOWED_EMAIL_DOMAIN);

export default function AdminPage() {
  const { getAuthToken } = useAuth();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [creating, setCreating] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (allowedDomain && !email.toLowerCase().endsWith(`@${allowedDomain.toLowerCase()}`)) {
      toast.error(`Only ${allowedDomain} emails are allowed`);
      return;
    }

    setCreating(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, fullName, role, tempPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      toast.success('User created');
      setEmail(''); setFullName(''); setTempPassword(''); setRole('student');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create user';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-lg bg-card border border-border rounded-lg p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-card-foreground mb-6 text-center">Admin - Create User</h1>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input className="w-full px-3 py-2 border border-border rounded-md bg-background" value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required />
            </div>
            <div>
              <label className="block text-sm mb-1">Full Name</label>
              <input className="w-full px-3 py-2 border border-border rounded-md bg-background" value={fullName} onChange={(e)=>setFullName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm mb-1">Role</label>
              <select className="w-full px-3 py-2 border border-border rounded-md bg-background" value={role} onChange={(e)=>setRole(e.target.value as 'student' | 'teacher')}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Temporary Password</label>
              <input className="w-full px-3 py-2 border border-border rounded-md bg-background" value={tempPassword} onChange={(e)=>setTempPassword(e.target.value)} type="password" required />
              <p className="text-xs text-muted-foreground mt-1">Share this password with the user. They can change it via &quot;Forgot password&quot; on the login page.</p>
            </div>
            <button disabled={creating} className="w-full bg-action text-action-foreground py-2 rounded-md">
              {creating ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
