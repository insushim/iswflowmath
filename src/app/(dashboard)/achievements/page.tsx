'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'problems' | 'streak' | 'accuracy' | 'flow' | 'speed' | 'mastery';
  requirement: number;
  progress: number;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: string;
}

const ACHIEVEMENTS: Achievement[] = [
  // 문제 풀이
  {
    id: 'first-problem',
    name: '첫 발걸음',
    description: '첫 번째 문제를 풀었습니다',
    icon: '👣',
    category: 'problems',
    requirement: 1,
    progress: 1,
    xpReward: 10,
    unlocked: true,
    unlockedAt: '2024-01-15',
  },
  {
    id: 'problem-10',
    name: '꾸준한 학습자',
    description: '10개의 문제를 풀었습니다',
    icon: '📚',
    category: 'problems',
    requirement: 10,
    progress: 10,
    xpReward: 50,
    unlocked: true,
    unlockedAt: '2024-01-16',
  },
  {
    id: 'problem-50',
    name: '열정적인 학습자',
    description: '50개의 문제를 풀었습니다',
    icon: '🔥',
    category: 'problems',
    requirement: 50,
    progress: 32,
    xpReward: 100,
    unlocked: false,
  },
  {
    id: 'problem-100',
    name: '문제 정복자',
    description: '100개의 문제를 풀었습니다',
    icon: '🏆',
    category: 'problems',
    requirement: 100,
    progress: 32,
    xpReward: 200,
    unlocked: false,
  },
  {
    id: 'problem-500',
    name: '수학 마스터',
    description: '500개의 문제를 풀었습니다',
    icon: '👑',
    category: 'problems',
    requirement: 500,
    progress: 32,
    xpReward: 500,
    unlocked: false,
  },

  // 연속 학습
  {
    id: 'streak-3',
    name: '3일 연속',
    description: '3일 연속으로 학습했습니다',
    icon: '🌱',
    category: 'streak',
    requirement: 3,
    progress: 3,
    xpReward: 30,
    unlocked: true,
    unlockedAt: '2024-01-17',
  },
  {
    id: 'streak-7',
    name: '일주일 챔피언',
    description: '7일 연속으로 학습했습니다',
    icon: '🌿',
    category: 'streak',
    requirement: 7,
    progress: 5,
    xpReward: 70,
    unlocked: false,
  },
  {
    id: 'streak-30',
    name: '한 달의 기적',
    description: '30일 연속으로 학습했습니다',
    icon: '🌳',
    category: 'streak',
    requirement: 30,
    progress: 5,
    xpReward: 300,
    unlocked: false,
  },

  // 정확도
  {
    id: 'accuracy-80',
    name: '정확한 계산',
    description: '세션에서 80% 이상 정답률 달성',
    icon: '🎯',
    category: 'accuracy',
    requirement: 80,
    progress: 85,
    xpReward: 50,
    unlocked: true,
    unlockedAt: '2024-01-18',
  },
  {
    id: 'accuracy-90',
    name: '거의 완벽',
    description: '세션에서 90% 이상 정답률 달성',
    icon: '💎',
    category: 'accuracy',
    requirement: 90,
    progress: 85,
    xpReward: 100,
    unlocked: false,
  },
  {
    id: 'perfect-session',
    name: '완벽한 세션',
    description: '세션에서 100% 정답률 달성',
    icon: '⭐',
    category: 'accuracy',
    requirement: 100,
    progress: 85,
    xpReward: 200,
    unlocked: false,
  },

  // 몰입
  {
    id: 'flow-10',
    name: '몰입의 시작',
    description: '몰입 상태로 10분 학습',
    icon: '🧘',
    category: 'flow',
    requirement: 10,
    progress: 15,
    xpReward: 50,
    unlocked: true,
    unlockedAt: '2024-01-19',
  },
  {
    id: 'flow-30',
    name: '깊은 몰입',
    description: '몰입 상태로 30분 학습',
    icon: '🌊',
    category: 'flow',
    requirement: 30,
    progress: 15,
    xpReward: 100,
    unlocked: false,
  },
  {
    id: 'flow-60',
    name: '몰입 마스터',
    description: '몰입 상태로 60분 학습',
    icon: '🚀',
    category: 'flow',
    requirement: 60,
    progress: 15,
    xpReward: 200,
    unlocked: false,
  },

  // 속도
  {
    id: 'speed-demon',
    name: '스피드 데몬',
    description: '문제를 10초 이내에 정답 맞추기',
    icon: '⚡',
    category: 'speed',
    requirement: 1,
    progress: 1,
    xpReward: 30,
    unlocked: true,
    unlockedAt: '2024-01-20',
  },
  {
    id: 'quick-session',
    name: '빠른 세션',
    description: '5분 세션을 3분 이내에 완료',
    icon: '🏃',
    category: 'speed',
    requirement: 1,
    progress: 0,
    xpReward: 50,
    unlocked: false,
  },

  // 마스터리
  {
    id: 'arithmetic-master',
    name: '사칙연산 마스터',
    description: '사칙연산 분야 완전 정복',
    icon: '➕',
    category: 'mastery',
    requirement: 100,
    progress: 65,
    xpReward: 200,
    unlocked: false,
  },
  {
    id: 'algebra-master',
    name: '대수 마스터',
    description: '대수 분야 완전 정복',
    icon: '🔢',
    category: 'mastery',
    requirement: 100,
    progress: 40,
    xpReward: 200,
    unlocked: false,
  },
  {
    id: 'geometry-master',
    name: '기하학 마스터',
    description: '기하학 분야 완전 정복',
    icon: '📐',
    category: 'mastery',
    requirement: 100,
    progress: 25,
    xpReward: 200,
    unlocked: false,
  },
];

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  problems: { label: '문제 풀이', color: 'bg-blue-100 text-blue-700' },
  streak: { label: '연속 학습', color: 'bg-green-100 text-green-700' },
  accuracy: { label: '정확도', color: 'bg-purple-100 text-purple-700' },
  flow: { label: '몰입', color: 'bg-orange-100 text-orange-700' },
  speed: { label: '속도', color: 'bg-red-100 text-red-700' },
  mastery: { label: '마스터리', color: 'bg-yellow-100 text-yellow-700' },
};

