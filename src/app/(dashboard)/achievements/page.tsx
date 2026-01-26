'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { getUserSessions } from '@/lib/firebase/firestore';
import { Trophy, Zap, Star, Lock, Flame, Target, Clock, BookOpen, Award, Medal } from 'lucide-react';

interface UserStats {
  totalProblems: number;
  totalCorrect: number;
  totalSessions: number;
  streakDays: number;
  totalStudyTime: number;
  averageAccuracy: number;
  bestAccuracy: number;
}

const CATEGORY_INFO: Record<string, { label: string; icon: React.ElementType; gradient: string }> = {
  problems: { label: '문제 풀이', icon: BookOpen, gradient: 'from-blue-500 to-indigo-600' },
  streak: { label: '연속 학습', icon: Flame, gradient: 'from-orange-500 to-amber-600' },
  accuracy: { label: '정확도', icon: Target, gradient: 'from-emerald-500 to-teal-600' },
  flow: { label: '몰입', icon: Zap, gradient: 'from-violet-500 to-purple-600' },
  speed: { label: '속도', icon: Clock, gradient: 'from-cyan-500 to-blue-600' },
  mastery: { label: '마스터리', icon: Award, gradient: 'from-amber-500 to-yellow-600' },
};

const defaultStats: UserStats = {
  totalProblems: 0, totalCorrect: 0, totalSessions: 0, streakDays: 0,
  totalStudyTime: 0, averageAccuracy: 0, bestAccuracy: 0,
};

