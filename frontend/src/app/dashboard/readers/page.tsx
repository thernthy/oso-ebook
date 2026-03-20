'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ReaderStats, ReadingProgress } from '@/types';
import { BookOpen, BookMarked, Clock, Users, BookCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ReaderDashboard() {
  const [stats, setStats] = useState<ReaderStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getReaderStats().then((res) => {
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Library</h1>
        <p className="text-slate-600">Your reading journey</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Books Read', value: stats?.booksRead || 0, icon: BookCheck, color: 'bg-green-500' },
          { label: 'Chapters', value: stats?.chaptersRead || 0, icon: BookOpen, color: 'bg-blue-500' },
          { label: 'Hours Read', value: stats?.readingTimeHours || 0, icon: Clock, color: 'bg-purple-500' },
          { label: 'Bookmarks', value: stats?.bookmarksCount || 0, icon: BookMarked, color: 'bg-pink-500' },
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

      {/* Continue Reading */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Continue Reading</h2>
          <Link href="/readers/library" className="text-slate-600 hover:text-slate-900">My Library →</Link>
        </div>
        <div className="divide-y">
          {stats?.currentReads?.map((progress: ReadingProgress) => (
            <div key={progress.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-14 bg-slate-200 rounded flex items-center justify-center">
                    <BookOpen className="text-slate-400" size={18} />
                  </div>
                  <div>
                    <p className="font-medium">{progress.book?.title}</p>
                    <p className="text-sm text-slate-500">
                      Chapter {progress.current_chapter?.chapter_number || '?'} • {progress.progress_percentage.toFixed(0)}%
                    </p>
                  </div>
                </div>
                <Link
                  href={`/books/${progress.book?.slug}/chapter/${progress.current_chapter?.chapter_number || 1}`}
                  className="flex items-center gap-1 text-slate-900 hover:underline"
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-slate-900 h-2 rounded-full transition-all"
                  style={{ width: `${progress.progress_percentage}%` }}
                />
              </div>
            </div>
          )) || <p className="p-4 text-slate-500">Start reading a book to see it here</p>}
        </div>
      </div>
    </div>
  );
}
