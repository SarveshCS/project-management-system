import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

const normalizeList = (value?: string) =>
  (value || '')
    .split(',')
    .map((v) => v.trim())
    .filter((v) => !!v);

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.ADMIN_SEED_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Server not configured for seeding' }, { status: 500 });
    }

    const provided = req.headers.get('x-seed-secret');
    if (!provided || provided !== secret) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const envEmails = normalizeList(process.env.INITIAL_ADMIN_EMAILS);
    const body = await req.json().catch(() => ({}));
    const bodyEmails = Array.isArray(body?.emails) ? body.emails.map((e: string) => String(e)) : [];
    const emails: string[] = [...new Set([...envEmails, ...bodyEmails])];

    if (emails.length === 0) {
      return NextResponse.json({ error: 'No emails provided' }, { status: 400 });
    }

    const results: Array<{ email: string; status: 'ok' | 'error'; message?: string; uid?: string }> = [];

    for (const email of emails) {
      try {
        const userRecord = await adminAuth.getUserByEmail(email);
        const docRef = adminDb.collection('users').doc(userRecord.uid);
        const snap = await docRef.get();
        const payload = {
          uid: userRecord.uid,
          email: userRecord.email || email,
          fullName: userRecord.displayName || email.split('@')[0],
          role: 'admin' as const,
          profileCompleted: true,
          createdAt: snap.exists ? snap.data()?.createdAt || new Date() : new Date(),
          updatedAt: new Date(),
        };
        await docRef.set(payload, { merge: true });
        results.push({ email, status: 'ok', uid: userRecord.uid });
      } catch (e) {
        const err = e as { code?: string; message?: string };
        const message = err?.code === 'auth/user-not-found' ? 'Auth user not found. Create the user first.' : (err?.message || 'Unknown error');
        results.push({ email, status: 'error', message });
      }
    }

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
