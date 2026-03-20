'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AuthorStats, Book } from '@/types';
import { BookOpen, FileText, Eye, Heart, Users, Plus } from 'lucide-react';
import Link from 'next/link';

export default function AuthorDashboard() {
  const [stats, setStats] = useState<AuthorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAuthorStats().then((res) => {
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
          <h1 className="text-2xl font-bold text-slate-900">Author Dashboard</h1>
          <p className="text-slate-600">Manage your books and track performance</p>
        </div>
        <Link
          href="/authors/books/new"
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800"
        >
          <Plus size={20} />
          <span>New Book</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Books', value: stats?.totalBooks || 0, icon: BookOpen, color: 'bg-blue-500' },
          { label: 'Chapters', value: stats?.totalChapters || 0, icon: FileText, color: 'bg-purple-500' },
          { label: 'Reads', value: stats?.totalReads || 0, icon: Eye, color: 'bg-green-500' },
          { label: 'Likes', value: stats?.totalLikes || 0, icon: Heart, color: 'bg-pink-500' },
          { label: 'Followers', value: stats?.totalFollowers || 0, icon: Users, color: 'bg-orange-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-4 rounded-xl border shadow-sm">
            <div className={`${stat.color} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className="text-white" size={20} />
            </div>
            <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Books */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">My Books</h2>
          <Link href="/authors/books" className="text-slate-600 hover:text-slate-900">View all →</Link>
        </div>
        <div className="divide-y">
          {stats?.recentBooks?.map((book: Book) => (
            <div key={book.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-16 bg-slate-200 rounded flex items-center justify-center">
                  {book.cover_image_url ? (
                    <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover rounded" />
                  ) : (
                    <BookOpen className="text-slate-400" size={20} />
                  )}
                </div>
                <div>
                  <p className="font-medium">{book.title}</p>
                  <p className="text-sm text-slate-500">
                    {book.total_chapters} chapters • {book.total_views} views • {book.total_likes} likes
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                book.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {book.status}
              </span>
            </div>
          )) || <p className="p-4 text-slate-500">No books yet. Create your first book!</p>}
        </div>
      </div>
    </div>
  );
}
