'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from '@/lib/firebase/auth';
import {
  LayoutDashboard,
  PenTool,
  BarChart3,
  Trophy,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  Zap,
} from 'lucide-react';

const navigation = [
  { name: '대시보드', href: '/dashboard', icon: LayoutDashboard },
  { name: '학습하기', href: '/practice', icon: PenTool },
  { name: '통계', href: '/analytics', icon: BarChart3 },
  { name: '업적', href: '/achievements', icon: Trophy },
  { name: '설정', href: '/settings', icon: Settings },
];

interface UserData {
  name: string;
  email: string;
  grade: number;
  currentLevel: number;
  totalXp: number;
  theta: number;
  streakDays: number;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchUserData = useCallback(async (firebaseUser: User) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data() as UserData);
      }
    } catch (err) {
      console.error('[Dashboard] Failed to fetch user data:', err);
    }
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            setUser(firebaseUser);
            await fetchUserData(firebaseUser);
          } else {
            router.push('/login');
          }
        } catch (err) {
          console.error('[Dashboard] Auth state change error:', err);
          setError('사용자 정보를 불러오는 중 오류가 발생했습니다.');
        } finally {
          setLoading(false);
        }
      }, (err) => {
        console.error('[Dashboard] Auth observer error:', err);
        setError('인증 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
        setLoading(false);
      });
    } catch (err) {
      console.error('[Dashboard] Firebase initialization error:', err);
      setError('서비스 초기화 중 오류가 발생했습니다.');
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [router, fetchUserData]);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 animate-pulse" />
          <div className="absolute inset-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 animate-ping opacity-20" />
        </div>
        <p className="text-slate-400 text-sm animate-pulse">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center gap-4 p-4">
        <div className="glass-card p-8 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">오류가 발생했습니다</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              새로고침
            </button>
            <button
              onClick={() => router.push('/login')}
              className="btn-secondary"
            >
              로그인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = userData?.name || user.displayName || '사용자';
  const currentLevel = userData?.currentLevel || 1;
  const totalXp = userData?.totalXp || 0;
  const xpProgress = (totalXp % 100);
  const streakDays = userData?.streakDays || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Ambient background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-72 glass border-r border-white/5 hidden lg:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center gap-3 px-6 border-b border-white/5">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
            </div>
            <div>
              <span className="font-bold text-xl gradient-text-vibrant">
                MathFlow
              </span>
              <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">AI 수학 학습</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1.5">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/20 text-white shadow-lg shadow-indigo-500/10 border border-indigo-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon className={cn(
                    'w-5 h-5 transition-colors',
                    isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-indigo-400'
                  )} />
                  <span>{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* XP Progress Card */}
          <div className="mx-4 mb-4 p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-slate-300">오늘의 진행</span>
            </div>
            <div className="progress-modern mb-2">
              <div
                className="progress-modern-bar"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">{xpProgress} XP</span>
              <span className="text-slate-400">100 XP 목표</span>
            </div>
          </div>

          {/* User Profile */}
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 via-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-500/25">
                  {displayName.charAt(0)}
                </div>
                {streakDays > 0 && (
                  <div className="absolute -bottom-1 -right-1 bg-amber-500 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    🔥 {streakDays}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-indigo-400 font-medium">Lv. {currentLevel}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-slate-500">{totalXp} XP</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text-vibrant">MathFlow</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 glass border-b border-white/5 p-4 space-y-2 animate-fade-in">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-indigo-500/20 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                로그아웃
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/5 lg:hidden safe-area-bottom">
        <div className="flex justify-around py-2 px-2">
          {navigation.slice(0, 4).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200',
                  isActive
                    ? 'text-indigo-400 bg-indigo-500/10'
                    : 'text-slate-500 hover:text-slate-300'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main content */}
      <main className="lg:ml-72 pt-16 lg:pt-0 pb-24 lg:pb-0 min-h-screen relative z-10">
        {children}
      </main>
    </div>
  );
}
