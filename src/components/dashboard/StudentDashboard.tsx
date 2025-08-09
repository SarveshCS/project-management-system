'use client';

import { useAuth } from '@/contexts/AuthContext';
import AppShell from '@/components/AppShell';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Submission } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Add, Assignment, Grade, Pending } from '@mui/icons-material';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const q = query(
          collection(db, 'submissions'),
          where('studentUid', '==', user!.uid),
          orderBy('submittedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const submissionsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          submittedAt: doc.data().submittedAt.toDate(),
        })) as Submission[];
        setSubmissions(submissionsData);
      } catch (error) {
        console.error('Error fetching submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSubmissions();
    }
  }, [user]);

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const gradedSubmissions = submissions.filter(s => s.status === 'graded');

  return (
    <AppShell>
      <PageHeader
        title={`Welcome back, ${user?.fullName}!`}
        subtitle="Manage your project submissions and track your progress."
        actions={(
          <Link href="/submissions/new">
            <Button variant="action" leftIcon={<Add />}>New Submission</Button>
          </Link>
        )}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/submissions/new" className="group">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-action rounded-lg group-hover:scale-110 transition-transform">
                  <Add className="text-action-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">New Submission</h3>
                  <p className="text-sm text-muted-foreground">Submit a new project</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent rounded-lg">
                <Pending className="text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Pending</h3>
                <p className="text-2xl font-bold text-accent">{pendingSubmissions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-action rounded-lg">
                <Grade className="text-action-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Graded</h3>
                <p className="text-2xl font-bold text-action">{gradedSubmissions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Assignment />
            Recent Submissions
          </CardTitle>
          <Link href="/submissions" className="text-primary hover:text-primary/80 text-sm font-medium">
            View all
          </Link>
        </CardHeader>

        <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-8">
                <Assignment className="mx-auto text-muted-foreground mb-4" style={{ fontSize: 48 }} />
                <h3 className="text-lg font-medium text-foreground mb-2">No submissions yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by creating your first project submission.
                </p>
                <Link href="/submissions/new">
                  <Button variant="action" leftIcon={<Add />}>New Submission</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.slice(0, 5).map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{submission.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {submission.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Submitted {submission.submittedAt.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge tone={submission.status === 'graded' ? 'action' : 'accent'}>
                        {submission.status === 'graded' ? 'Graded' : 'Pending'}
                      </Badge>
                      {submission.grade && (
                        <span className="text-lg font-bold text-action">
                          {submission.grade}/100
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
