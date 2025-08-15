import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const normalizeAllowedDomain = (value?: string) => {
  const v = (value || '').trim();
  if (!v) return '';
  const lower = v.toLowerCase();
  return lower === 'false' || lower === '0' || lower === 'no' ? '' : v;
};

const allowedDomain = normalizeAllowedDomain(process.env.ALLOWED_EMAIL_DOMAIN || process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN);

export async function POST(req: NextRequest) {
  try {
    // Verify Authorization header and admin role
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const adminUserSnap = await adminDb.collection('users').doc(decodedToken.uid).get();
    const adminUserData = adminUserSnap.data() as { role?: string } | undefined;
    if (!adminUserData || adminUserData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

  const body = await req.json();
  const email: string = body.email;
  const fullName: string = body.fullName;
  const role: 'student' | 'teacher' = body.role;
  const tempPassword: string = body.tempPassword;
  const department: string | undefined = body.department?.trim() || undefined;
  const phone: string | undefined = body.phone?.trim() || undefined;
  const externalId: string | undefined = body.externalId?.trim() || undefined;
  const batch: string | undefined = body.batch?.trim() || undefined;
  const course: string | undefined = body.course?.trim() || undefined;
  const branch: string | undefined = body.branch?.trim() || undefined;
  const title: string | undefined = body.title?.trim() || undefined;

    if (!email || !fullName || !role || !tempPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Admin UI only supports student/teacher; enforce here too
    if (!['student', 'teacher'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (allowedDomain && !String(email).toLowerCase().endsWith(`@${allowedDomain.toLowerCase()}`)) {
      return NextResponse.json({ error: `Only ${allowedDomain} emails are allowed` }, { status: 400 });
    }

    // Create auth user
    const userRecord = await adminAuth.createUser({
      email,
      password: tempPassword,
      displayName: fullName,
      emailVerified: false,
      disabled: false,
    });

    // Build Firestore user doc without undefined values
    const userDoc: Record<string, unknown> = {
      uid: userRecord.uid,
      email,
      fullName,
      role,
      profileCompleted: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (department) userDoc.department = department;
    if (phone) userDoc.phone = phone;
    if (externalId) userDoc.externalId = externalId;

    if (role === 'student') {
      if (batch) userDoc.batch = batch;
      if (course) userDoc.course = course;
      if (branch) userDoc.branch = branch;
    }

    if (role === 'teacher') {
      if (title) userDoc.title = title;
    }

    await adminDb.collection('users').doc(userRecord.uid).set(userDoc);

    return NextResponse.json({ success: true, uid: userRecord.uid, role, email, fullName }, { status: 201 });
  } catch (error: unknown) {
    let message = 'Internal server error';
    let status = 500;
    const err = error as { errorInfo?: { code?: string; message?: string }; message?: string } | undefined;
    const code = err?.errorInfo?.code;
    if (code === 'auth/email-already-exists') {
      message = 'Email already exists';
      status = 409;
    } else if (err?.message) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status });
  }
}
