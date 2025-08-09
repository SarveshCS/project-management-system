'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Submission } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
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
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, Professor {user?.fullName}!
          </h1>
          <p className="text-muted-foreground">
            Review and grade student project submissions.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent rounded-lg">
                <Pending className="text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Pending Review</h3>
                <p className="text-2xl font-bold text-accent">{pendingSubmissions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-action rounded-lg">
                <CheckCircle className="text-action-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Graded</h3>
                <p className="text-2xl font-bold text-action">{gradedSubmissions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary rounded-lg">
                <Assignment className="text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Total Submissions</h3>
                <p className="text-2xl font-bold text-primary">{submissions.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Submissions - High Priority */}
        {pendingSubmissions.length > 0 && (
          <div className="bg-card border border-border rounded-lg mb-8">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-card-foreground flex items-center gap-2">
                <Grade className="text-accent" />
                Submissions Awaiting Review
                <span className="bg-accent text-accent-foreground text-sm px-2 py-1 rounded-full">
                  {pendingSubmissions.length}
                </span>
              </h2>
            </div>

            <div className="p-6">
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
                          <span className="bg-accent/10 text-accent px-2 py-1 rounded-full text-xs font-medium">
                            Pending
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {submission.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Student: {submission.studentName}</span>
                          <span>Submitted: {submission.submittedAt.toLocaleDateString()}</span>
                          <span>File: {submission.fileName}</span>
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
            </div>
          </div>
        )}

        {/* All Submissions */}
        <div className="bg-card border border-border rounded-lg">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Assignment />
              All Submissions
            </h2>
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
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            submission.status === 'graded'
                              ? 'bg-action/10 text-action'
                              : 'bg-accent/10 text-accent'
                          }`}
                        >
                          {submission.status === 'graded' ? 'Graded' : 'Pending'}
                        </span>
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
                      <Link
                        href={`/grade/${submission.id}`}
                        className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm hover:bg-primary/90 transition-colors"
                      >
                        {submission.status === 'graded' ? 'Review' : 'Grade'}
                      </Link>
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