export default function AchievementsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const unlockedCount = ACHIEVEMENTS.filter((a) => a.unlocked).length;
  const totalXpEarned = ACHIEVEMENTS.filter((a) => a.unlocked).reduce((sum, a) => sum + a.xpReward, 0);

  const filteredAchievements = selectedCategory
    ? ACHIEVEMENTS.filter((a) => a.category === selectedCategory)
    : ACHIEVEMENTS;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">업적</h1>
      <p className="text-gray-600 mb-8">학습 목표를 달성하고 보상을 획득하세요</p>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{unlockedCount}</div>
            <div className="text-sm text-gray-600">획득한 업적</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">{ACHIEVEMENTS.length}</div>
            <div className="text-sm text-gray-600">전체 업적</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">+{totalXpEarned}</div>
            <div className="text-sm text-gray-600">획득 XP</div>
          </CardContent>
        </Card>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          전체
        </button>
        {Object.entries(CATEGORY_LABELS).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 업적 목록 */}
      <div className="grid gap-4">
        {filteredAchievements.map((achievement) => {
          const category = CATEGORY_LABELS[achievement.category];
          const progressPercent = Math.min(100, (achievement.progress / achievement.requirement) * 100);

          return (
            <Card
              key={achievement.id}
              className={`transition-all ${
                achievement.unlocked
                  ? 'border-green-200 bg-green-50/50'
                  : 'opacity-75'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* 아이콘 */}
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                      achievement.unlocked
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                        : 'bg-gray-200'
                    }`}
                  >
                    {achievement.unlocked ? achievement.icon : '🔒'}
                  </div>

                  {/* 내용 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold">{achievement.name}</h3>
                      <Badge className={category.color}>{category.label}</Badge>
                      {achievement.unlocked && (
                        <Badge variant="success">획득</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>

                    {!achievement.unlocked && (
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>진행률</span>
                          <span>
                            {achievement.progress}/{achievement.requirement}
                          </span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>
                    )}

                    {achievement.unlocked && achievement.unlockedAt && (
                      <p className="text-xs text-gray-500">
                        {new Date(achievement.unlockedAt).toLocaleDateString('ko-KR')} 획득
                      </p>
                    )}
                  </div>

                  {/* 보상 */}
                  <div className="text-right">
                    <Badge variant="xp" className="text-sm">
                      +{achievement.xpReward} XP
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
