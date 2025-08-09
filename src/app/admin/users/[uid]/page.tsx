'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { EmptyState } from '@/components/ui/EmptyState';

interface ViewUser {
  uid: string;
  fullName: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  profileCompleted?: boolean;
}

export default function ViewUserPage() {
  const params = useParams();
  const uid = Array.isArray(params?.uid) ? params.uid[0] : (params?.uid as string);
  const [user, setUser] = useState<ViewUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!uid) return;
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          const data = snap.data() as ViewUser;
          setUser({ ...data, uid });
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [uid]);

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AppShell>
        <div className="max-w-3xl">
          <PageHeader title="User Details" subtitle="Read-only view of the user profile." />
          {loading ? (
            <Card><CardContent className="p-6">Loading...</CardContent></Card>
          ) : !user ? (
            <EmptyState title="User not found" description="This user does not exist or has been removed." />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{user.fullName}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-2">
                <p><span className="text-muted-foreground">UID:</span> {user.uid}</p>
                <p><span className="text-muted-foreground">Email:</span> {user.email}</p>
                <p><span className="text-muted-foreground">Role:</span> {user.role}</p>
                <p><span className="text-muted-foreground">Profile Completed:</span> {user.profileCompleted ? 'Yes' : 'No'}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
