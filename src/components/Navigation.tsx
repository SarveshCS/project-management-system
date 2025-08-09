'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Dashboard, 
  Assignment, 
  Add, 
  Logout, 
  School,
  AdminPanelSettings,
  AccountCircle
} from '@mui/icons-material';
import { useState, useRef, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';

export const Navigation = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const studentNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: <Dashboard /> },
    { href: '/submissions', label: 'My Submissions', icon: <Assignment /> },
    { href: '/submissions/new', label: 'New Submission', icon: <Add /> },
  ];

  const teacherNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: <Dashboard /> },
  ];

  const adminNavItems = [
    { href: '/admin', label: 'Admin Panel', icon: <AdminPanelSettings /> },
  ];

  const navItems = user?.role === 'student' ? studentNavItems : user?.role === 'teacher' ? teacherNavItems : adminNavItems;

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 bg-background/70 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center gap-2 text-lg sm:text-xl font-bold text-primary">
              <School fontSize="small" />
              Project Nexus
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={pathname === item.href ? 'page' : undefined}
                  className={`cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    pathname === item.href
                      ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="cursor-pointer inline-flex items-center gap-2 px-2 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <AccountCircle />
                <span className="hidden sm:inline text-foreground">Profile</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-lg border border-border bg-card shadow-lg p-3">
                  <div className="mb-3">
                    <p className="text-sm font-medium text-foreground">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground break-all">{user.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">Role: {user.role}</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-1">Theme</p>
                    <ThemeToggle compact />
                  </div>
                  <button
                    onClick={logout}
                    className="w-full cursor-pointer inline-flex items-center justify-center gap-2 rounded-md bg-destructive text-destructive-foreground px-3 py-1.5 text-sm hover:opacity-95"
                  >
                    <Logout fontSize="small" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
