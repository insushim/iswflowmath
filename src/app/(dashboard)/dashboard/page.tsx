'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { MATH_TOPICS, MathTopic } from '@/types';

export default function DashboardPage() {
  // Mock data - will be replaced with real data from Supabase
  const userData = {
    name: '홍길동',
    level: 5,
    xp: 450,
    xpToNextLevel: 600,
    streak: 7,
    todayProblems: 3,
    todayLimit: 10,
    accuracy: 0.78,
    flowTime: 45,
    theta: 0.5,
  };

  const recentTopics: { topic: MathTopic; progress: number; lastPracticed: string }[] = [
    { topic: 'algebra', progress: 65, lastPracticed: '오늘' },
    { topic: 'geometry', progress: 45, lastPracticed: '어제' },
    { topic: 'functions', progress: 30, lastPracticed: '3일 전' },
  ];

  const recentAchievements = [
    { name: '첫 걸음', icon: '🎯', date: '오늘' },
    { name: '일주일 마라톤', icon: '📅', date: '어제' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          안녕하세요, {userData.name}님! 👋
        </h1>
        <p className="text-gray-600">오늘도 함께 수학을 정복해볼까요?</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{userData.streak}</div>
              <div className="text-sm text-gray-600">연속 학습일</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{Math.round(userData.accuracy * 100)}%</div>
              <div className="text-sm text-gray-600">정답률</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{userData.flowTime}분</div>
              <div className="text-sm text-gray-600">오늘 몰입 시간</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">Lv.{userData.level}</div>
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
              <Badge variant="info">{userData.todayProblems}/{userData.todayLimit} 문제</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span>오늘 진행률</span>
                <span>{Math.round((userData.todayProblems / userData.todayLimit) * 100)}%</span>
              </div>
              <Progress value={(userData.todayProblems / userData.todayLimit) * 100} variant="gradient" />
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span>XP 진행률</span>
                <span>{userData.xp}/{userData.xpToNextLevel} XP</span>
              </div>
              <Progress value={(userData.xp / userData.xpToNextLevel) * 100} variant="success" />
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
                {recentAchievements.map((achievement) => (
                  <div key={achievement.name} className="flex items-center gap-3">
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
              <p className="text-gray-500 text-sm">아직 업적이 없습니다</p>
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
          <div className="grid md:grid-cols-3 gap-4">
            {recentTopics.map((item) => (
              <div key={item.topic} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{MATH_TOPICS[item.topic]}</span>
                  <span className="text-xs text-gray-500">{item.lastPracticed}</span>
                </div>
                <Progress value={item.progress} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">{item.progress}% 완료</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
