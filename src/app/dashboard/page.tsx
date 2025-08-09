'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role === 'admin') {
      router.replace('/admin');
    } else if (user && user.profileCompleted === false) {
      router.replace('/profile-setup');
    }
  }, [user, router]);

  return (
    <ProtectedRoute>
      {user?.role === 'student' ? <StudentDashboard /> : user?.role === 'teacher' ? <TeacherDashboard /> : null}
    </ProtectedRoute>
  );
}
