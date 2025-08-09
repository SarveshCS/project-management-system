'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login/student');
  }, [router]);
  return null;
}
