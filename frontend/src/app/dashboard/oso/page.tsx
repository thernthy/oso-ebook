'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { OsoStats } from '@/types';
import { 
  Users, 
  Building2, 
  PenTool, 
  BookOpen, 
  AlertCircle,
  TrendingUp 
} from 'lucide-react';
import Link from 'next/link';

export default function OsoDashboard() {
  const [stats, setStats] = useState<OsoStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOsoStats().then((res) => {
      if (res.success && res.data) {
        setStats(res.data);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Partners', value: stats?.totalPartners || 0, icon: Building2, color: 'bg-purple-500' },
    { label: 'Authors', value: stats?.totalAuthors || 0, icon: PenTool, color: 'bg-green-500' },
    { label: 'Readers', value: stats?.totalReaders || 0, icon: BookOpen, color: 'bg-orange-500' },
    { label: 'Books', value: stats?.totalBooks || 0, icon: BookOpen, color: 'bg-pink-500' },
    { label: 'Chapters', value: stats?.totalChapters || 0, icon: BookOpen, color: 'bg-teal-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">OSO Dashboard</h1>
        <p className="text-slate-600">Platform overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white p-4 rounded-xl border shadow-sm">
              <div className={`${card.color} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
                <Icon className="text-white" size={20} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{card.value.toLocaleString()}</p>
              <p className="text-sm text-slate-500">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Pending Verifications */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-amber-500" size={24} />
              <h2 className="text-lg font-semibold">Pending Verifications</h2>
            </div>
            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
              {stats?.pendingVerifications || 0} pending
            </span>
          </div>
        </div>
        <div className="p-6">
          <Link
            href="/oso/verifications"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <span>View all pending verifications</span>
            <TrendingUp size={16} />
          </Link>
        </div>
      </div>

      {/* Recent Signups */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Recent Signups</h2>
        </div>
        <div className="divide-y">
          {stats?.recentSignups?.slice(0, 5).map((user) => (
            <div key={user.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <span className="text-slate-600 font-medium">{user.display_name[0]}</span>
                </div>
                <div>
                  <p className="font-medium">{user.display_name}</p>
                  <p className="text-sm text-slate-500">@{user.username}</p>
                </div>
              </div>
              <span className="text-sm text-slate-500">
                {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          )) || <p className="p-4 text-slate-500">No recent signups</p>}
        </div>
      </div>
    </div>
  );
}
