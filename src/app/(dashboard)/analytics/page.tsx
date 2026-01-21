'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// 임시 데이터 (실제로는 Firebase에서 가져옴)
const MOCK_STATS = {
  totalProblems: 156,
  correctProblems: 124,
  accuracyRate: 79.5,
  totalTimeMinutes: 420,
  avgTimePerProblem: 45,
  streakDays: 7,
  longestStreak: 14,
  flowTimePercentage: 62,
  currentLevel: 8,
  totalXp: 2450,
  xpToNextLevel: 550,
};

const WEEKLY_DATA = [
  { day: '월', problems: 18, minutes: 45, accuracy: 78 },
  { day: '화', problems: 22, minutes: 55, accuracy: 82 },
  { day: '수', problems: 15, minutes: 35, accuracy: 73 },
  { day: '목', problems: 28, minutes: 70, accuracy: 86 },
  { day: '금', problems: 20, minutes: 50, accuracy: 80 },
  { day: '토', problems: 35, minutes: 90, accuracy: 89 },
  { day: '일', problems: 18, minutes: 45, accuracy: 72 },
];

const TOPIC_MASTERY = [
  { topic: '사칙연산', mastery: 92, problems: 45 },
  { topic: '분수', mastery: 78, problems: 32 },
  { topic: '대수', mastery: 65, problems: 28 },
  { topic: '기하학', mastery: 55, problems: 22 },
  { topic: '함수', mastery: 42, problems: 18 },
  { topic: '통계', mastery: 38, problems: 11 },
];

const RECENT_SESSIONS = [
  {
    id: '1',
    date: '2024-01-21',
    duration: 30,
    problems: 25,
    correct: 22,
    xp: 180,
    flowPercent: 72,
  },
  {
    id: '2',
    date: '2024-01-20',
    duration: 10,
    problems: 10,
    correct: 8,
    xp: 65,
    flowPercent: 58,
  },
  {
    id: '3',
    date: '2024-01-19',
    duration: 60,
    problems: 48,
    correct: 41,
    xp: 320,
    flowPercent: 81,
  },
  {
    id: '4',
    date: '2024-01-18',
    duration: 5,
    problems: 5,
    correct: 4,
    xp: 35,
    flowPercent: 45,
  },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  const maxProblems = Math.max(...WEEKLY_DATA.map((d) => d.problems));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">학습 통계</h1>
          <p className="text-gray-600">학습 진행 상황과 성과를 확인하세요</p>
        </div>

        {/* 기간 선택 */}
        <div className="flex gap-2">
          {[
            { value: 'week', label: '이번 주' },
            { value: 'month', label: '이번 달' },
            { value: 'all', label: '전체' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value as typeof timeRange)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">총 문제 수</div>
            <div className="text-3xl font-bold text-blue-600">
              {MOCK_STATS.totalProblems}
            </div>
            <div className="text-xs text-green-600 mt-1">+23 이번 주</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">정답률</div>
            <div className="text-3xl font-bold text-green-600">
              {MOCK_STATS.accuracyRate}%
            </div>
            <div className="text-xs text-green-600 mt-1">+2.3% 향상</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">학습 시간</div>
            <div className="text-3xl font-bold text-purple-600">
              {Math.floor(MOCK_STATS.totalTimeMinutes / 60)}시간
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {MOCK_STATS.totalTimeMinutes % 60}분
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">연속 학습</div>
            <div className="text-3xl font-bold text-orange-600">
              {MOCK_STATS.streakDays}일
            </div>
            <div className="text-xs text-gray-500 mt-1">
              최장 {MOCK_STATS.longestStreak}일
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* 주간 학습 그래프 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">주간 학습 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-48 gap-2">
              {WEEKLY_DATA.map((data, index) => {
                const height = (data.problems / maxProblems) * 100;
                const isToday = index === WEEKLY_DATA.length - 1;

                return (
                  <div key={data.day} className="flex-1 flex flex-col items-center">
                    <div className="text-xs text-gray-500 mb-1">{data.problems}</div>
                    <div
                      className={`w-full rounded-t-lg transition-all ${
                        isToday
                          ? 'bg-gradient-to-t from-blue-600 to-blue-400'
                          : 'bg-blue-200'
                      }`}
                      style={{ height: `${height}%`, minHeight: '8px' }}
                    />
                    <div className={`text-xs mt-2 ${isToday ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
                      {data.day}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 레벨 진행률 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">레벨 진행률</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {MOCK_STATS.currentLevel}
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold">{MOCK_STATS.totalXp} XP</div>
                <div className="text-gray-600">
                  다음 레벨까지 {MOCK_STATS.xpToNextLevel} XP
                </div>
              </div>
            </div>

            <Progress
              value={((1000 - MOCK_STATS.xpToNextLevel) / 1000) * 100}
              className="h-3 mb-2"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>레벨 {MOCK_STATS.currentLevel}</span>
              <span>레벨 {MOCK_STATS.currentLevel + 1}</span>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-2">
                🎯 몰입 학습 비율
              </div>
              <div className="flex items-center gap-2">
                <Progress value={MOCK_STATS.flowTimePercentage} className="h-2 flex-1" />
                <span className="text-sm font-bold text-blue-600">
                  {MOCK_STATS.flowTimePercentage}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 주제별 숙련도 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">주제별 숙련도</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {TOPIC_MASTERY.map((topic) => (
              <div key={topic.topic} className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium">{topic.topic}</div>
                <div className="flex-1">
                  <Progress value={topic.mastery} className="h-3" />
                </div>
                <div className="w-12 text-right text-sm font-bold">
                  {topic.mastery}%
                </div>
                <div className="w-16 text-right text-xs text-gray-500">
                  {topic.problems}문제
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 최근 세션 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">최근 학습 세션</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {RECENT_SESSIONS.map((session) => {
              const accuracy = Math.round((session.correct / session.problems) * 100);

              return (
                <div
                  key={session.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="w-20">
                    <div className="text-sm font-medium">
                      {new Date(session.date).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="text-xs text-gray-500">{session.duration}분</div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">
                        {session.correct}/{session.problems} 정답
                      </span>
                      <Badge
                        variant={accuracy >= 80 ? 'success' : 'secondary'}
                        className="text-xs"
                      >
                        {accuracy}%
                      </Badge>
                    </div>
                    <Progress value={accuracy} className="h-2" />
                  </div>

                  <div className="text-right">
                    <Badge variant="xp">+{session.xp} XP</Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      몰입 {session.flowPercent}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
