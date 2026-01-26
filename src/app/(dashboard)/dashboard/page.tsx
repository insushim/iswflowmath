'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MATH_TOPICS, MathTopic } from '@/types';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import {
  Flame,
  Target,
  Clock,
  Zap,
  Trophy,
  ArrowRight,
  Sparkles,
  TrendingUp,
  BookOpen,
  Star,
  ChevronRight,
  Play,
} from 'lucide-react';

interface UserData {
  name: string;
  email: string;
  grade: number;
  currentLevel: number;
  totalXp: number;
  theta: number;
  streakDays: number;
  lastPracticeDate?: Timestamp;
  createdAt: Timestamp;
}

interface Session {
  id: string;
  topic: MathTopic;
  startedAt: Timestamp;
  endedAt?: Timestamp;
  problemsAttempted: number;
  problemsCorrect: number;
  xpEarned: number;
}

interface Achievement {
  id: string;
  achievementId: string;
  unlockedAt: Timestamp;
}

interface DailyStats {
  date: string;
  problemsSolved: number;
  problemsCorrect: number;
  xpEarned: number;
  timeSpentMinutes: number;
  topicsPracticed: MathTopic[];
}

const ACHIEVEMENTS_MAP: Record<string, { name: string; icon: string; color: string }> = {
  'first_step': { name: '첫 걸음', icon: '🎯', color: 'from-blue-500 to-cyan-500' },
  'week_streak': { name: '일주일 마라톤', icon: '📅', color: 'from-orange-500 to-amber-500' },
  'perfect_10': { name: '퍼펙트 10', icon: '💯', color: 'from-emerald-500 to-teal-500' },
  'flow_master': { name: '몰입 마스터', icon: '🧘', color: 'from-purple-500 to-violet-500' },
  'level_5': { name: '레벨 5 달성', icon: '⭐', color: 'from-yellow-500 to-orange-500' },
  'level_10': { name: '레벨 10 달성', icon: '🌟', color: 'from-pink-500 to-rose-500' },
  'algebra_beginner': { name: '대수 입문', icon: '➕', color: 'from-indigo-500 to-blue-500' },
  'geometry_beginner': { name: '기하 입문', icon: '📐', color: 'from-cyan-500 to-blue-500' },
  'problem_100': { name: '100문제 해결', icon: '🔥', color: 'from-red-500 to-orange-500' },
  'problem_500': { name: '500문제 해결', icon: '🏆', color: 'from-amber-500 to-yellow-500' },
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [todayStats, setTodayStats] = useState<DailyStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await loadUserData(firebaseUser.uid);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserData(userDoc.data() as UserData);
      }

      const today = new Date().toISOString().split('T')[0];

      const dailyStatsQuery = query(
        collection(db, 'dailyStats'),
        where('userId', '==', userId),
        where('date', '==', today),
        limit(1)
      );
      const dailyStatsSnapshot = await getDocs(dailyStatsQuery);
      if (!dailyStatsSnapshot.empty) {
        setTodayStats(dailyStatsSnapshot.docs[0].data() as DailyStats);
      }

      try {
        const sessionsQuery = query(
          collection(db, 'sessions'),
          where('userId', '==', userId),
          orderBy('startedAt', 'desc'),
          limit(5)
        );
        const sessionsSnapshot = await getDocs(sessionsQuery);
        const sessions = sessionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Session[];
        setRecentSessions(sessions);
      } catch {
        const sessionsQuery = query(
          collection(db, 'sessions'),
          where('userId', '==', userId),
          limit(10)
        );
        const sessionsSnapshot = await getDocs(sessionsQuery);
        const sessions = sessionsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }) as Session)
          .sort((a, b) => (b.startedAt?.seconds || 0) - (a.startedAt?.seconds || 0))
          .slice(0, 5);
        setRecentSessions(sessions);
      }

      try {
        const achievementsQuery = query(
          collection(db, 'achievements'),
          where('userId', '==', userId),
          orderBy('unlockedAt', 'desc'),
          limit(5)
        );
        const achievementsSnapshot = await getDocs(achievementsQuery);
        const achievementsList = achievementsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Achievement[];
        setAchievements(achievementsList);
      } catch {
        const achievementsQuery = query(
          collection(db, 'achievements'),
          where('userId', '==', userId),
          limit(10)
        );
        const achievementsSnapshot = await getDocs(achievementsQuery);
        const achievementsList = achievementsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }) as Achievement)
          .sort((a, b) => (b.unlockedAt?.seconds || 0) - (a.unlockedAt?.seconds || 0))
          .slice(0, 5);
        setAchievements(achievementsList);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="space-y-6">
          <div className="h-8 w-64 bg-white/5 rounded-lg animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 bg-white/5 rounded-2xl animate-pulse" />
            <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const displayName = userData?.name || user?.displayName || '사용자';
  const level = userData?.currentLevel || 1;
  const totalXp = userData?.totalXp || 0;
  const xpProgress = totalXp % 100;
  const streakDays = userData?.streakDays || 0;

  const todayProblems = todayStats?.problemsSolved || 0;
  const todayCorrect = todayStats?.problemsCorrect || 0;
  const todayAccuracy = todayProblems > 0 ? Math.round((todayCorrect / todayProblems) * 100) : 0;
  const todayFlowTime = todayStats?.timeSpentMinutes || 0;
  const todayLimit = 20;

  const topicProgress = recentSessions.reduce((acc, session) => {
    if (!acc[session.topic]) {
      acc[session.topic] = {
        topic: session.topic,
        problemsSolved: 0,
        problemsCorrect: 0,
        lastPracticed: session.startedAt
      };
    }
    acc[session.topic].problemsSolved += session.problemsAttempted;
    acc[session.topic].problemsCorrect += session.problemsCorrect;
    if (session.startedAt > acc[session.topic].lastPracticed) {
      acc[session.topic].lastPracticed = session.startedAt;
    }
    return acc;
  }, {} as Record<MathTopic, { topic: MathTopic; problemsSolved: number; problemsCorrect: number; lastPracticed: Timestamp }>);

  const recentTopics = Object.values(topicProgress)
    .sort((a, b) => b.lastPracticed.seconds - a.lastPracticed.seconds)
    .slice(0, 3)
    .map(item => {
      const progress = item.problemsSolved > 0
        ? Math.round((item.problemsCorrect / item.problemsSolved) * 100)
        : 0;
      const lastDate = item.lastPracticed.toDate();
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      let lastPracticed = '오늘';
      if (diffDays === 1) lastPracticed = '어제';
      else if (diffDays > 1) lastPracticed = `${diffDays}일 전`;

      return { topic: item.topic, progress, lastPracticed, count: item.problemsSolved };
    });

  const recentAchievements = achievements.slice(0, 3).map(ach => {
    const achievementInfo = ACHIEVEMENTS_MAP[ach.achievementId] || { name: ach.achievementId, icon: '🎖️', color: 'from-gray-500 to-slate-500' };
    const unlockedDate = ach.unlockedAt.toDate();
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - unlockedDate.getTime()) / (1000 * 60 * 60 * 24));
    let dateStr = '오늘';
    if (diffDays === 1) dateStr = '어제';
    else if (diffDays > 1) dateStr = `${diffDays}일 전`;

    return {
      name: achievementInfo.name,
      icon: achievementInfo.icon,
      color: achievementInfo.color,
      date: dateStr
    };
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '좋은 아침이에요';
    if (hour < 18) return '좋은 오후예요';
    return '좋은 저녁이에요';
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="text-sm text-slate-400">{getGreeting()}</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
          {displayName}님, 오늘도 화이팅!
        </h1>
        <p className="text-slate-400">수학 실력을 한 단계 더 높여볼까요?</p>
      </div>

      {/* Quick Stats - Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Streak */}
        <div className="bento-card group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-400" />
            </div>
            {streakDays >= 7 && (
              <span className="badge-gradient text-[10px]">Hot!</span>
            )}
          </div>
          <div className="text-3xl font-bold text-white mb-1">{streakDays}</div>
          <div className="text-sm text-slate-400">연속 학습일</div>
          {streakDays > 0 && (
            <div className="mt-3 flex gap-1">
              {Array.from({ length: Math.min(streakDays, 7) }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-400 to-amber-400"
                />
              ))}
              {streakDays > 7 && (
                <span className="text-[10px] text-amber-400 ml-1">+{streakDays - 7}</span>
              )}
            </div>
          )}
        </div>

        {/* Accuracy */}
        <div className="bento-card group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{todayAccuracy}%</div>
          <div className="text-sm text-slate-400">오늘 정답률</div>
          <div className="mt-3 progress-modern">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              style={{ width: `${todayAccuracy}%` }}
            />
          </div>
        </div>

        {/* Study Time */}
        <div className="bento-card group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-violet-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{todayFlowTime}<span className="text-lg text-slate-400">분</span></div>
          <div className="text-sm text-slate-400">오늘 학습 시간</div>
          <div className="mt-3 text-xs text-slate-500">
            목표: 30분
          </div>
        </div>

        {/* Level */}
        <div className="bento-card-gradient group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-white/60">{xpProgress}/100 XP</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">Lv.{level}</div>
          <div className="text-sm text-white/70">현재 레벨</div>
          <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Today's Progress - Large Card */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">오늘의 학습</h2>
              <p className="text-sm text-slate-400">목표를 향해 달려봐요</p>
            </div>
            <div className="badge-modern">
              {todayProblems}/{todayLimit} 문제
            </div>
          </div>

          <div className="space-y-6">
            {/* Progress Ring */}
            <div className="flex items-center gap-6">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="12"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(todayProblems / todayLimit) * 352} 352`}
                    className="transition-all duration-500"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">{Math.round((todayProblems / todayLimit) * 100)}%</span>
                  <span className="text-xs text-slate-400">완료</span>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">문제 진행률</span>
                    <span className="text-white font-medium">{todayProblems}문제 완료</span>
                  </div>
                  <div className="progress-modern">
                    <div
                      className="progress-modern-bar"
                      style={{ width: `${(todayProblems / todayLimit) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">경험치</span>
                    <span className="text-white font-medium">{xpProgress} XP</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                      style={{ width: `${xpProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <Link href="/practice" className="block">
              <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold flex items-center justify-center gap-3 hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/25">
                <Play className="w-5 h-5" />
                학습 시작하기
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">최근 업적</h2>
            </div>
            <Link href="/achievements" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              전체 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {recentAchievements.length > 0 ? (
            <div className="space-y-3">
              {recentAchievements.map((achievement, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${achievement.color} flex items-center justify-center text-xl shadow-lg`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white text-sm">{achievement.name}</p>
                    <p className="text-xs text-slate-500">{achievement.date}</p>
                  </div>
                  <Star className="w-4 h-4 text-amber-400" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-400 text-sm mb-1">아직 업적이 없습니다</p>
              <p className="text-xs text-slate-500">학습을 시작하면 업적을 획득할 수 있어요!</p>
            </div>
          )}
        </div>
      </div>

      {/* Learning Topics */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">학습 중인 주제</h2>
          </div>
          <Link href="/practice" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            새 주제 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentTopics.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-4">
            {recentTopics.map((item) => (
              <div
                key={item.topic}
                className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-white">{MATH_TOPICS[item.topic]}</span>
                  <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-full">
                    {item.lastPracticed}
                  </span>
                </div>
                <div className="progress-modern mb-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">{item.count}문제 풀이</span>
                  <span className="text-indigo-400 font-medium">{item.progress}% 정답률</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 flex items-center justify-center">
              <TrendingUp className="w-10 h-10 text-indigo-400" />
            </div>
            <p className="text-slate-400 mb-1">아직 학습 기록이 없습니다</p>
            <p className="text-sm text-slate-500 mb-4">첫 학습을 시작해보세요!</p>
            <Link href="/practice">
              <button className="btn-primary">
                <Sparkles className="w-4 h-4" />
                첫 학습 시작하기
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Total XP Summary */}
      <div className="mt-6 glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-400">총 경험치</p>
              <p className="text-2xl font-bold gradient-text-vibrant">{totalXp.toLocaleString()} XP</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{level}</p>
              <p className="text-xs text-slate-500">현재 레벨</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">{100 - xpProgress}</p>
              <p className="text-xs text-slate-500">다음 레벨까지</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
