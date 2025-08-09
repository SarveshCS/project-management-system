import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

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

    const { email, fullName, role, tempPassword } = await req.json();

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

    // Create Firestore user doc
    await adminDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      fullName,
      role,
      profileCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, uid: userRecord.uid }, { status: 201 });
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
