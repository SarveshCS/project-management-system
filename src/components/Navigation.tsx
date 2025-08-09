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
  AdminPanelSettings
} from '@mui/icons-material';

export const Navigation = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

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

  const navItems = user.role === 'student' ? studentNavItems : user.role === 'teacher' ? teacherNavItems : adminNavItems;

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold text-primary">
              <School />
              Project Nexus
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}

            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-border">
              <div className="text-sm">
                <p className="font-medium text-foreground">{user.fullName}</p>
                <p className="text-muted-foreground capitalize">{user.role}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                title="Logout"
              >
                <Logout />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
