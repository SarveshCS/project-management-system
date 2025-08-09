'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Link as LinkIcon, Assignment } from '@mui/icons-material';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';

const submissionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
  assignedTeacherUid: z.string().min(1, 'Please select a teacher'),
  driveLink: z.string().url('Enter a valid Google Drive link'),
  linkTitle: z.string().max(120, 'Link title must be less than 120 characters').optional(),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

export default function NewSubmissionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
  });

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
        const querySnapshot = await getDocs(q);
        const teachersData = querySnapshot.docs.map(doc => doc.data() as User);
        setTeachers(teachersData);
      } catch (error) {
        console.error('Error fetching teachers:', error);
        toast.error('Failed to load teachers');
      } finally {
        setLoadingTeachers(false);
      }
    };

    fetchTeachers();
  }, []);

  const onSubmit = async (data: SubmissionFormData) => {
    if (!user) return;

    try {
      setIsSubmitting(true);

      // Generate unique submission ID
      const submissionId = doc(collection(db, 'submissions')).id;

      // Create submission document (Drive link only)
      const submissionData = {
        title: data.title,
        description: data.description,
        status: 'pending' as const,
        submittedAt: new Date(),
        studentUid: user.uid,
        studentName: user.fullName,
        assignedTeacherUid: data.assignedTeacherUid,
        driveLink: data.driveLink,
        linkTitle: data.linkTitle || undefined,
      };

      await setDoc(doc(db, 'submissions', submissionId), submissionData);

      toast.success('Submission successful!');
      router.push('/submissions');
    } catch (error) {
      console.error('Error submitting project:', error);
      toast.error('Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <AppShell>
        <div className="max-w-4xl">
          <PageHeader title="New Project Submission" subtitle="Submit your project for review and grading." />
          <Card>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <fieldset disabled={isSubmitting}>
                {/* Project Title */}
                <div>
                  <Label htmlFor="title" className="mb-2">Project Title *</Label>
                  <Input
                    {...register('title')}
                    type="text"
                    id="title"
                    placeholder="Enter your project title"
                  />
                  {errors.title && (
                    <p className="text-destructive text-sm mt-1">{errors.title.message}</p>
                  )}
                </div>

                {/* Project Description */}
                <div>
                  <Label htmlFor="description" className="mb-2">Project Description *</Label>
                  <Textarea
                    {...register('description')}
                    id="description"
                    rows={4}
                    placeholder="Describe your project, its objectives, and key features"
                  />
                  {errors.description && (
                    <p className="text-destructive text-sm mt-1">{errors.description.message}</p>
                  )}
                </div>

                {/* Assign to Teacher */}
                <div>
                  <Label htmlFor="assignedTeacherUid" className="mb-2">Assign to Teacher *</Label>
                  {loadingTeachers ? (
                    <div className="flex items-center gap-2 py-2">
                      <LoadingSpinner size="sm" />
                      <span className="text-muted-foreground">Loading teachers...</span>
                    </div>
                  ) : (
                    <Select
                      {...register('assignedTeacherUid')}
                      id="assignedTeacherUid"
                    >
                      <option value="">Select a teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.uid} value={teacher.uid}>
                          {teacher.fullName} ({teacher.email})
                        </option>
                      ))}
                    </Select>
                  )}
                  {errors.assignedTeacherUid && (
                    <p className="text-destructive text-sm mt-1">{errors.assignedTeacherUid.message}</p>
                  )}
                </div>

                {/* Google Drive Link */}
                <div>
                  <Label htmlFor="driveLink" className="mb-2">Google Drive Link *</Label>
                  <div className="flex gap-2">
                    <Input
                      {...register('driveLink')}
                      type="url"
                      id="driveLink"
                      placeholder="https://drive.google.com/..."
                    />
                    <span className="inline-flex items-center px-3 rounded-md bg-muted text-muted-foreground">
                      <LinkIcon />
                    </span>
                  </div>
                  {errors.driveLink && (
                    <p className="text-destructive text-sm mt-1">{errors.driveLink.message}</p>
                  )}
                </div>

                {/* Optional Link Title */}
                <div>
                  <Label htmlFor="linkTitle" className="mb-2">Link Title (optional)</Label>
                  <Input
                    {...register('linkTitle')}
                    type="text"
                    id="linkTitle"
                    placeholder="e.g., Research_Paper_v1.pdf"
                  />
                  {errors.linkTitle && (
                    <p className="text-destructive text-sm mt-1">{errors.linkTitle.message}</p>
                  )}
                </div>

                {/* Submit Button */}
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
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Assignment />
                        Submit Project
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={() => router.back()}
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
      </AppShell>
    </ProtectedRoute>
  );
}
