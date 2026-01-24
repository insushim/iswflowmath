'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/firebase/auth-context';
import { getUserSessions, getUserDailyStats } from '@/lib/firebase/firestore';
import { getStreakStats } from '@/lib/gamification/streak';
import { calculateLevel, getLevelTitle } from '@/lib/gamification/constants';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { MathTopic, MATH_TOPICS } from '@/types';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Flame,
  Trophy,
  Target,
  BookOpen,
  Zap,
  Calendar,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

// 타입 정의
interface UserAnalyticsData {
  totalProblems: number;
  correctProblems: number;
  accuracyRate: number;
  totalTimeMinutes: number;
  avgTimePerProblem: number;
  streakDays: number;
  longestStreak: number;
  flowTimePercentage: number;
  currentLevel: number;
  totalXp: number;
  xpToNextLevel: number;
  xpProgress: number;
}

interface WeeklyData {
  day: string;
  date: string;
  problems: number;
  minutes: number;
  accuracy: number;
  xp: number;
}

interface TopicMastery {
  topic: string;
  topicKey: MathTopic;
  mastery: number;
  problems: number;
  correct: number;
}

interface RecentSession {
  id: string;
  date: string;
  duration: number;
  problems: number;
  correct: number;
  xp: number;
  flowPercent: number;
  topic: string;
}

// 애니메이션 variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

// 로딩 스켈레톤 컴포넌트
function StatCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/40 backdrop-blur-xl border border-white/20 p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent" />
      <div className="relative space-y-3">
        <div className="h-4 w-20 bg-slate-200/80 rounded-lg animate-pulse" />
        <div className="h-10 w-28 bg-slate-200/80 rounded-lg animate-pulse" />
        <div className="h-3 w-16 bg-slate-200/60 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-56 flex items-end justify-between gap-3 px-2">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <div
            className="w-full bg-slate-200/60 rounded-2xl animate-pulse"
            style={{ height: `${Math.random() * 60 + 30}%` }}
          />
          <div className="h-3 w-8 bg-slate-200/60 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// 글래스모피즘 스타일의 통계 카드
