'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { MATH_TOPICS, MathTopic } from '@/types';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

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

// 업적 정의
const ACHIEVEMENTS_MAP: Record<string, { name: string; icon: string }> = {
  'first_step': { name: '첫 걸음', icon: '🎯' },
  'week_streak': { name: '일주일 마라톤', icon: '📅' },
  'perfect_10': { name: '퍼펙트 10', icon: '💯' },
  'flow_master': { name: '몰입 마스터', icon: '🧘' },
  'level_5': { name: '레벨 5 달성', icon: '⭐' },
  'level_10': { name: '레벨 10 달성', icon: '🌟' },
  'algebra_beginner': { name: '대수 입문', icon: '➕' },
  'geometry_beginner': { name: '기하 입문', icon: '📐' },
  'problem_100': { name: '100문제 해결', icon: '🔥' },
  'problem_500': { name: '500문제 해결', icon: '🏆' },
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
      // 사용자 데이터 가져오기
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserData(userDoc.data() as UserData);
      }

      // 오늘 날짜
      const today = new Date().toISOString().split('T')[0];

      // 오늘의 통계 가져오기
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

      // 최근 세션 가져오기
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

      // 업적 가져오기
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
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 실제 데이터 또는 기본값
  const displayName = userData?.name || user?.displayName || '사용자';
  const level = userData?.currentLevel || 1;
  const totalXp = userData?.totalXp || 0;
  const xpToNextLevel = level * 100;
  const xpProgress = totalXp % 100;
  const streakDays = userData?.streakDays || 0;

  // 오늘 통계
  const todayProblems = todayStats?.problemsSolved || 0;
  const todayCorrect = todayStats?.problemsCorrect || 0;
  const todayAccuracy = todayProblems > 0 ? Math.round((todayCorrect / todayProblems) * 100) : 0;
  const todayFlowTime = todayStats?.timeSpentMinutes || 0;
  const todayLimit = 20;

  // 주제별 진행률 계산 (최근 세션 기반)
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

      return { topic: item.topic, progress, lastPracticed };
    });

  // 업적 데이터 변환
  const recentAchievements = achievements.slice(0, 3).map(ach => {
    const achievementInfo = ACHIEVEMENTS_MAP[ach.achievementId] || { name: ach.achievementId, icon: '🎖️' };
    const unlockedDate = ach.unlockedAt.toDate();
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - unlockedDate.getTime()) / (1000 * 60 * 60 * 24));
    let dateStr = '오늘';
    if (diffDays === 1) dateStr = '어제';
    else if (diffDays > 1) dateStr = `${diffDays}일 전`;

    return {
      name: achievementInfo.name,
      icon: achievementInfo.icon,
      date: dateStr
    };
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          안녕하세요, {displayName}님!
        </h1>
        <p className="text-gray-600">오늘도 함께 수학을 정복해볼까요?</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{streakDays}</div>
              <div className="text-sm text-gray-600">연속 학습일</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{todayAccuracy}%</div>
              <div className="text-sm text-gray-600">오늘 정답률</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{todayFlowTime}분</div>
              <div className="text-sm text-gray-600">오늘 학습 시간</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">Lv.{level}</div>
              <div className="text-sm text-gray-600">현재 레벨</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Today's Progress */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>오늘의 학습</span>
              <Badge variant="info">{todayProblems}/{todayLimit} 문제</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span>오늘 진행률</span>
                <span>{Math.round((todayProblems / todayLimit) * 100)}%</span>
              </div>
              <Progress value={(todayProblems / todayLimit) * 100} variant="gradient" />
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span>XP 진행률</span>
                <span>{xpProgress}/{100} XP</span>
              </div>
              <Progress value={xpProgress} variant="success" />
            </div>

            <Link href="/practice">
              <Button variant="gradient" size="lg" className="w-full">
                학습 시작하기
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        <Card>
          <CardHeader>
            <CardTitle>최근 업적</CardTitle>
          </CardHeader>
          <CardContent>
            {recentAchievements.length > 0 ? (
              <div className="space-y-4">
                {recentAchievements.map((achievement, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-xl">
                      {achievement.icon}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{achievement.name}</p>
                      <p className="text-xs text-gray-500">{achievement.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">아직 업적이 없습니다</p>
                <p className="text-xs text-gray-400 mt-1">학습을 시작하면 업적을 획득할 수 있어요!</p>
              </div>
            )}
            <Link href="/achievements" className="block mt-4">
              <Button variant="outline" size="sm" className="w-full">
                전체 보기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Topics */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>학습 중인 주제</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTopics.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-4">
              {recentTopics.map((item) => (
                <div key={item.topic} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{MATH_TOPICS[item.topic]}</span>
                    <span className="text-xs text-gray-500">{item.lastPracticed}</span>
                  </div>
                  <Progress value={item.progress} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">{item.progress}% 정답률</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">아직 학습 기록이 없습니다</p>
              <Link href="/practice" className="mt-3 inline-block">
                <Button variant="gradient" size="sm">
                  첫 학습 시작하기
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total XP Card */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 경험치</p>
              <p className="text-2xl font-bold text-purple-600">{totalXp.toLocaleString()} XP</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">다음 레벨까지</p>
              <p className="text-lg font-semibold">{100 - xpProgress} XP 남음</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
