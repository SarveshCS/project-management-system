'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Submission } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  Assignment, 
  Grade, 
  Person, 
  DateRange,
  Link as LinkIcon,
  ArrowBack,
  Pending,
  CheckCircle 
} from '@mui/icons-material';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function SubmissionDetailsPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const submissionId = params.submissionId as string;
  
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const submissionDoc = await getDoc(doc(db, 'submissions', submissionId));
        
        if (!submissionDoc.exists()) {
          router.push('/submissions');
          return;
        }

        const submissionData = {
          id: submissionDoc.id,
          ...submissionDoc.data(),
          submittedAt: submissionDoc.data()?.submittedAt.toDate(),
        } as Submission;

        // Verify user owns this submission (for students)
        if (user?.role === 'student' && submissionData.studentUid !== user.uid) {
          router.push('/submissions');
          return;
        }

        setSubmission(submissionData);
      } catch (error) {
        console.error('Error fetching submission:', error);
        router.push('/submissions');
      } finally {
        setLoading(false);
      }
    };

    if (user && submissionId) {
      fetchSubmission();
    }
  }, [user, submissionId, router]);

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!submission) {
    return null; // Will redirect
  }

  const hasDrive = !!submission.driveLink;
  const linkHref = hasDrive ? submission.driveLink! : submission.fileUrl;
  const linkLabel = hasDrive ? (submission.linkTitle || submission.driveLink) : submission.fileName;

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/submissions"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4"
            >
              <ArrowBack />
              Back to Submissions
            </Link>
            <h1 className="text-3xl font-bold text-foreground mb-2">Submission Details</h1>
          </div>

          <div className="space-y-6">
            {/* Status Header */}
            <Card>
              <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-card-foreground">
                  {submission.title}
                </h2>
                <div className="flex items-center gap-4">
                  <Badge tone={submission.status === 'graded' ? 'action' : 'accent'} className="flex items-center gap-2">
                    {submission.status === 'graded' ? (<><CheckCircle /> Graded</>) : (<><Pending /> Pending Review</>)}
                  </Badge>
                  {submission.grade !== undefined && (
                    <div className="text-right">
                      <div className="text-3xl font-bold text-action">
                        {submission.grade}/100
                      </div>
                      <div className="text-xs text-muted-foreground">Final Grade</div>
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-muted-foreground text-lg">
                {submission.description}
              </p>
              </CardContent>
            </Card>

            {/* Submission Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Assignment /> Submission Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Person className="text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Student</p>
                    <p className="font-medium text-foreground">{submission.studentName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DateRange className="text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted</p>
                    <p className="font-medium text-foreground">
                      {submission.submittedAt.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 md:col-span-2">
                  <LinkIcon className="text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{hasDrive ? 'Drive Link' : 'File'}</p>
                    <div className="flex items-center justify-between">
                      <a
                        href={linkHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline truncate"
                      >
                        {linkLabel}
                      </a>
                      <a href={linkHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                        <Button size="sm" variant="primary" leftIcon={<LinkIcon />}>{hasDrive ? 'Open Link' : 'Open File'}</Button>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              </CardContent>
            </Card>

            {/* Feedback Section */}
            {submission.feedback && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Grade /> Teacher Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <p className="text-foreground whitespace-pre-wrap">{submission.feedback}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status Message */}
            {submission.status === 'pending' && (
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Pending className="text-accent" />
                  <h3 className="font-semibold text-accent">Awaiting Review</h3>
                </div>
                <p className="text-muted-foreground">
                  Your submission has been received and is currently being reviewed by your assigned teacher. 
                  You will be notified once feedback and grading are available.
                </p>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
