'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, DocumentSnapshot, endAt, getCountFromServer, getDocs, limit, orderBy, query, QueryConstraint, startAfter, startAt, where } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

type TeacherRow = { uid: string; fullName: string; email: string; department?: string; title?: string };

export default function AdminTeachersPage() {
  const { getAuthToken } = useAuth();

  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [title, setTitle] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [titles] = useState<string[]>(['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Dr.']);

  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageStarts, setPageStarts] = useState<Array<DocumentSnapshot | null>>([null]);
  const pageSize = 20;

  const [tCount, setTCount] = useState(0);

  const buildQuery = useCallback((startDoc?: DocumentSnapshot | null) => {
    const constraints: QueryConstraint[] = [where('role', '==', 'teacher')];
    if (department) constraints.push(where('department', '==', department));
    if (title) constraints.push(where('title', '==', title));
    constraints.push(orderBy('fullName'));
    const term = search.trim();
    if (term) {
      constraints.push(startAt(term));
      constraints.push(endAt(term + '\uf8ff'));
    }
    if (startDoc) constraints.push(startAfter(startDoc));
    constraints.push(limit(pageSize));
    return query(collection(db, 'users'), ...constraints);
  }, [department, title, search]);

  const fetchPage = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const startDoc = page > 0 ? pageStarts[page] ?? null : null;
      const q = buildQuery(startDoc);
      const snap = await getDocs(q);
      const list = snap.docs.map(d => {
        const data = d.data() as Record<string, unknown>;
        return {
          uid: d.id,
          fullName: String(data.fullName || ''),
          email: String(data.email || ''),
          department: typeof data.department === 'string' ? data.department : undefined,
          title: typeof data.title === 'string' ? data.title : undefined,
        };
      });
      setTeachers(list);
  setHasFetched(true);
      setPageIndex(page);
      if (list.length > 0) {
        const newStarts = [...pageStarts];
        newStarts[page + 1] = snap.docs[snap.docs.length - 1];
        setPageStarts(newStarts);
      }
      setHasNextPage(snap.size === pageSize);
    } finally {
      setLoading(false);
    }
  }, [buildQuery, pageStarts]);

  const resetAndFetch = useCallback(() => {
    setPageStarts([null]);
    fetchPage(0);
  }, [fetchPage]);

  // Manual fetch only: use Apply/Refresh controls below

  useEffect(() => {
    // counts and filter options
    (async () => {
      const cnt = await getCountFromServer(query(collection(db, 'users'), where('role', '==', 'teacher')));
      setTCount(cnt.data().count);
      try {
        const depSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'teacher'), orderBy('department'), limit(100)));
        const depSet = new Set<string>();
        depSnap.docs.forEach(d => {
          const raw = d.data() as Record<string, unknown>;
          const v = raw.department;
          if (typeof v === 'string' && v.trim()) depSet.add(v.trim());
        });
        setDepartments(Array.from(depSet).sort((a, b) => a.localeCompare(b)));
      } catch {}
  // Do not auto-fetch; wait for Apply
    })();
  }, [resetAndFetch]);

  // Create teacher
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [regTitle, setRegTitle] = useState('');
  const [regDepartment, setRegDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [externalId, setExternalId] = useState('');
  const [creating, setCreating] = useState(false);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, fullName, role: 'teacher', tempPassword, title: regTitle, department: regDepartment, phone, externalId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create teacher');
      toast.success('Teacher created');
      setFullName(''); setEmail(''); setTempPassword(''); setRegTitle(''); setRegDepartment(''); setPhone(''); setExternalId('');
      resetAndFetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create teacher');
    } finally {
      setCreating(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AppShell>
        <PageHeader title="Teachers" subtitle="Browse and register teachers." />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card><CardHeader><CardTitle>Total Teachers</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{tCount}</p></CardContent></Card>
          <Card><CardHeader><CardTitle>Departments</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{departments.length}</p></CardContent></Card>
          <Card><CardHeader><CardTitle>Titles</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{titles.length}</p></CardContent></Card>
        </div>

        {/* Register Form - centered */}
        <Card className="max-w-3xl mx-auto mb-8">
          <CardHeader><CardTitle>Register Teacher</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="tFullName">Full Name</Label>
                <Input id="tFullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="tEmail">Email</Label>
                <Input id="tEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="tPass">Temporary Password</Label>
                <Input id="tPass" type="password" value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="tTitle">Title</Label>
                <Select id="tTitle" value={regTitle} onChange={(e) => setRegTitle(e.target.value)}>
                  <option value="">Select title</option>
                  {titles.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="tDept">Department</Label>
                <Input id="tDept" value={regDepartment} onChange={(e) => setRegDepartment(e.target.value)} placeholder="e.g., Computer Science" />
              </div>
              <div>
                <Label htmlFor="tPhone">Phone</Label>
                <Input id="tPhone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="tExt">Employee ID</Label>
                <Input id="tExt" value={externalId} onChange={(e) => setExternalId(e.target.value)} />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" variant="primary" disabled={creating}>{creating ? 'Creating...' : 'Create Teacher'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Filters (manual Apply) */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <Label htmlFor="search">Search</Label>
            <Input id="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name" />
          </div>
          <div>
            <Label htmlFor="dept">Department</Label>
            <Select id="dept" value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">All</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="ttl">Title</Label>
            <Select id="ttl" value={title} onChange={(e) => setTitle(e.target.value)}>
              <option value="">All</option>
              {titles.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="primary" disabled={loading} onClick={() => resetAndFetch()}>Apply</Button>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader><CardTitle>All Teachers</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8"><LoadingSpinner /></div>
            ) : teachers.length === 0 ? (
              hasFetched ? (
                <EmptyState title="No teachers found" description="Adjust filters and select Apply or use Refresh." />
              ) : (
                <EmptyState title="No results yet" description="Set filters and select Apply to fetch teachers." />
              )
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Email</th>
                      <th className="py-2 pr-4">Department</th>
                      <th className="py-2 pr-4">Title</th>
                      <th className="py-2 pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {teachers.map(t => (
                      <tr key={t.uid}>
                        <td className="py-2 pr-4 font-medium">{t.fullName}</td>
                        <td className="py-2 pr-4">{t.email}</td>
                        <td className="py-2 pr-4">{t.department || '-'}</td>
                        <td className="py-2 pr-4">{t.title || '-'}</td>
                        <td className="py-2 pr-4"><a href={`/admin/users/${t.uid}`} className="text-primary hover:underline">View</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <div className="text-xs text-muted-foreground">Page {pageIndex + 1}</div>
              <div className="flex gap-2">
                <Button variant="outline" disabled={loading} onClick={() => resetAndFetch()}>Refresh</Button>
                <Button variant="outline" disabled={pageIndex === 0 || loading} onClick={() => fetchPage(Math.max(0, pageIndex - 1))}>Previous</Button>
                <Button variant="outline" disabled={!hasNextPage || loading} onClick={() => fetchPage(pageIndex + 1)}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>

      </AppShell>
    </ProtectedRoute>
  );
}
