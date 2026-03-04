'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  LayoutDashboard,
  Layers,
  Key,
  PlusCircle,
  Settings,
  LogOut,
  User,
} from 'lucide-react';

const nav = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Applications',
    children: [
      { label: 'Create App', href: '/dashboard/applications/create', icon: PlusCircle },
      { label: 'Manage Apps', href: '/dashboard/applications/manage', icon: Settings },
    ],
  }
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  const isActive = (href) => pathname === href;

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted) setUser(data?.user ?? null);
      } catch {
        // ignore
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const userDisplayName = useMemo(() => {
    const name = user?.fullName?.trim();
    return name && name.length > 0 ? name : 'Profile';
  }, [user]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      try {
        localStorage.removeItem('authToken');
      } catch {
        // ignore
      }
      window.location.href = '/account/login';
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-black to-gray-900 text-white">
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/10 bg-gray-900/95 backdrop-blur-md">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center gap-2">
            <img
                  src="/logo.png"
                  alt="MirrorAuth Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
                <span className="font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  MirrorAuth
                </span>
            </div>
          </Link>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {nav.map((item) => (
            <div key={item.label}>
              {item.href ? (
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                  {item.label}
                </Link>
              ) : (
                <>
                  <div className="flex items-center gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {item.label}
                  </div>
                  {item.children?.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`ml-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        isActive(child.href)
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {child.icon && <child.icon className="h-4 w-4 shrink-0" />}
                      {child.label}
                    </Link>
                  ))}
                </>
              )}
            </div>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4">
          <div className="flex flex-col gap-1">
            <Link
              href="/dashboard/profile"
              title={userDisplayName}
              className="group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <User className="h-4 w-4" />
              Profile
              <span className="pointer-events-none absolute bottom-full left-3 mb-2 hidden rounded-md border border-white/10 bg-black/90 px-2 py-1 text-xs text-gray-200 shadow-lg group-hover:block">
                {userDisplayName}
              </span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>
      <main className="pl-64 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
