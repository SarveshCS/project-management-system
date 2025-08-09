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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { 
  Assignment, 
  Grade, 
  Person, 
  DateRange,
  Link as LinkIcon,
  ArrowBack 
} from '@mui/icons-material';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { formatDateTime, toDate } from '@/lib/date';

const gradeSchema = z.object({
  grade: z.number().min(0, 'Grade must be at least 0').max(100, 'Grade must be at most 100'),
  feedback: z.string().min(1, 'Feedback is required').max(1000, 'Feedback must be less than 1000 characters'),
});

type GradeFormData = z.infer<typeof gradeSchema>;

export default function GradingPage() {
  const auth = useAuth();
  const { user } = auth;
  const params = useParams();
  const router = useRouter();
  const submissionId = params.submissionId as string;
  
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<GradeFormData>({
    resolver: zodResolver(gradeSchema),
  });

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const submissionDoc = await getDoc(doc(db, 'submissions', submissionId));
        
        if (!submissionDoc.exists()) {
          toast.error('Submission not found');
          router.push('/dashboard');
          return;
        }

        const submissionData = {
          id: submissionDoc.id,
          ...submissionDoc.data(),
          submittedAt: toDate(submissionDoc.data()?.submittedAt),
        } as Submission;

        // Verify teacher is assigned to this submission
        if (submissionData.assignedTeacherUid !== user?.uid) {
          toast.error('You are not authorized to grade this submission');
          router.push('/dashboard');
          return;
        }

        setSubmission(submissionData);

        // Pre-populate form if already graded
        if (submissionData.grade !== undefined) {
          setValue('grade', submissionData.grade);
        }
        if (submissionData.feedback) {
          setValue('feedback', submissionData.feedback);
        }
      } catch (error) {
        console.error('Error fetching submission:', error);
        toast.error('Failed to load submission');
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (user && submissionId) {
      fetchSubmission();
    }
  }, [user, submissionId, router, setValue]);

  const onSubmit = async (data: GradeFormData) => {
    if (!submission) return;

    try {
      setIsSubmitting(true);

      // Get Firebase auth token
      const token = await auth.getAuthToken();
      if (!token) {
        toast.error('Authentication required. Please sign in again.');
        return;
      }

      const response = await fetch('/api/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          submissionId: submission.id,
          grade: data.grade,
          feedback: data.feedback,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit grade');
      }

      toast.success('Grade submitted successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error submitting grade:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit grade. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['teacher']}>
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

  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <AppShell>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4"
            >
              <ArrowBack />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-foreground mb-2">Grade Submission</h1>
            <p className="text-muted-foreground">
              Review and provide feedback for this student submission.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Submission Details - Left Column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Assignment /> Submission Details</CardTitle>
                </CardHeader>
                <CardContent className="p-6">

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      {submission.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {submission.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-sm">
                      <Person className="text-muted-foreground" />
                      <span className="text-muted-foreground">Student:</span>
                      <span className="font-medium text-foreground">{submission.studentName}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <DateRange className="text-muted-foreground" />
                      <span className="text-muted-foreground">Submitted:</span>
                      <span className="font-medium text-foreground">
                        {formatDateTime(submission.submittedAt, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm sm:col-span-2">
                      <LinkIcon className="text-muted-foreground" />
                      <span className="text-muted-foreground">Drive:</span>
                      <a
                        href={submission.driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline truncate"
                      >
                        {submission.linkTitle || submission.driveLink}
                      </a>
                    </div>
                  </div>

                  <div className="pt-4">
                    <a href={submission.driveLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                      <Button size="sm" variant="primary" leftIcon={<LinkIcon />}>Open Drive Link</Button>
                    </a>
                  </div>

                  {submission.status === 'graded' && (
                    <div className="bg-action/10 border border-action/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Grade className="text-action" />
                        <span className="font-medium text-action">Currently Graded</span>
                      </div>
                      <div className="text-2xl font-bold text-action mb-2">
                        {submission.grade}/100
                      </div>
                      {submission.feedback && (
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">Previous Feedback:</p>
                          <p className="text-sm text-muted-foreground">{submission.feedback}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                </CardContent>
              </Card>
            </div>

            {/* Grading Form - Right Column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Grade /> {submission.status === 'graded' ? 'Update Grade' : 'Assign Grade'}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <fieldset disabled={isSubmitting}>
                    {/* Grade Input */}
                    <div>
                      <Label htmlFor="grade" className="mb-2">Grade (0-100) *</Label>
                      <Input
                        {...register('grade', { valueAsNumber: true })}
                        type="number"
                        id="grade"
                        min="0"
                        max="100"
                        step="1"
                        placeholder="Enter grade (0-100)"
                      />
                      {errors.grade && (
                        <p className="text-destructive text-sm mt-1">{errors.grade.message}</p>
                      )}
                    </div>

                    {/* Feedback Textarea */}
                    <div>
                      <Label htmlFor="feedback" className="mb-2">Feedback *</Label>
                      <Textarea
                        {...register('feedback')}
                        id="feedback"
                        rows={8}
                        placeholder="Provide detailed feedback on the student's work, including strengths, areas for improvement, and suggestions for future projects..."
                      />
                      {errors.feedback && (
                        <p className="text-destructive text-sm mt-1">{errors.feedback.message}</p>
                      )}
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-4 pt-6">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1"
                        variant="action"
                      >
                        {isSubmitting ? (
                          <>
                            <LoadingSpinner size="sm" className="border-action-foreground border-t-transparent" />
                            {submission.status === 'graded' ? 'Updating...' : 'Submitting...'}
                          </>
                        ) : (
                          <>
                            <Grade />
                            {submission.status === 'graded' ? 'Update Grade' : 'Submit Grade'}
                          </>
                        )}
                      </Button>
                      
                      <Button
                        type="button"
                        onClick={() => router.push('/dashboard')}
                        disabled={isSubmitting}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </fieldset>
                </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
