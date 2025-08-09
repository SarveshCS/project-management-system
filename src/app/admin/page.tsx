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
import { collection, getCountFromServer, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
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
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [externalId, setExternalId] = useState('');
  type Recent = { id: string; title: string; studentName: string; status: 'pending' | 'graded'; submittedAt?: Date };
  type UserRow = { uid: string; fullName: string; email: string; role: 'student' | 'teacher' | 'admin' };
  const [recentSubmissions, setRecentSubmissions] = useState<Recent[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);

  const fetchStats = useCallback(async () => {
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
  }, []);
  const fetchRecent = useCallback(async () => {
      try {
        const q = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'), limit(5));
        const snap = await getDocs(q);
        const rec = snap.docs.map((d) => {
          const data = d.data() as Partial<Recent> & Record<string, unknown>;
          return {
            id: d.id,
            title: String(data.title || ''),
            studentName: String(data.studentName || ''),
            status: (data.status === 'graded' ? 'graded' : 'pending') as Recent['status'],
            submittedAt: data.submittedAt ? new Date(String(data.submittedAt)) : undefined,
          } satisfies Recent;
        });
        setRecentSubmissions(rec);
    } catch (e) {
        console.error('Failed to load recent submissions', e);
      }
  }, []);
  const fetchUsers = useCallback(async () => {
      try {
        const snap = await getDocs(query(collection(db, 'users'), orderBy('fullName'), limit(20)));
        const list = snap.docs.map((d) => {
          const data = d.data() as Partial<UserRow> & Record<string, unknown>;
          return {
            uid: d.id,
            fullName: String(data.fullName || ''),
            email: String(data.email || ''),
            role: (data.role === 'teacher' || data.role === 'admin' ? data.role : 'student') as UserRow['role'],
          } satisfies UserRow;
        });
        setUsers(list);
    } catch (e) {
        console.error('Failed to load users', e);
      }
  }, []);
  useEffect(() => { fetchStats(); fetchRecent(); fetchUsers(); }, [fetchStats, fetchRecent, fetchUsers]);

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
        body: JSON.stringify({ email, fullName, role, tempPassword, department, phone, externalId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

  toast.success('User created');
  setEmail('');
  setFullName('');
  setTempPassword('');
  setRole('student');
  setDepartment('');
  setPhone('');
  setExternalId('');
  await Promise.all([fetchStats(), fetchUsers()]);
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
              <div className="mt-2 flex gap-2 flex-wrap">
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-accent/10 text-accent">{stats.students} Students</span>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-action/10 text-action">{stats.teachers} Teachers</span>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-primary/10 text-primary">{stats.admins} Admins</span>
              </div>
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

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Create User</CardTitle>
            </CardHeader>
            <CardContent>
      <form className="space-y-5" onSubmit={onSubmit}>
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
                    <p className="text-xs text-muted-foreground mt-1">Password will require change on first login.</p>
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

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentSubmissions.length === 0 ? (
                <EmptyState title="No recent submissions" description="New activity will appear here." />
              ) : (
                <div className="divide-y divide-border">
                  {recentSubmissions.map((s) => (
                    <div key={s.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{s.title}</p>
                        <p className="text-xs text-muted-foreground">{s.studentName} • {s.status}</p>
                      </div>
                      <Badge tone={s.status === 'graded' ? 'primary' : 'action'}>{s.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <EmptyState title="No users found" description="Users created will show up here." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-muted-foreground">
                      <tr>
                        <th className="py-2 pr-4">Name</th>
                        <th className="py-2 pr-4">Email</th>
                        <th className="py-2 pr-4">Role</th>
                        <th className="py-2 pr-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {users.map((u) => (
                        <tr key={u.uid}>
                          <td className="py-2 pr-4 font-medium">{u.fullName}</td>
                          <td className="py-2 pr-4">{u.email}</td>
                          <td className="py-2 pr-4 capitalize">{u.role}</td>
                          <td className="py-2 pr-4">
                            <a href={`/admin/users/${u.uid}`} className="text-primary hover:underline">View</a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
