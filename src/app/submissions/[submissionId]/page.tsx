'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigation } from '@/components/Navigation';
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
        <div className="min-h-screen bg-background">
          <Navigation />
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </div>
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
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-card-foreground">
                  {submission.title}
                </h2>
                <div className="flex items-center gap-4">
                  <span
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                      submission.status === 'graded'
                        ? 'bg-action/10 text-action'
                        : 'bg-accent/10 text-accent'
                    }`}
                  >
                    {submission.status === 'graded' ? (
                      <>
                        <CheckCircle />
                        Graded
                      </>
                    ) : (
                      <>
                        <Pending />
                        Pending Review
                      </>
                    )}
                  </span>
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
            </div>

            {/* Submission Info */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <Assignment />
                Submission Information
              </h3>

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
                      <a
                        href={linkHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm"
                      >
                        <LinkIcon />
                        {hasDrive ? 'Open Link' : 'Open File'}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback Section */}
            {submission.feedback && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
                  <Grade />
                  Teacher Feedback
                </h3>
                
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <p className="text-foreground whitespace-pre-wrap">{submission.feedback}</p>
                </div>
              </div>
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
      </div>
    </ProtectedRoute>
  );
}
