export interface User {
  uid: string;
  fullName: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  profileCompleted?: boolean;
  // Admin-managed metadata (optional)
  department?: string;
  phone?: string;
  externalId?: string; // employee or student ID
  // Student-only
  batch?: string;
  course?: string; // e.g., B.Tech, BCA, BSc
  branch?: string; // e.g., CSE, ECE, ME
  // Teacher-only
  title?: string; // Professor, Assistant Professor, Dr., etc.
  // Timestamps (may be Date or Firestore Timestamp serialized)
  createdAt?: Date | string | number;
  updatedAt?: Date | string | number;
}

export interface Submission {
  id?: string;
  title: string;
  description: string;
  status: 'pending' | 'graded';
  // Firestore Timestamp or Date; client code generally converts to Date for display
  submittedAt: Date | { toDate: () => Date } | string | number;
  studentUid: string;
  studentName: string;
  assignedTeacherUid: string;
  // New: Google Drive link
  driveLink: string;
  linkTitle?: string;
  // Legacy (optional, kept for backward compatibility)
  fileUrl?: string;
  fileName?: string;
  grade?: number;
  feedback?: string;
  gradedAt?: Date | { toDate: () => Date } | string | number;
  gradedBy?: string;
}

export interface CreateSubmissionData {
  title: string;
  description: string;
  assignedTeacherUid: string;
  driveLink: string;
  linkTitle?: string;
}

export interface GradeSubmissionData {
  submissionId: string;
  grade: number;
  feedback: string;
}
