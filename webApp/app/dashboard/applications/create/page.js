'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';

export default function CreateAppPage() {
  const [form, setForm] = useState({
    name: '',
    description: '',
    appUrl: '',
    redirectUrl: '',
    logo: '',
  });

  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState({ clientId: false, clientSecret: false });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create app');
      setCreated(data);
      setForm({ name: '', description: '', appUrl: '', redirectUrl: '', logo: '' });
      toast.success('Application created successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied((prev) => ({ ...prev, [key]: true }));
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied((prev) => ({ ...prev, [key]: false })), 2000);
  };

  if (created) {
    return (
      <div>
        <Link
          href="/dashboard/applications/create"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6"
          onClick={() => setCreated(null)}
        >
          <ArrowLeft className="h-4 w-4" /> Create another app
        </Link>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 max-w-2xl">
          <h2 className="text-xl font-semibold text-emerald-400 mb-4">App created</h2>
          <p className="text-gray-400 text-sm mb-6">
            Save your client secret now. It won&apos;t be shown again in full.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Client ID</label>
              <div className="flex items-center gap-2 rounded-lg bg-gray-800/80 px-3 py-2 font-mono text-sm">
                <span className="truncate flex-1">{created.clientId}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(created.clientId, 'clientId')}
                  className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  {copied.clientId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Client Secret</label>
              <div className="flex items-center gap-2 rounded-lg bg-gray-800/80 px-3 py-2 font-mono text-sm">
                <span className="truncate flex-1">
                  {showSecret ? created.clientSecret : '•'.repeat(40)}
                </span>
                <button
                  type="button"
                  onClick={() => setShowSecret((s) => !s)}
                  className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(created.clientSecret, 'clientSecret')}
                  className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  {copied.clientSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Link
              href="/dashboard/applications/manage"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium"
            >
              Manage Apps
            </Link>
            <button
              type="button"
              onClick={() => setCreated(null)}
              className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/5 text-sm"
            >
              Create another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>
      <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
        Create App
      </h1>
      <p className="text-gray-400 mb-8">
        Register a new OAuth application. You will receive a client_id and client_secret.
      </p>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            App name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            className="w-full rounded-lg border border-white/10 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none"
            placeholder="My Application"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
            className="w-full rounded-lg border border-white/10 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none resize-none"
            placeholder="Brief description of your app"
          />
        </div>
        <div>
          <label htmlFor="appUrl" className="block text-sm font-medium text-gray-300 mb-2">
            App URL *
          </label>
          <input
            id="appUrl"
            name="appUrl"
            type="url"
            required
            value={form.appUrl}
            onChange={handleChange}
            className="w-full rounded-lg border border-white/10 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none"
            placeholder="https://myapp.com"
          />
        </div>
        <div>
          <label htmlFor="redirectUrl" className="block text-sm font-medium text-gray-300 mb-2">
            Redirect URL *
          </label>
          <input
            id="redirectUrl"
            name="redirectUrl"
            type="url"
            required
            value={form.redirectUrl}
            onChange={handleChange}
            className="w-full rounded-lg border border-white/10 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none"
            placeholder="https://myapp.com/callback"
          />
        </div>
        <div>
          <label htmlFor="logo" className="block text-sm font-medium text-gray-300 mb-2">
            Logo URL *
          </label>
          <input
            id="logo"
            name="logo"
            type="url"
            required
            value={form.logo}
            onChange={handleChange}
            className="w-full rounded-lg border border-white/10 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none"
            placeholder="https://myapp.com/logo.png"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create App'}
          </button>
          <Link
            href="/dashboard/applications/manage"
            className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/5"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
