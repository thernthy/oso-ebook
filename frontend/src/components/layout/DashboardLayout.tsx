'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { User, UserRole } from '@/types';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Library, 
  Settings, 
  LogOut,
  Menu,
  X,
  UserCircle,
  Building2,
  PenTool,
  BookMarked
} from 'lucide-react';
import Link from 'next/link';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard/oso', icon: LayoutDashboard, roles: ['oso_admin'] },
  { label: 'Users', href: '/dashboard/oso/users', icon: Users, roles: ['oso_admin'] },
  { label: 'Partners', href: '/dashboard/oso/partners', icon: Building2, roles: ['oso_admin'] },
  { label: 'Books', href: '/dashboard/oso/books', icon: BookOpen, roles: ['oso_admin'] },
  
  { label: 'Dashboard', href: '/dashboard/partners', icon: LayoutDashboard, roles: ['partner'] },
  { label: 'My Authors', href: '/dashboard/partners/authors', icon: Users, roles: ['partner'] },
  { label: 'Books', href: '/dashboard/partners/books', icon: BookOpen, roles: ['partner'] },
  { label: 'Earnings', href: '/dashboard/partners/earnings', icon: BookMarked, roles: ['partner'] },
  
  { label: 'Dashboard', href: '/dashboard/authors', icon: LayoutDashboard, roles: ['author'] },
  { label: 'My Books', href: '/dashboard/authors/books', icon: BookOpen, roles: ['author'] },
  { label: 'New Book', href: '/dashboard/authors/books/new', icon: PenTool, roles: ['author'] },
  { label: 'Stats', href: '/dashboard/authors/stats', icon: BookMarked, roles: ['author'] },
  
  { label: 'Dashboard', href: '/dashboard/readers', icon: LayoutDashboard, roles: ['reader'] },
  { label: 'Library', href: '/dashboard/readers/library', icon: Library, roles: ['reader'] },
  { label: 'Bookmarks', href: '/dashboard/readers/bookmarks', icon: BookMarked, roles: ['reader'] },
  { label: 'Following', href: '/dashboard/readers/following', icon: Users, roles: ['reader'] },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    api.getMe().then((res) => {
      if (res.success && res.data) {
        setUser(res.data);
        // Redirect to correct dashboard if on wrong one
        const currentRole = pathname.split('/')[2];
        if (currentRole !== res.data.role.replace('_', '-')) {
          const rolePath = res.data.role === 'oso_admin' ? 'oso' : res.data.role;
          router.push(`/dashboard/${rolePath}`);
        }
      } else {
        api.clearToken();
        router.push('/login');
      }
      setLoading(false);
    });
  }, [router, pathname]);

  const handleLogout = async () => {
    await api.logout();
    router.push('/login');
  };

  const filteredNav = navItems.filter((item) => 
    user && item.roles.includes(user.role)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-slate-100 rounded-lg"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <span className="font-semibold text-lg">OSO E-Book</span>
        <div className="w-10"></div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:transform-none ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col">
            <div className="p-6 border-b">
              <h1 className="text-xl font-bold text-slate-900">OSO E-Book</h1>
              <p className="text-sm text-slate-500 mt-1">{user.display_name}</p>
              <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
                {user.role.replace('_', ' ')}
              </span>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {filteredNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 w-full text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 lg:hidden z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
