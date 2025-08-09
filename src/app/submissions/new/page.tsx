'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigation } from '@/components/Navigation';
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
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">New Project Submission</h1>
            <p className="text-muted-foreground">
              Submit your project for review and grading.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <fieldset disabled={isSubmitting}>
                {/* Project Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-card-foreground mb-2">
                    Project Title *
                  </label>
                  <input
                    {...register('title')}
                    type="text"
                    id="title"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                    placeholder="Enter your project title"
                  />
                  {errors.title && (
                    <p className="text-destructive text-sm mt-1">{errors.title.message}</p>
                  )}
                </div>

                {/* Project Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-card-foreground mb-2">
                    Project Description *
                  </label>
                  <textarea
                    {...register('description')}
                    id="description"
                    rows={4}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                    placeholder="Describe your project, its objectives, and key features"
                  />
                  {errors.description && (
                    <p className="text-destructive text-sm mt-1">{errors.description.message}</p>
                  )}
                </div>

                {/* Assign to Teacher */}
                <div>
                  <label htmlFor="assignedTeacherUid" className="block text-sm font-medium text-card-foreground mb-2">
                    Assign to Teacher *
                  </label>
                  {loadingTeachers ? (
                    <div className="flex items-center gap-2 py-2">
                      <LoadingSpinner size="sm" />
                      <span className="text-muted-foreground">Loading teachers...</span>
                    </div>
                  ) : (
                    <select
                      {...register('assignedTeacherUid')}
                      id="assignedTeacherUid"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                    >
                      <option value="">Select a teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.uid} value={teacher.uid}>
                          {teacher.fullName} ({teacher.email})
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.assignedTeacherUid && (
                    <p className="text-destructive text-sm mt-1">{errors.assignedTeacherUid.message}</p>
                  )}
                </div>

                {/* Google Drive Link */}
                <div>
                  <label htmlFor="driveLink" className="block text-sm font-medium text-card-foreground mb-2">
                    Google Drive Link *
                  </label>
                  <div className="flex gap-2">
                    <input
                      {...register('driveLink')}
                      type="url"
                      id="driveLink"
                      className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
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
                  <label htmlFor="linkTitle" className="block text-sm font-medium text-card-foreground mb-2">
                    Link Title (optional)
                  </label>
                  <input
                    {...register('linkTitle')}
                    type="text"
                    id="linkTitle"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                    placeholder="e.g., Research_Paper_v1.pdf"
                  />
                  {errors.linkTitle && (
                    <p className="text-destructive text-sm mt-1">{errors.linkTitle.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-action text-action-foreground py-3 px-6 rounded-md font-medium hover:bg-action/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                    className="px-6 py-3 border border-border text-foreground rounded-md hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
