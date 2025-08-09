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
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { db } from '@/lib/firebase';
import { collection, getCountFromServer, getDocs, limit, orderBy, query, where, startAfter, DocumentSnapshot, QueryConstraint, startAt, endAt } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
 

// Admin dashboard shows high level stats and a one time users list fetch

type Stats = {
  students: number;
  teachers: number;
  admins: number;
  submissions: number;
  pending: number;
};

export default function AdminPage() {

  const [stats, setStats] = useState<Stats>({
    students: 0,
    teachers: 0,
    admins: 0,
    submissions: 0,
    pending: 0,
  });
  type Recent = { id: string; title: string; studentName: string; status: 'pending' | 'graded'; submittedAt?: Date };
  type UserRow = { uid: string; fullName: string; email: string; role: 'student' | 'teacher' | 'admin'; department?: string };
  const [recentSubmissions, setRecentSubmissions] = useState<Recent[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher' | 'admin'>('all');
  const [deptFilter, setDeptFilter] = useState<string>('');
  const [departments, setDepartments] = useState<string[]>([]);
  const pageSize = 20;
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageStarts, setPageStarts] = useState<Array<DocumentSnapshot | null>>([null]);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);

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
          const rawSubmittedAt = (data as { submittedAt?: unknown }).submittedAt;
          let parsedDate: Date | undefined = undefined;
          if (rawSubmittedAt && typeof (rawSubmittedAt as { toDate?: unknown }).toDate === 'function') {
            parsedDate = (rawSubmittedAt as { toDate: () => Date }).toDate();
          } else if (rawSubmittedAt) {
            parsedDate = new Date(String(rawSubmittedAt));
          }
          return {
            id: d.id,
            title: String(data.title || ''),
            studentName: String(data.studentName || ''),
            status: (data.status === 'graded' ? 'graded' : 'pending') as Recent['status'],
            submittedAt: parsedDate,
          } satisfies Recent;
        });
        setRecentSubmissions(rec);
    } catch (e) {
        console.error('Failed to load recent submissions', e);
      }
  }, []);
  const buildUserQuery = useCallback((startAfterDoc?: DocumentSnapshot | null) => {
    const constraints: QueryConstraint[] = [];
    // Equality filters
    if (roleFilter !== 'all') constraints.push(where('role', '==', roleFilter));
    if (deptFilter) constraints.push(where('department', '==', deptFilter));

    // Order and optional search prefix on fullName
    const term = search.trim();
    constraints.push(orderBy('fullName'));
    if (term) {
      constraints.push(startAt(term));
      constraints.push(endAt(term + '\uf8ff'));
    }

    if (startAfterDoc) constraints.push(startAfter(startAfterDoc));
    constraints.push(limit(pageSize));
    return query(collection(db, 'users'), ...constraints);
  }, [deptFilter, roleFilter, search]);

  const fetchUsersPage = useCallback(async (page: number) => {
    setUsersLoading(true);
    try {
      const startDoc = page > 0 ? pageStarts[page] ?? null : null;
      const q = buildUserQuery(startDoc);
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => {
        const data = d.data() as Partial<UserRow> & Record<string, unknown>;
        return {
          uid: d.id,
          fullName: String(data.fullName || ''),
          email: String(data.email || ''),
          role: (data.role === 'teacher' || data.role === 'admin' ? data.role : 'student') as UserRow['role'],
          department: data.department ? String(data.department) : undefined,
        } satisfies UserRow;
      });
      setUsers(list);
      setPageIndex(page);
      // Update pageStarts for next page navigation
      if (list.length > 0) {
        const newStarts = [...pageStarts];
        newStarts[page + 1] = snap.docs[snap.docs.length - 1];
        setPageStarts(newStarts);
      }
      setHasNextPage(snap.size === pageSize);
    } catch (e) {
      console.error('Failed to load users', e);
    } finally {
      setUsersLoading(false);
    }
  }, [buildUserQuery, pageStarts]);

  const resetAndFetchUsers = useCallback(async () => {
    setPageStarts([null]);
    await fetchUsersPage(0);
  }, [fetchUsersPage]);

  // Load departments for filter options (best-effort)
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'users'), orderBy('department'), limit(100)));
        const set = new Set<string>();
        snap.docs.forEach((d) => {
          const dep = (d.data() as Record<string, unknown>).department;
          if (typeof dep === 'string' && dep.trim()) set.add(dep.trim());
        });
        setDepartments(Array.from(set).sort((a, b) => a.localeCompare(b)));
      } catch (e) {
        console.warn('Failed to load departments', e);
      }
    };
    loadDepartments();
  }, []);

  // Manual fetch only when user clicks Apply or Refresh
  // On mount, load initial stats, recent, and first users page once.
  useEffect(() => {
    fetchStats();
    fetchRecent();
    resetAndFetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Removed inline create user to keep admin overview focused

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
      <Card className="lg:col-span-3">
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
              {/* Filters */}
              <div className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="md:col-span-2">
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search by name (prefix)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="roleFilter">Role</Label>
                  <Select id="roleFilter" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as 'all' | 'student' | 'teacher' | 'admin')}>
                    <option value="all">All</option>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="deptFilter">Department</Label>
                  <Select id="deptFilter" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                    <option value="">All</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button variant="primary" disabled={usersLoading} onClick={() => resetAndFetchUsers()}>Apply</Button>
                </div>
              </div>

              {/* Table */}
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : users.length === 0 ? (
                <EmptyState title="No users found" description="Adjust filters and select Apply or use Refresh." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-muted-foreground">
                      <tr>
                        <th className="py-2 pr-4">Name</th>
                        <th className="py-2 pr-4">Email</th>
                        <th className="py-2 pr-4">Role</th>
                        <th className="py-2 pr-4">Department</th>
                        <th className="py-2 pr-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {users.map((u) => (
                        <tr key={u.uid}>
                          <td className="py-2 pr-4 font-medium">{u.fullName}</td>
                          <td className="py-2 pr-4">{u.email}</td>
                          <td className="py-2 pr-4 capitalize">{u.role}</td>
                          <td className="py-2 pr-4">{u.department || '-'}</td>
                          <td className="py-2 pr-4">
                            <a href={`/admin/users/${u.uid}`} className="text-primary hover:underline">View</a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
                <div className="text-xs text-muted-foreground">Page {pageIndex + 1}</div>
                <div className="flex gap-2">
          <Button variant="outline" disabled={usersLoading} onClick={() => resetAndFetchUsers()}>Refresh</Button>
                  <Button
                    variant="outline"
                    disabled={pageIndex === 0 || usersLoading}
                    onClick={() => fetchUsersPage(Math.max(0, pageIndex - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!hasNextPage || usersLoading}
                    onClick={() => fetchUsersPage(pageIndex + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
