'use client';
// Legacy AppShell — redirects to main app
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function AppShell({ children, title }) {
  const router = useRouter();
  useEffect(() => { router.replace('/'); }, [router]);
  return null;
}
