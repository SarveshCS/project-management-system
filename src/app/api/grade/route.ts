import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify the Firebase Auth token
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Get user profile to verify role
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    if (userData?.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized: Only teachers can grade submissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const { submissionId, grade, feedback } = await request.json();

    // Validate input
    if (!submissionId || grade === undefined || !feedback) {
      return NextResponse.json(
        { error: 'Missing required fields: submissionId, grade, and feedback' },
        { status: 400 }
      );
    }

    if (typeof grade !== 'number' || grade < 0 || grade > 100) {
      return NextResponse.json(
        { error: 'Grade must be a number between 0 and 100' },
        { status: 400 }
      );
    }

    // Verify submission exists and teacher is assigned
    const submissionDoc = await adminDb.collection('submissions').doc(submissionId).get();
    
    if (!submissionDoc.exists) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    const submissionData = submissionDoc.data();
    if (submissionData?.assignedTeacherUid !== decodedToken.uid) {
      return NextResponse.json(
        { error: 'Unauthorized: You are not assigned to grade this submission' },
        { status: 403 }
      );
    }

    // Update the submission with grade and feedback
    await adminDb.collection('submissions').doc(submissionId).update({
      grade: grade,
      feedback: feedback.trim(),
      status: 'graded',
      gradedAt: new Date(),
      gradedBy: decodedToken.uid,
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Grade submitted successfully',
        data: {
          submissionId,
          grade,
          feedback: feedback.trim(),
          gradedAt: new Date().toISOString(),
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in grade API:', error);
    
    // Handle specific Firebase Auth errors
    if (error instanceof Error) {
      if (error.message.includes('auth/id-token-expired')) {
        return NextResponse.json(
          { error: 'Authentication token expired. Please sign in again.' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('auth/argument-error')) {
        return NextResponse.json(
          { error: 'Invalid authentication token' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