function GlassStatCard({
  icon: Icon,
  label,
  value,
  subValue,
  gradient,
  iconGradient,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  gradient: string;
  iconGradient: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative"
    >
      <div className={`absolute inset-0 ${gradient} rounded-3xl opacity-80 blur-xl group-hover:blur-2xl transition-all duration-500`} />
      <div className={`relative overflow-hidden rounded-3xl ${gradient} p-6 shadow-2xl`}>
        {/* 글래스 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-white/5 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

        {/* 데코레이션 */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 rounded-full blur-xl" />

        <div className="relative z-10">
          <div className={`inline-flex p-2.5 rounded-2xl ${iconGradient} shadow-lg mb-4`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="text-white/80 text-sm font-medium mb-1">{label}</div>
          <div className="text-4xl font-bold text-white tracking-tight mb-1">{value}</div>
          {subValue && (
            <div className="text-white/60 text-sm font-medium">{subValue}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Bento 스타일 카드
function BentoCard({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl shadow-slate-200/20 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/40 to-white/20" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserAnalyticsData | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [topicMastery, setTopicMastery] = useState<TopicMastery[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);

  // 데이터 로드
  useEffect(() => {
    async function loadAnalyticsData() {
      if (!user?.uid) return;

      setLoading(true);
      try {
        // 사용자 기본 데이터
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.exists() ? userDoc.data() : {};

        // 스트릭 통계
        const streakStats = await getStreakStats(user.uid);

        // 일별 통계 (시간 범위에 따라)
        const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
        const dailyStats = await getUserDailyStats(user.uid, days);

        // 최근 세션
        const sessions = await getUserSessions(user.uid, 10);

        // 통계 계산
        const totalProblems = dailyStats.reduce((sum: number, d: any) => sum + (d.problemsSolved || 0), 0);
        const correctProblems = dailyStats.reduce((sum: number, d: any) => sum + (d.problemsCorrect || 0), 0);
        const totalTime = dailyStats.reduce((sum: number, d: any) => sum + (d.timeSpentMinutes || 0), 0);
        const totalFlowTime = dailyStats.reduce((sum: number, d: any) => {
          const flowPct = d.flowPercentage || 50;
          return sum + ((d.timeSpentMinutes || 0) * flowPct / 100);
        }, 0);

        const totalXp = userData.totalXp || 0;
        const levelData = calculateLevel(totalXp);

        setStats({
          totalProblems,
          correctProblems,
          accuracyRate: totalProblems > 0 ? Math.round((correctProblems / totalProblems) * 1000) / 10 : 0,
          totalTimeMinutes: totalTime,
          avgTimePerProblem: totalProblems > 0 ? Math.round((totalTime * 60) / totalProblems) : 0,
          streakDays: streakStats.currentStreak,
          longestStreak: streakStats.longestStreak,
          flowTimePercentage: totalTime > 0 ? Math.round((totalFlowTime / totalTime) * 100) : 0,
          currentLevel: levelData.level,
          totalXp,
          xpToNextLevel: levelData.xpToNext,
          xpProgress: levelData.progress,
        });

        // 주간 데이터 생성
        const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
        const last7Days: WeeklyData[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const dayData = dailyStats.find((d: any) => d.date === dateStr) as any;

          last7Days.push({
            day: weekDays[date.getDay()],
            date: dateStr,
            problems: dayData?.problemsSolved || 0,
            minutes: dayData?.timeSpentMinutes || 0,
            accuracy: dayData?.problemsSolved > 0
              ? Math.round((dayData.problemsCorrect / dayData.problemsSolved) * 100)
              : 0,
            xp: dayData?.xpEarned || 0,
          });
        }
        setWeeklyData(last7Days);

        // 주제별 숙련도 계산
        const topicStats: Record<string, { problems: number; correct: number }> = {};
        dailyStats.forEach((day: any) => {
          const topics = day.topicsPracticed || [];
          topics.forEach((topic: string) => {
            if (!topicStats[topic]) {
              topicStats[topic] = { problems: 0, correct: 0 };
            }
            const perTopic = Math.ceil((day.problemsSolved || 0) / topics.length);
            const correctPerTopic = Math.ceil((day.problemsCorrect || 0) / topics.length);
            topicStats[topic].problems += perTopic;
            topicStats[topic].correct += correctPerTopic;
          });
        });

        const masteryData: TopicMastery[] = Object.entries(topicStats)
          .map(([topic, data]) => ({
            topic: MATH_TOPICS[topic as MathTopic] || topic,
            topicKey: topic as MathTopic,
            mastery: data.problems > 0 ? Math.round((data.correct / data.problems) * 100) : 0,
            problems: data.problems,
            correct: data.correct,
          }))
          .sort((a, b) => b.mastery - a.mastery)
          .slice(0, 6);

        setTopicMastery(masteryData);

        // 최근 세션 매핑
        const recentSessionData: RecentSession[] = sessions.slice(0, 5).map((session: any) => {
          const startedAt = session.startedAt?.toDate?.() || new Date(session.startedAt);
          const endedAt = session.endedAt?.toDate?.() || new Date();
          const duration = Math.round((endedAt.getTime() - startedAt.getTime()) / 60000);

          return {
            id: session.id,
            date: startedAt.toISOString().split('T')[0],
            duration: duration > 0 ? duration : 1,
            problems: session.problemsAttempted || 0,
            correct: session.problemsCorrect || 0,
            xp: session.xpEarned || 0,
            flowPercent: session.flowPercentage || 50,
            topic: MATH_TOPICS[session.topic as MathTopic] || session.topic || '일반',
          };
        });
        setRecentSessions(recentSessionData);

      } catch (error) {
        console.error('Failed to load analytics data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadAnalyticsData();
  }, [user, timeRange]);

  const maxProblems = Math.max(...weeklyData.map((d) => d.problems), 1);

  // 숫자 포맷팅
  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  // 시간 포맷팅
  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
    }
    return `${minutes}분`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60 relative overflow-hidden">
      {/* 배경 블러 오브 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-violet-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-indigo-400/10 to-blue-400/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                학습 통계
              </h1>
            </div>
            <p className="text-slate-500 ml-14">학습 진행 상황과 성과를 한눈에 확인하세요</p>
          </div>

          {/* 기간 선택 - 글래스모피즘 */}
          <div className="flex gap-1.5 p-1.5 bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg shadow-slate-200/40 border border-white/60">
            {[
              { value: 'week', label: '이번 주', icon: Calendar },
              { value: 'month', label: '이번 달', icon: Calendar },
              { value: 'all', label: '전체', icon: Calendar },
            ].map((option) => (
              <motion.button
                key={option.value}
                onClick={() => setTimeRange(option.value as typeof timeRange)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  timeRange === option.value
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-600 hover:bg-white/80'
                }`}
              >
                {option.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* 주요 통계 카드 - Bento Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <GlassStatCard
                icon={BookOpen}
                label="총 문제 수"
                value={formatNumber(stats?.totalProblems || 0)}
                subValue={timeRange === 'week' ? '이번 주' : timeRange === 'month' ? '이번 달' : '전체 기간'}
                gradient="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600"
                iconGradient="bg-white/20"
                delay={0}
              />
              <GlassStatCard
                icon={Target}
                label="정답률"
                value={`${stats?.accuracyRate || 0}%`}
                subValue={`${stats?.correctProblems || 0}/${stats?.totalProblems || 0} 정답`}
                gradient="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600"
                iconGradient="bg-white/20"
                delay={0.1}
              />
              <GlassStatCard
                icon={Clock}
                label="학습 시간"
                value={`${Math.floor((stats?.totalTimeMinutes || 0) / 60)}h`}
                subValue={`${(stats?.totalTimeMinutes || 0) % 60}분`}
                gradient="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600"
                iconGradient="bg-white/20"
                delay={0.2}
              />
              <GlassStatCard
                icon={Flame}
                label="연속 학습"
                value={`${stats?.streakDays || 0}일`}
                subValue={`최장 ${stats?.longestStreak || 0}일`}
                gradient="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500"
                iconGradient="bg-white/20"
                delay={0.3}
              />
            </>
          )}
        </div>

        {/* 메인 콘텐츠 - Bento Grid 레이아웃 */}
        <div className="grid lg:grid-cols-3 gap-5 mb-8">
          {/* 주간 학습 그래프 - 2칸 차지 */}
          <BentoCard className="lg:col-span-2" delay={0.4}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">주간 학습 현황</h3>
                    <p className="text-sm text-slate-500">최근 7일간의 학습 기록</p>
                  </div>
                </div>
                <Badge className="bg-blue-50 text-blue-600 border-blue-200">
                  {weeklyData.reduce((sum, d) => sum + d.problems, 0)} 문제
                </Badge>
              </div>

              {loading ? (
                <ChartSkeleton />
              ) : (
                <>
                  <div className="flex items-end justify-between h-56 gap-3 px-2">
                    {weeklyData.map((data, index) => {
                      const height = maxProblems > 0 ? (data.problems / maxProblems) * 100 : 0;
                      const isToday = index === weeklyData.length - 1;

                      return (
                        <motion.div
                          key={data.day}
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          className="flex-1 flex flex-col items-center group cursor-pointer"
                        >
                          {/* 호버 툴팁 */}
                          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-xl whitespace-nowrap shadow-xl transform group-hover:-translate-y-1">
                            <div className="font-semibold">{data.problems}문제</div>
                            <div className="text-slate-400">{data.minutes}분 · {data.accuracy}%</div>
                          </div>
                          <div className="text-xs text-slate-500 mb-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            +{data.xp} XP
                          </div>
                          <motion.div
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            style={{ originY: 1, height: `${Math.max(height, 8)}%`, minHeight: '12px' }}
                            className={`w-full rounded-2xl transition-all duration-300 ${
                              isToday
                                ? 'bg-gradient-to-t from-blue-600 via-blue-500 to-indigo-400 shadow-lg shadow-blue-500/40'
                                : data.problems > 0
                                ? 'bg-gradient-to-t from-slate-300 to-slate-200 group-hover:from-blue-400 group-hover:to-blue-300 group-hover:shadow-lg group-hover:shadow-blue-400/30'
                                : 'bg-slate-100'
                            }`}
                          />
                          <div className={`text-xs mt-3 font-semibold transition-colors ${
                            isToday ? 'text-blue-600' : 'text-slate-500 group-hover:text-blue-500'
                          }`}>
                            {data.day}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* 주간 요약 */}
                  <div className="mt-6 pt-5 border-t border-slate-100/80 grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-2xl bg-slate-50/80">
                      <div className="text-2xl font-bold text-slate-800">
                        {weeklyData.reduce((sum, d) => sum + d.problems, 0)}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">총 문제</div>
                    </div>
                    <div className="text-center p-3 rounded-2xl bg-slate-50/80">
                      <div className="text-2xl font-bold text-slate-800">
                        {formatTime(weeklyData.reduce((sum, d) => sum + d.minutes, 0))}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">총 학습</div>
                    </div>
                    <div className="text-center p-3 rounded-2xl bg-slate-50/80">
                      <div className="text-2xl font-bold text-slate-800">
                        {weeklyData.filter(d => d.problems > 0).length}일
                      </div>
                      <div className="text-xs text-slate-500 font-medium">활동일</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </BentoCard>

          {/* 레벨 진행률 */}
          <BentoCard delay={0.5}>
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">레벨 & 경험치</h3>
              </div>

              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-24 h-24 bg-slate-200/80 rounded-full animate-pulse" />
                </div>
              ) : (
                <>
                  <div className="flex-1 flex flex-col items-center justify-center">
                    {/* 레벨 배지 */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', duration: 0.8, delay: 0.6 }}
                      className="relative mb-4"
                    >
                      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-500/40">
                        <span className="text-5xl font-bold text-white">
                          {stats?.currentLevel || 1}
                        </span>
                      </div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.8 }}
                        className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-lg shadow-lg border-4 border-white"
                      >
                        <Sparkles className="w-5 h-5 text-white" />
                      </motion.div>
                    </motion.div>

                    <div className="text-center mb-4">
                      <div className="text-sm text-slate-500 mb-1">
                        {getLevelTitle(stats?.currentLevel || 1)}
                      </div>
                      <div className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                        {formatNumber(stats?.totalXp || 0)} XP
                      </div>
                    </div>

                    {/* XP 프로그레스 바 */}
                    <div className="w-full mb-2">
                      <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stats?.xpProgress || 0}%` }}
                          transition={{ duration: 1, delay: 0.7, ease: 'easeOut' }}
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                      </div>
                    </div>
                    <div className="flex justify-between w-full text-xs text-slate-400 mb-4">
                      <span>Lv.{stats?.currentLevel || 1}</span>
                      <span className="text-violet-500 font-medium">{stats?.xpToNextLevel || 0} XP 남음</span>
                      <span>Lv.{(stats?.currentLevel || 1) + 1}</span>
                    </div>
                  </div>

                  {/* 몰입 학습 비율 */}
                  <div className="p-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 rounded-2xl border border-blue-100/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-slate-700">몰입 학습</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        {stats?.flowTimePercentage || 0}%
                      </span>
                    </div>
                    <div className="relative h-2 bg-white rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stats?.flowTimePercentage || 0}%` }}
                        transition={{ duration: 1, delay: 0.8 }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </BentoCard>
        </div>

        {/* 하단 섹션 */}
        <div className="grid lg:grid-cols-2 gap-5">
          {/* 주제별 숙련도 */}
          <BentoCard delay={0.6}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">주제별 숙련도</h3>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                      <div className="w-24 h-4 bg-slate-200 rounded" />
                      <div className="flex-1 h-3 bg-slate-200 rounded" />
                      <div className="w-12 h-4 bg-slate-200 rounded" />
                    </div>
                  ))}
                </div>
              ) : topicMastery.length > 0 ? (
                <div className="space-y-4">
                  {topicMastery.map((topic, index) => {
                    const colors = [
                      { bg: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/30' },
                      { bg: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/30' },
                      { bg: 'from-violet-500 to-purple-500', shadow: 'shadow-violet-500/30' },
                      { bg: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/30' },
                      { bg: 'from-rose-500 to-pink-500', shadow: 'shadow-rose-500/30' },
                      { bg: 'from-indigo-500 to-blue-500', shadow: 'shadow-indigo-500/30' },
                    ];
                    const color = colors[index % colors.length];

                    return (
                      <motion.div
                        key={topic.topicKey}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="group p-4 rounded-2xl bg-white/60 hover:bg-white hover:shadow-lg transition-all duration-300 border border-white/40 hover:border-slate-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-slate-700">{topic.topic}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                              {topic.problems}문제
                            </Badge>
                            <span className="text-xl font-bold text-slate-800">
                              {topic.mastery}%
                            </span>
                          </div>
                        </div>
                        <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${topic.mastery}%` }}
                            transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${color.bg} rounded-full group-hover:${color.shadow} transition-shadow`}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">아직 학습 기록이 없습니다</p>
                  <p className="text-sm mt-1">문제를 풀면 주제별 숙련도가 표시됩니다</p>
                </div>
              )}
            </div>
          </BentoCard>

          {/* 최근 세션 */}
          <BentoCard delay={0.7}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">최근 학습</h3>
                </div>
                <button className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
                  더보기 <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl animate-pulse">
                      <div className="w-16 h-12 bg-slate-200 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-32" />
                        <div className="h-2 bg-slate-200 rounded w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentSessions.length > 0 ? (
                <div className="space-y-3">
                  {recentSessions.map((session, index) => {
                    const accuracy = session.problems > 0
                      ? Math.round((session.correct / session.problems) * 100)
                      : 0;

                    return (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ scale: 1.01 }}
                        className="flex items-center gap-4 p-4 bg-white/60 rounded-2xl border border-white/40 hover:border-slate-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                      >
                        <div className="min-w-[70px]">
                          <div className="text-sm font-semibold text-slate-800">
                            {new Date(session.date).toLocaleDateString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          <div className="text-xs text-slate-500">{session.duration}분</div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="outline" className="text-xs bg-white/80 shrink-0">
                              {session.topic}
                            </Badge>
                            <span className="text-sm text-slate-600">
                              {session.correct}/{session.problems} 정답
                            </span>
                          </div>
                          <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                                accuracy >= 80
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                  : accuracy >= 60
                                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                                  : 'bg-gradient-to-r from-slate-400 to-slate-300'
                              }`}
                              style={{ width: `${accuracy}%` }}
                            />
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <Badge className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white border-0 shadow-md">
                            +{session.xp} XP
                          </Badge>
                          <div className="text-xs text-slate-500 mt-1">
                            {accuracy}% 정답률
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Zap className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">아직 학습 세션이 없습니다</p>
                  <p className="text-sm mt-1">첫 학습을 시작해보세요!</p>
                </div>
              )}
            </div>
          </BentoCard>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
