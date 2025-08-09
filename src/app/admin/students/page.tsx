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

type StudentRow = { uid: string; fullName: string; email: string; course?: string; branch?: string; batch?: string; department?: string };

const COURSE_OPTIONS = ['B.Tech', 'BCA', 'BSc', 'B.Com', 'BA'];
const BRANCH_OPTIONS = ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT'];

export default function AdminStudentsPage() {
  const { getAuthToken } = useAuth();

  const [search, setSearch] = useState('');
  const [course, setCourse] = useState('');
  const [branch, setBranch] = useState('');
  const [batch, setBatch] = useState('');
  const [department] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageStarts, setPageStarts] = useState<Array<DocumentSnapshot | null>>([null]);
  const pageSize = 20;

  const [sCount, setSCount] = useState(0);

  const buildQuery = useCallback((startDoc?: DocumentSnapshot | null) => {
    const constraints: QueryConstraint[] = [where('role', '==', 'student')];
    if (course) constraints.push(where('course', '==', course));
    if (branch) constraints.push(where('branch', '==', branch));
    if (batch) constraints.push(where('batch', '==', batch));
    if (department) constraints.push(where('department', '==', department));
    constraints.push(orderBy('fullName'));
    const term = search.trim();
    if (term) { constraints.push(startAt(term)); constraints.push(endAt(term + '\\uf8ff')); }
    if (startDoc) constraints.push(startAfter(startDoc));
    constraints.push(limit(pageSize));
    return query(collection(db, 'users'), ...constraints);
  }, [search, course, branch, batch, department]);

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
          course: typeof data.course === 'string' ? data.course : undefined,
          branch: typeof data.branch === 'string' ? data.branch : undefined,
          batch: typeof data.batch === 'string' ? data.batch : undefined,
          department: typeof data.department === 'string' ? data.department : undefined,
        };
      });
      setStudents(list);
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

  const resetAndFetch = useCallback(() => { setPageStarts([null]); fetchPage(0); }, [fetchPage]);

  // Manual fetch only; use Apply/Refresh below

  useEffect(() => {
    (async () => {
      const cnt = await getCountFromServer(query(collection(db, 'users'), where('role', '==', 'student')));
      setSCount(cnt.data().count);
      try {
        const depSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student'), orderBy('department'), limit(100)));
        const depSet = new Set<string>();
        depSnap.docs.forEach(d => { const raw = d.data() as Record<string, unknown>; const v = raw.department; if (typeof v === 'string' && v.trim()) depSet.add(v.trim()); });
        setDepartments(Array.from(depSet).sort((a, b) => a.localeCompare(b)));
      } catch {}
  // Do not auto-fetch; wait for Apply
    })();
  }, [resetAndFetch]);

  // Register student form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [regCourse, setRegCourse] = useState('');
  const [regBranch, setRegBranch] = useState('');
  const [regBatch, setRegBatch] = useState('');
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
        body: JSON.stringify({ email, fullName, role: 'student', tempPassword, course: regCourse, branch: regBranch, batch: regBatch, department: regDepartment, phone, externalId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create student');
      toast.success('Student created');
      setFullName(''); setEmail(''); setTempPassword(''); setRegCourse(''); setRegBranch(''); setRegBatch(''); setRegDepartment(''); setPhone(''); setExternalId('');
      resetAndFetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create student');
    } finally {
      setCreating(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AppShell>
        <PageHeader title="Students" subtitle="Browse and register students." />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card><CardHeader><CardTitle>Total Students</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{sCount}</p></CardContent></Card>
          <Card><CardHeader><CardTitle>Courses</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{COURSE_OPTIONS.length}</p></CardContent></Card>
          <Card><CardHeader><CardTitle>Branches</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{BRANCH_OPTIONS.length}</p></CardContent></Card>
          <Card><CardHeader><CardTitle>Departments</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{departments.length}</p></CardContent></Card>
        </div>

        {/* Register Form - centered */}
        <Card className="max-w-3xl mx-auto mb-8">
          <CardHeader><CardTitle>Register Student</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="sFullName">Full Name</Label>
                <Input id="sFullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="sEmail">Email</Label>
                <Input id="sEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="sPass">Temporary Password</Label>
                <Input id="sPass" type="password" value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="sCourse">Course</Label>
                <Select id="sCourse" value={regCourse} onChange={(e) => setRegCourse(e.target.value)}>
                  <option value="">Select course</option>
                  {COURSE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="sBranch">Branch</Label>
                <Select id="sBranch" value={regBranch} onChange={(e) => setRegBranch(e.target.value)}>
                  <option value="">Select branch</option>
                  {BRANCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="sBatch">Batch</Label>
                <Input id="sBatch" value={regBatch} onChange={(e) => setRegBatch(e.target.value)} placeholder="e.g., 2025" />
              </div>
              <div>
                <Label htmlFor="sDept">Department</Label>
                <Input id="sDept" value={regDepartment} onChange={(e) => setRegDepartment(e.target.value)} placeholder="e.g., Engineering" />
              </div>
              <div>
                <Label htmlFor="sPhone">Phone</Label>
                <Input id="sPhone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="sExt">Student ID</Label>
                <Input id="sExt" value={externalId} onChange={(e) => setExternalId(e.target.value)} />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" variant="primary" disabled={creating}>{creating ? 'Creating...' : 'Create Student'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Filters (manual Apply) */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <Label htmlFor="search">Search</Label>
            <Input id="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name" />
          </div>
          <div>
            <Label htmlFor="course">Course</Label>
            <Select id="course" value={course} onChange={(e) => setCourse(e.target.value)}>
              <option value="">All</option>
              {COURSE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="branch">Branch</Label>
            <Select id="branch" value={branch} onChange={(e) => setBranch(e.target.value)}>
              <option value="">All</option>
              {BRANCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="batch">Batch</Label>
            <Input id="batch" value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="e.g., 2025" />
          </div>
          <div className="flex items-end">
            <Button variant="primary" disabled={loading} onClick={() => resetAndFetch()}>Apply</Button>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader><CardTitle>All Students</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8"><LoadingSpinner /></div>
            ) : students.length === 0 ? (
              hasFetched ? (
                <EmptyState title="No students found" description="Adjust filters and select Apply or use Refresh." />
              ) : (
                <EmptyState title="No results yet" description="Set filters and select Apply to fetch students." />
              )
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Email</th>
                      <th className="py-2 pr-4">Course</th>
                      <th className="py-2 pr-4">Branch</th>
                      <th className="py-2 pr-4">Batch</th>
                      <th className="py-2 pr-4">Department</th>
                      <th className="py-2 pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {students.map(s => (
                      <tr key={s.uid}>
                        <td className="py-2 pr-4 font-medium">{s.fullName}</td>
                        <td className="py-2 pr-4">{s.email}</td>
                        <td className="py-2 pr-4">{s.course || '-'}</td>
                        <td className="py-2 pr-4">{s.branch || '-'}</td>
                        <td className="py-2 pr-4">{s.batch || '-'}</td>
                        <td className="py-2 pr-4">{s.department || '-'}</td>
                        <td className="py-2 pr-4"><a href={`/admin/users/${s.uid}`} className="text-primary hover:underline">View</a></td>
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
