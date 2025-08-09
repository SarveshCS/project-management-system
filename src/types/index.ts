export interface User {
  uid: string;
  fullName: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  profileCompleted?: boolean;
}

export interface Submission {
  id?: string;
  title: string;
  description: string;
  status: 'pending' | 'graded';
  submittedAt: Date;
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
  gradedAt?: Date;
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
