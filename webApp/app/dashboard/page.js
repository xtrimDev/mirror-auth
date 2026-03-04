'use client';

import Link from 'next/link';
import { PlusCircle, Settings, Key, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
        Dashboard
      </h1>
      <p className="text-gray-400 mb-10">
        Manage your OAuth applications and tokens.
      </p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/dashboard/applications/create"
          className="group block p-6 rounded-xl border border-white/10 bg-gray-800/50 hover:border-blue-500/50 hover:bg-gray-800/80 transition-all"
        >
          <PlusCircle className="h-10 w-10 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-lg font-semibold mb-2">Create App</h2>
          <p className="text-gray-400 text-sm mb-4">
            Register a new OAuth application and get client credentials.
          </p>
          <span className="text-blue-400 text-sm font-medium flex items-center gap-1">
            Create <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>
        <Link
          href="/dashboard/applications/manage"
          className="group block p-6 rounded-xl border border-white/10 bg-gray-800/50 hover:border-blue-500/50 hover:bg-gray-800/80 transition-all"
        >
          <Settings className="h-10 w-10 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-lg font-semibold mb-2">Manage Apps</h2>
          <p className="text-gray-400 text-sm mb-4">
            View, edit, and manage your registered applications.
          </p>
          <span className="text-purple-400 text-sm font-medium flex items-center gap-1">
            Manage <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>
      </div>
    </div>
  );
}
