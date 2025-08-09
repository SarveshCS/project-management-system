'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const normalizeAllowedDomain = (value?: string) => {
  const v = (value || '').trim();
  if (!v) return '';
  const lower = v.toLowerCase();
  return lower === 'false' || lower === '0' || lower === 'no' ? '' : v;
};

const allowedDomain = normalizeAllowedDomain(
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || process.env.ALLOWED_EMAIL_DOMAIN
);

type Stats = {
  students: number;
  teachers: number;
  admins: number;
  submissions: number;
  pending: number;
};

export default function AdminPage() {
  const { getAuthToken } = useAuth();

  const [stats, setStats] = useState<Stats>({
    students: 0,
    teachers: 0,
    admins: 0,
    submissions: 0,
    pending: 0,
  });

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [tempPassword, setTempPassword] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const studentsSnap = await getCountFromServer(
          query(collection(db, 'users'), where('role', '==', 'student'))
        );
        const teachersSnap = await getCountFromServer(
          query(collection(db, 'users'), where('role', '==', 'teacher'))
        );
        const adminsSnap = await getCountFromServer(
          query(collection(db, 'users'), where('role', '==', 'admin'))
        );
        const submissionsSnap = await getCountFromServer(collection(db, 'submissions'));
        const pendingSnap = await getCountFromServer(
          query(collection(db, 'submissions'), where('status', '==', 'pending'))
        );

        setStats({
          students: studentsSnap.data().count,
          teachers: teachersSnap.data().count,
          admins: adminsSnap.data().count,
          submissions: submissionsSnap.data().count,
          pending: pendingSnap.data().count,
        });
      } catch (e) {
        console.error('Failed to load admin stats', e);
      }
    };
    fetchStats();
  }, []);

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
      setEmail('');
      setFullName('');
      setTempPassword('');
      setRole('student');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create user';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const totalUsers = stats.students + stats.teachers + stats.admins;

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AppShell>
        <PageHeader
          title="Admin Overview"
          subtitle="Manage users, roles, and system settings from one place."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{totalUsers}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{stats.admins}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.pending > 0 ? (
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-semibold">{stats.pending}</p>
                  <Badge tone="action">Pending</Badge>
                </div>
              ) : (
                <EmptyState
                  title="Nothing pending"
                  description="No external registrations. Admin-only user creation is enabled."
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Create User</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Jane Doe"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={`jane@${allowedDomain || 'college.edu'}`}
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select
                      id="role"
                      name="role"
                      required
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'student' | 'teacher')}
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="password">Temporary Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Minimum 8 characters"
                      required
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="reset" variant="ghost" onClick={() => { setEmail(''); setFullName(''); setTempPassword(''); setRole('student'); }}>Clear</Button>
                  <Button type="submit" variant="primary" disabled={creating}>
                    {creating ? 'Creating...' : 'Create User'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-2">
                <li>There isn&apos;t any external registration flow. Only admins can create users.</li>
                <li>Use institutional email addresses for students and teachers.</li>
                <li>Temporary passwords should be updated by users after first login.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