export default function AchievementsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserStats>(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await loadUserStats(firebaseUser.uid);
      } else {
        setUser(null);
        setUserStats(defaultStats);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loadUserStats = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      const userData = userDoc.exists() ? userDoc.data() : null;
      let sessions: Array<{ totalProblems?: number; correctAnswers?: number; duration?: number; accuracy?: number }> = [];
      try { sessions = await getUserSessions(uid, 1000); } catch (e) { console.error('Failed to load sessions:', e); }
      const totalProblems = sessions.reduce((sum, s) => sum + (s.totalProblems || 0), 0);
      const totalCorrect = sessions.reduce((sum, s) => sum + (s.correctAnswers || 0), 0);
      const totalStudyTime = Math.round(sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60);
      const bestAccuracy = sessions.length > 0 ? Math.max(...sessions.map(s => s.accuracy || 0)) : 0;
      setUserStats({
        totalProblems, totalCorrect, totalSessions: sessions.length,
        streakDays: userData?.streakDays || 0, totalStudyTime,
        averageAccuracy: totalProblems > 0 ? (totalCorrect / totalProblems) * 100 : 0, bestAccuracy,
      });
    } catch (error) { console.error('Failed to load achievement data:', error); setUserStats(defaultStats); }
  };

  const achievements = [
    { id: 'first-problem', name: '첫 발걸음', description: '첫 번째 문제를 풀었습니다', category: 'problems', requirement: 1, xpReward: 10, check: (s: UserStats) => s.totalProblems >= 1, getProgress: (s: UserStats) => Math.min(s.totalProblems, 1) },
    { id: 'problem-10', name: '꾸준한 학습자', description: '10개의 문제를 풀었습니다', category: 'problems', requirement: 10, xpReward: 50, check: (s: UserStats) => s.totalProblems >= 10, getProgress: (s: UserStats) => Math.min(s.totalProblems, 10) },
    { id: 'problem-50', name: '열정적인 학습자', description: '50개의 문제를 풀었습니다', category: 'problems', requirement: 50, xpReward: 100, check: (s: UserStats) => s.totalProblems >= 50, getProgress: (s: UserStats) => Math.min(s.totalProblems, 50) },
    { id: 'problem-100', name: '문제 정복자', description: '100개의 문제를 풀었습니다', category: 'problems', requirement: 100, xpReward: 200, check: (s: UserStats) => s.totalProblems >= 100, getProgress: (s: UserStats) => Math.min(s.totalProblems, 100) },
    { id: 'problem-500', name: '수학 마스터', description: '500개의 문제를 풀었습니다', category: 'problems', requirement: 500, xpReward: 500, check: (s: UserStats) => s.totalProblems >= 500, getProgress: (s: UserStats) => Math.min(s.totalProblems, 500) },
    { id: 'streak-3', name: '3일 연속', description: '3일 연속으로 학습했습니다', category: 'streak', requirement: 3, xpReward: 30, check: (s: UserStats) => s.streakDays >= 3, getProgress: (s: UserStats) => Math.min(s.streakDays, 3) },
    { id: 'streak-7', name: '일주일 챔피언', description: '7일 연속으로 학습했습니다', category: 'streak', requirement: 7, xpReward: 70, check: (s: UserStats) => s.streakDays >= 7, getProgress: (s: UserStats) => Math.min(s.streakDays, 7) },
    { id: 'streak-30', name: '한 달의 기적', description: '30일 연속으로 학습했습니다', category: 'streak', requirement: 30, xpReward: 300, check: (s: UserStats) => s.streakDays >= 30, getProgress: (s: UserStats) => Math.min(s.streakDays, 30) },
    { id: 'accuracy-80', name: '정확한 계산', description: '평균 정확도 80% 달성', category: 'accuracy', requirement: 80, xpReward: 50, check: (s: UserStats) => s.averageAccuracy >= 80, getProgress: (s: UserStats) => Math.min(Math.round(s.averageAccuracy), 80) },
    { id: 'accuracy-90', name: '거의 완벽', description: '평균 정확도 90% 달성', category: 'accuracy', requirement: 90, xpReward: 100, check: (s: UserStats) => s.averageAccuracy >= 90, getProgress: (s: UserStats) => Math.min(Math.round(s.averageAccuracy), 90) },
    { id: 'perfect-session', name: '완벽한 세션', description: '세션에서 100% 정답률 달성', category: 'accuracy', requirement: 100, xpReward: 200, check: (s: UserStats) => s.bestAccuracy >= 100, getProgress: (s: UserStats) => Math.min(Math.round(s.bestAccuracy), 100) },
    { id: 'flow-10', name: '몰입의 시작', description: '총 학습 시간 10분 달성', category: 'flow', requirement: 10, xpReward: 50, check: (s: UserStats) => s.totalStudyTime >= 10, getProgress: (s: UserStats) => Math.min(s.totalStudyTime, 10) },
    { id: 'flow-60', name: '깊은 몰입', description: '총 학습 시간 1시간 달성', category: 'flow', requirement: 60, xpReward: 100, check: (s: UserStats) => s.totalStudyTime >= 60, getProgress: (s: UserStats) => Math.min(s.totalStudyTime, 60) },
    { id: 'flow-300', name: '몰입 마스터', description: '총 학습 시간 5시간 달성', category: 'flow', requirement: 300, xpReward: 200, check: (s: UserStats) => s.totalStudyTime >= 300, getProgress: (s: UserStats) => Math.min(s.totalStudyTime, 300) },
    { id: 'quick-learner', name: '빠른 학습자', description: '10개 이상의 문제를 정답', category: 'speed', requirement: 10, xpReward: 50, check: (s: UserStats) => s.totalCorrect >= 10, getProgress: (s: UserStats) => Math.min(s.totalCorrect, 10) },
    { id: 'session-master', name: '세션 마스터', description: '10개 이상의 학습 세션 완료', category: 'mastery', requirement: 10, xpReward: 200, check: (s: UserStats) => s.totalSessions >= 10, getProgress: (s: UserStats) => Math.min(s.totalSessions, 10) },
    { id: 'dedicated-learner', name: '헌신적인 학습자', description: '50개 이상의 학습 세션 완료', category: 'mastery', requirement: 50, xpReward: 500, check: (s: UserStats) => s.totalSessions >= 50, getProgress: (s: UserStats) => Math.min(s.totalSessions, 50) },
  ].map((def) => ({ ...def, unlocked: def.check(userStats), progress: def.getProgress(userStats) }));

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalXpEarned = achievements.filter((a) => a.unlocked).reduce((sum, a) => sum + a.xpReward, 0);
  const filteredAchievements = selectedCategory ? achievements.filter((a) => a.category === selectedCategory) : achievements;

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="space-y-6">
          <div className="h-8 w-32 bg-white/5 rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="grid gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-slate-600" />
          </div>
          <p className="text-slate-400">로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">업적</h1>
        </div>
        <p className="text-slate-400">학습 목표를 달성하고 보상을 획득하세요</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-6 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10 text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-white/80" />
            <div className="text-4xl font-bold text-white">{unlockedCount}</div>
            <div className="text-indigo-100 text-sm">획득한 업적</div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-6 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10 text-center">
            <Star className="w-8 h-8 mx-auto mb-2 text-white/80" />
            <div className="text-4xl font-bold text-white">{achievements.length}</div>
            <div className="text-violet-100 text-sm">전체 업적</div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10 text-center">
            <Zap className="w-8 h-8 mx-auto mb-2 text-white/80" />
            <div className="text-4xl font-bold text-white">+{totalXpEarned}</div>
            <div className="text-emerald-100 text-sm">획득 XP</div>
          </div>
        </div>
      </div>

      {/* User Stats */}
      <div className="glass-card p-6 mb-8">
        <h3 className="font-semibold text-white mb-4">내 학습 현황</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-xl bg-white/5">
            <div className="text-2xl font-bold text-indigo-400">{userStats.totalProblems}</div>
            <div className="text-xs text-slate-500">총 문제</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <div className="text-2xl font-bold text-orange-400">{userStats.streakDays}일</div>
            <div className="text-xs text-slate-500">연속 학습</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <div className="text-2xl font-bold text-emerald-400">{Math.round(userStats.averageAccuracy)}%</div>
            <div className="text-xs text-slate-500">평균 정확도</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <div className="text-2xl font-bold text-violet-400">{userStats.totalStudyTime}분</div>
            <div className="text-xs text-slate-500">총 학습 시간</div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            selectedCategory === null
              ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
              : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          전체
        </button>
        {Object.entries(CATEGORY_INFO).map(([key, { label, icon: Icon }]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              selectedCategory === key
                ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid gap-4">
        {filteredAchievements.map((achievement) => {
          const category = CATEGORY_INFO[achievement.category];
          const progressPercent = Math.min(100, (achievement.progress / achievement.requirement) * 100);
          const CategoryIcon = category.icon;

          return (
            <div
              key={achievement.id}
              className={`glass-card p-5 transition-all ${
                achievement.unlocked ? 'ring-1 ring-emerald-500/30' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                  achievement.unlocked
                    ? `bg-gradient-to-br ${category.gradient} shadow-lg`
                    : 'bg-white/5'
                }`}>
                  {achievement.unlocked ? (
                    <Trophy className="w-6 h-6 text-white" />
                  ) : (
                    <Lock className="w-6 h-6 text-slate-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className={`font-bold ${achievement.unlocked ? 'text-white' : 'text-slate-400'}`}>
                      {achievement.name}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      achievement.unlocked
                        ? 'bg-white/10 text-slate-300'
                        : 'bg-white/5 text-slate-500'
                    }`}>
                      <CategoryIcon className="w-3 h-3" />
                      {category.label}
                    </span>
                    {achievement.unlocked && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                        획득
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mb-2">{achievement.description}</p>

                  {!achievement.unlocked && (
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>진행률</span>
                        <span>{achievement.progress}/{achievement.requirement}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${category.gradient} transition-all`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                    achievement.unlocked
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                      : 'bg-white/5 text-slate-500'
                  }`}>
                    +{achievement.xpReward} XP
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-slate-600" />
          </div>
          <p className="text-slate-400">이 카테고리에 업적이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
