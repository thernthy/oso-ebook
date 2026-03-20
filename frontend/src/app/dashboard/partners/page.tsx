'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PartnerStats } from '@/types';
import { Users, BookOpen, Eye, DollarSign, Plus } from 'lucide-react';
import Link from 'next/link';

export default function PartnerDashboard() {
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPartnerStats().then((res) => {
      if (res.success && res.data) {
        setStats(res.data);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Partner Dashboard</h1>
          <p className="text-slate-600">Manage your authors and content</p>
        </div>
        <Link
          href="/partners/authors/new"
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800"
        >
          <Plus size={20} />
          <span>Add Author</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="bg-purple-500 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
            <Users className="text-white" size={20} />
          </div>
          <p className="text-2xl font-bold">{stats?.totalAuthors || 0}</p>
          <p className="text-sm text-slate-500">Authors</p>
        </div>

        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="bg-blue-500 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
            <BookOpen className="text-white" size={20} />
          </div>
          <p className="text-2xl font-bold">{stats?.totalBooks || 0}</p>
          <p className="text-sm text-slate-500">Books</p>
        </div>

        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="bg-green-500 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
            <Eye className="text-white" size={20} />
          </div>
          <p className="text-2xl font-bold">{(stats?.totalReads || 0).toLocaleString()}</p>
          <p className="text-sm text-slate-500">Total Reads</p>
        </div>

        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="bg-amber-500 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
            <DollarSign className="text-white" size={20} />
          </div>
          <p className="text-2xl font-bold">${(stats?.commissionEarned || 0).toFixed(2)}</p>
          <p className="text-sm text-slate-500">Commission</p>
        </div>
      </div>

      {/* Recent Authors */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">My Authors</h2>
          <Link href="/partners/authors" className="text-slate-600 hover:text-slate-900">View all →</Link>
        </div>
        <div className="divide-y">
          {stats?.recentAuthors?.map((author) => (
            <div key={author.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <span className="text-slate-600 font-medium">{author.pen_name?.[0] || 'A'}</span>
                </div>
                <div>
                  <p className="font-medium">{author.pen_name || author.user?.display_name}</p>
                  <p className="text-sm text-slate-500">{author.total_books} books • {author.total_reads} reads</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                author.is_verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {author.is_verified ? 'Verified' : 'Pending'}
              </span>
            </div>
          )) || <p className="p-4 text-slate-500">No authors yet</p>}
        </div>
      </div>
    </div>
  );
}
