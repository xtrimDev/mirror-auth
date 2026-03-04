'use client';

import { useEffect, useState } from 'react';
import { User } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (isMounted) setUser(data?.user ?? null);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="max-w-2xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <User className="h-5 w-5 text-blue-300" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Profile
          </h1>
          <p className="text-gray-400 text-sm">Your account details.</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-gray-800/40 p-6">
        {loading ? (
          <div className="text-gray-400">Loading…</div>
        ) : !user ? (
          <div className="text-gray-400">Not signed in.</div>
        ) : (
          <dl className="grid gap-4">
            <div className="grid gap-1">
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">Full name</dt>
              <dd className="text-white">{user.fullName || '—'}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">Email</dt>
              <dd className="text-white">{user.email || '—'}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">Mobile</dt>
              <dd className="text-white">{user.mobileNumber || '—'}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}

