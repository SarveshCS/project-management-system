'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Submission } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { Add, Assignment, Grade, Pending, Link as LinkIcon, Visibility } from '@mui/icons-material';

export default function SubmissionsPage() {
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

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">My Submissions</h1>
              <p className="text-muted-foreground">
                Track the status of your project submissions.
              </p>
            </div>
            <Link
              href="/submissions/new"
              className="bg-action text-action-foreground px-4 py-2 rounded-md hover:bg-action/90 transition-colors flex items-center gap-2"
            >
              <Add />
              New Submission
            </Link>
          </div>

          <div className="bg-card border border-border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12">
                <Assignment className="mx-auto text-muted-foreground mb-4" style={{ fontSize: 64 }} />
                <h3 className="text-xl font-semibold text-foreground mb-2">No submissions yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start by creating your first project submission.
                </p>
                <Link
                  href="/submissions/new"
                  className="inline-flex items-center gap-2 bg-action text-action-foreground px-6 py-3 rounded-md hover:bg-action/90 transition-colors"
                >
                  <Add />
                  Create Your First Submission
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {submissions.map((submission) => {
                  const hasDrive = !!submission.driveLink;
                  const linkHref = hasDrive ? submission.driveLink! : submission.fileUrl;
                  const linkLabel = hasDrive ? (submission.linkTitle || submission.driveLink) : submission.fileName;
                  return (
                    <div key={submission.id} className="p-6 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-4">
                            <div className={`mt-1 p-2 rounded-lg ${
                              submission.status === 'graded' ? 'bg-action/10' : 'bg-accent/10'
                            }`}>
                              {submission.status === 'graded' ? (
                                <Grade className={`${submission.status === 'graded' ? 'text-action' : 'text-accent'}`} />
                              ) : (
                                <Pending className="text-accent" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="text-lg font-semibold text-foreground truncate">
                                  {submission.title}
                                </h3>
                                <div className="flex items-center gap-3 ml-4">
                                  <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                                      submission.status === 'graded'
                                        ? 'bg-action/10 text-action'
                                        : 'bg-accent/10 text-accent'
                                    }`}
                                  >
                                    {submission.status === 'graded' ? 'Graded' : 'Pending Review'}
                                  </span>
                                  {submission.grade !== undefined && (
                                    <div className="text-right">
                                      <div className="text-2xl font-bold text-action">
                                        {submission.grade}/100
                                      </div>
                                      <div className="text-xs text-muted-foreground">Grade</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <p className="text-muted-foreground mb-3 line-clamp-2">
                                {submission.description}
                              </p>
                              
                              <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                                <div className="flex items-center gap-1">
                                  <span>Submitted:</span>
                                  <span className="font-medium">
                                    {submission.submittedAt.toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <LinkIcon fontSize="small" />
                                  <a href={linkHref} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline truncate">
                                    {linkLabel}
                                  </a>
                                </div>
                              </div>

                              {submission.feedback && (
                                <div className="bg-muted/50 border border-border rounded-lg p-4 mb-4">
                                  <h4 className="font-medium text-foreground mb-2">Teacher Feedback:</h4>
                                  <p className="text-muted-foreground">{submission.feedback}</p>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-3">
                                <Link
                                  href={`/submissions/${submission.id}`}
                                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium"
                                >
                                  <Visibility />
                                  View Details
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
