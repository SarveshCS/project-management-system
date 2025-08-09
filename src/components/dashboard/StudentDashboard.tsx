'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Submission } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
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
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="text-muted-foreground">
            Manage your project submissions and track your progress.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/submissions/new"
            className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-action rounded-lg group-hover:scale-110 transition-transform">
                <Add className="text-action-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">New Submission</h3>
                <p className="text-sm text-muted-foreground">Submit a new project</p>
              </div>
            </div>
          </Link>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent rounded-lg">
                <Pending className="text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Pending</h3>
                <p className="text-2xl font-bold text-accent">{pendingSubmissions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-action rounded-lg">
                <Grade className="text-action-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Graded</h3>
                <p className="text-2xl font-bold text-action">{gradedSubmissions.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-card border border-border rounded-lg">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-card-foreground flex items-center gap-2">
                <Assignment />
                Recent Submissions
              </h2>
              <Link
                href="/submissions"
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                View all
              </Link>
            </div>
          </div>

          <div className="p-6">
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
                <Link
                  href="/submissions/new"
                  className="inline-flex items-center gap-2 bg-action text-action-foreground px-4 py-2 rounded-md hover:bg-action/90 transition-colors"
                >
                  <Add />
                  New Submission
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
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          submission.status === 'graded'
                            ? 'bg-action/10 text-action'
                            : 'bg-accent/10 text-accent'
                        }`}
                      >
                        {submission.status === 'graded' ? 'Graded' : 'Pending'}
                      </span>
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
          </div>
        </div>
      </div>
    </div>
  );
}
