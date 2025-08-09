'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import { Card, CardContent } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function RegisterTeacherPage() {
  const { getAuthToken } = useAuth();
  const [creating, setCreating] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [externalId, setExternalId] = useState('');
  const [title, setTitle] = useState('Professor');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, fullName, role: 'teacher', tempPassword, department, phone, externalId, title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Teacher created');
      setFullName(''); setEmail(''); setTempPassword(''); setDepartment(''); setPhone(''); setExternalId(''); setTitle('Professor');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create teacher';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AppShell>
        <div className="max-w-3xl">
          <PageHeader title="Register Teacher" subtitle="Create a new teacher account." />
          <Card>
            <CardContent className="p-6">
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Temporary Password</Label>
                    <Input type="password" value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} required />
                  </div>
                  <div>
                    <Label>Department</Label>
                    <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Phone</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div>
                    <Label>Employee ID</Label>
                    <Input value={externalId} onChange={(e) => setExternalId(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Title</Label>
                  <Select value={title} onChange={(e) => setTitle(e.target.value)}>
                    <option>Professor</option>
                    <option>Assistant Professor</option>
                    <option>Associate Professor</option>
                    <option>Lecturer</option>
                    <option>Dr.</option>
                    <option>Ms.</option>
                    <option>Mr.</option>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="reset" variant="ghost" onClick={() => { setFullName(''); setEmail(''); setTempPassword(''); setDepartment(''); setPhone(''); setExternalId(''); setTitle('Professor'); }}>Clear</Button>
                  <Button type="submit" variant="primary" disabled={creating}>{creating ? 'Creating...' : 'Create Teacher'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
