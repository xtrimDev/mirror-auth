'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  PlusCircle,
  Pencil,
  Trash2,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function ManageAppsPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/dashboard/apps');
      const data = await res.json();
      if (res.ok) setApps(data);
    } catch (err) {
      toast.error('Failed to load apps');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleEdit = (app) => {
    setEditingId(app._id);
    setEditForm({
      _id: app._id,
      name: app.name,
      description: app.description || '',
      appUrl: app.appUrl,
      redirectUrl: app.redirectUrl,
      logo: app.logo || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      const res = await fetch(`/api/dashboard/apps/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Update failed');
      }
      toast.success('App updated');
      setEditingId(null);
      fetchApps();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/dashboard/apps/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      toast.success('App deleted');
      fetchApps();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Manage Apps
          </h1>
          <p className="text-gray-400">View and edit your OAuth applications.</p>
        </div>
        <Link
          href="/dashboard/applications/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 font-medium text-white hover:opacity-90"
        >
          <PlusCircle className="h-4 w-4" /> Create App
        </Link>
      </div>

      {apps.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-gray-800/30 p-12 text-center">
          <p className="text-gray-400 mb-4">No applications yet.</p>
          <Link
            href="/dashboard/applications/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium"
          >
            <PlusCircle className="h-4 w-4" /> Create your first app
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map((app) => (
            <div
              key={app._id}
              className="rounded-xl border border-white/10 bg-gray-800/30 p-5 hover:border-white/20 transition-colors"
            >
              {editingId === app._id ? (
                <div className="space-y-4">
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-gray-800/50 px-3 py-2 text-white text-lg font-semibold"
                    placeholder="App name"
                  />
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="w-full rounded-lg border border-white/10 bg-gray-800/50 px-3 py-2 text-white text-sm resize-none"
                    placeholder="Description"
                  />
                  <input
                    value={editForm.appUrl}
                    onChange={(e) => setEditForm((f) => ({ ...f, appUrl: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-gray-800/50 px-3 py-2 text-white text-sm"
                    placeholder="App URL"
                  />
                  <input
                    value={editForm.redirectUrl}
                    onChange={(e) => setEditForm((f) => ({ ...f, redirectUrl: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-gray-800/50 px-3 py-2 text-white text-sm"
                    placeholder="Redirect URL"
                  />
                  <input
                    value={editForm.logo}
                    onChange={(e) => setEditForm((f) => ({ ...f, logo: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-gray-800/50 px-3 py-2 text-white text-sm"
                    placeholder="Logo URL"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/5 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 min-w-0">
                      {app.logo ? (
                        <img
                          src={app.logo}
                          alt=""
                          className="h-12 w-12 rounded-lg object-cover shrink-0 bg-gray-700"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center shrink-0">
                          <Key className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold truncate">{app.name}</h2>
                        {app.description && (
                          <p className="text-gray-400 text-sm mt-0.5 line-clamp-2">{app.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <span className="truncate">{app.appUrl}</span>
                          <a
                            href={app.appUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline shrink-0"
                          >
                            <ExternalLink className="h-3 w-3 inline" />
                          </a>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Redirect: {app.redirectUrl}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEdit(app)}
                        className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(app._id, app.name)}
                        className="p-2 rounded-lg border border-white/10 hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
