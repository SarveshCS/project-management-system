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
import { Grade, Assignment, CheckCircle, Pending } from '@mui/icons-material';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const q = query(
          collection(db, 'submissions'),
          where('assignedTeacherUid', '==', user!.uid),
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
        title={`Welcome back, Professor ${user?.fullName}!`}
        subtitle="Review and grade student project submissions."
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent rounded-lg">
                <Pending className="text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Pending Review</h3>
                <p className="text-2xl font-bold text-accent">{pendingSubmissions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-action rounded-lg">
                <CheckCircle className="text-action-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Graded</h3>
                <p className="text-2xl font-bold text-action">{gradedSubmissions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary rounded-lg">
                <Assignment className="text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Total Submissions</h3>
                <p className="text-2xl font-bold text-primary">{submissions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Pending Submissions - High Priority */}
        {pendingSubmissions.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grade className="text-accent" />
                Submissions Awaiting Review
                <Badge tone="accent" className="ml-2">{pendingSubmissions.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingSubmissions.map((submission) => (
                  <Link
                    key={submission.id}
                    href={`/grade/${submission.id}`}
                    className="block p-4 border border-border rounded-lg hover:bg-muted/50 hover:border-accent transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-foreground group-hover:text-accent transition-colors">
                            {submission.title}
                          </h3>
                          <Badge tone="accent">Pending</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {submission.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Student: {submission.studentName}</span>
                          <span>Submitted: {submission.submittedAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="bg-accent text-accent-foreground px-3 py-1 rounded-md text-sm font-medium group-hover:bg-accent/90 transition-colors">
                          Grade Now
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Submissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Assignment />
              All Submissions
            </CardTitle>
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
                <p className="text-muted-foreground">
                  Student submissions assigned to you will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-foreground">{submission.title}</h3>
                        <Badge tone={submission.status === 'graded' ? 'action' : 'accent'}>
                          {submission.status === 'graded' ? 'Graded' : 'Pending'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {submission.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Student: {submission.studentName}</span>
                        <span>Submitted: {submission.submittedAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {submission.grade && (
                        <span className="text-lg font-bold text-action">
                          {submission.grade}/100
                        </span>
                      )}
                      <Link href={`/grade/${submission.id}`}>
                        <Button size="sm" variant="primary">
                          {submission.status === 'graded' ? 'Review' : 'Grade'}
                        </Button>
                      </Link>
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
