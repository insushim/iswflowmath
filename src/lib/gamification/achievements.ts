// ============================================================
// 셈마루(SemMaru) - Achievements System
// Firestore 직접 접근을 API 호출로 교체
// ============================================================

import { api } from "@/lib/api/client";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category:
    | "problems"
    | "streak"
    | "accuracy"
    | "flow"
    | "speed"
    | "mastery"
    | "special";
  xpReward: number;
  requirement: AchievementRequirement;
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
}

export interface AchievementRequirement {
  type: string;
  value: number;
  condition?: string;
}

export interface UserAchievement {
  achievementId: string;
  unlockedAt: any;
  progress: number;
}

// 업적 정의
export const ACHIEVEMENTS: Achievement[] = [
  // 문제 풀이 업적
  {
    id: "first_problem",
    name: "첫 발자국",
    description: "첫 번째 문제를 풀었습니다",
    icon: "👣",
    category: "problems",
    xpReward: 50,
    requirement: { type: "problems_solved", value: 1 },
    tier: "bronze",
  },
  {
    id: "problems_10",
    name: "꾸준한 학습자",
    description: "10개의 문제를 풀었습니다",
    icon: "📝",
    category: "problems",
    xpReward: 100,
    requirement: { type: "problems_solved", value: 10 },
    tier: "bronze",
  },
  {
    id: "problems_50",
    name: "문제 해결사",
    description: "50개의 문제를 풀었습니다",
    icon: "🎯",
    category: "problems",
    xpReward: 250,
    requirement: { type: "problems_solved", value: 50 },
    tier: "silver",
  },
  {
    id: "problems_100",
    name: "백문백답",
    description: "100개의 문제를 풀었습니다",
    icon: "💯",
    category: "problems",
    xpReward: 500,
    requirement: { type: "problems_solved", value: 100 },
    tier: "gold",
  },
  {
    id: "problems_500",
    name: "수학 마스터",
    description: "500개의 문제를 풀었습니다",
    icon: "🏆",
    category: "problems",
    xpReward: 1500,
    requirement: { type: "problems_solved", value: 500 },
    tier: "platinum",
  },
  {
    id: "problems_1000",
    name: "전설의 학습자",
    description: "1000개의 문제를 풀었습니다",
    icon: "👑",
    category: "problems",
    xpReward: 3000,
    requirement: { type: "problems_solved", value: 1000 },
    tier: "diamond",
  },

  // 스트릭 업적
  {
    id: "streak_3",
    name: "3일 연속",
    description: "3일 연속으로 학습했습니다",
    icon: "🔥",
    category: "streak",
    xpReward: 100,
    requirement: { type: "streak_days", value: 3 },
    tier: "bronze",
  },
  {
    id: "streak_7",
    name: "일주일 완주",
    description: "7일 연속으로 학습했습니다",
    icon: "🔥",
    category: "streak",
    xpReward: 300,
    requirement: { type: "streak_days", value: 7 },
    tier: "silver",
  },
  {
    id: "streak_30",
    name: "한 달의 노력",
    description: "30일 연속으로 학습했습니다",
    icon: "🔥",
    category: "streak",
    xpReward: 1000,
    requirement: { type: "streak_days", value: 30 },
    tier: "gold",
  },
  {
    id: "streak_100",
    name: "백일의 기적",
    description: "100일 연속으로 학습했습니다",
    icon: "🔥",
    category: "streak",
    xpReward: 3000,
    requirement: { type: "streak_days", value: 100 },
    tier: "platinum",
  },
  {
    id: "streak_365",
    name: "1년의 여정",
    description: "365일 연속으로 학습했습니다",
    icon: "🌟",
    category: "streak",
    xpReward: 10000,
    requirement: { type: "streak_days", value: 365 },
    tier: "diamond",
  },

  // 정확도 업적
  {
    id: "accuracy_perfect_session",
    name: "퍼펙트 세션",
    description: "한 세션에서 모든 문제를 맞혔습니다",
    icon: "✨",
    category: "accuracy",
    xpReward: 150,
    requirement: { type: "perfect_sessions", value: 1 },
    tier: "bronze",
  },
  {
    id: "accuracy_perfect_10",
    name: "완벽주의자",
    description: "10번의 퍼펙트 세션을 달성했습니다",
    icon: "💎",
    category: "accuracy",
    xpReward: 500,
    requirement: { type: "perfect_sessions", value: 10 },
    tier: "gold",
  },
  {
    id: "accuracy_90_avg",
    name: "높은 정확도",
    description: "전체 평균 정확도 90% 달성",
    icon: "🎯",
    category: "accuracy",
    xpReward: 300,
    requirement: { type: "average_accuracy", value: 90 },
    tier: "silver",
  },

  // 몰입 업적
  {
    id: "flow_first",
    name: "첫 몰입",
    description: "처음으로 몰입 상태에 도달했습니다",
    icon: "🧘",
    category: "flow",
    xpReward: 100,
    requirement: { type: "flow_states", value: 1 },
    tier: "bronze",
  },
  {
    id: "flow_10",
    name: "집중의 달인",
    description: "10번 몰입 상태에 도달했습니다",
    icon: "🧘",
    category: "flow",
    xpReward: 400,
    requirement: { type: "flow_states", value: 10 },
    tier: "silver",
  },
  {
    id: "flow_master",
    name: "몰입 마스터",
    description: "50번 몰입 상태에 도달했습니다",
    icon: "🌊",
    category: "flow",
    xpReward: 1000,
    requirement: { type: "flow_states", value: 50 },
    tier: "gold",
  },

  // 빠른 풀이 업적
  {
    id: "speed_10_fast",
    name: "번개 손",
    description: "10초 이내에 10문제를 풀었습니다",
    icon: "⚡",
    category: "speed",
    xpReward: 200,
    requirement: { type: "fast_solves", value: 10 },
    tier: "bronze",
  },
  {
    id: "speed_streak_5",
    name: "연속 정답",
    description: "5문제 연속으로 정답을 맞혔습니다",
    icon: "🎪",
    category: "speed",
    xpReward: 100,
    requirement: { type: "max_streak", value: 5 },
    tier: "bronze",
  },
  {
    id: "speed_streak_10",
    name: "연속 10콤보",
    description: "10문제 연속으로 정답을 맞혔습니다",
    icon: "🎪",
    category: "speed",
    xpReward: 300,
    requirement: { type: "max_streak", value: 10 },
    tier: "silver",
  },
  {
    id: "speed_streak_20",
    name: "콤보 마스터",
    description: "20문제 연속으로 정답을 맞혔습니다",
    icon: "🎪",
    category: "speed",
    xpReward: 700,
    requirement: { type: "max_streak", value: 20 },
    tier: "gold",
  },

  // 레벨/마스터리 업적
  {
    id: "level_5",
    name: "성장하는 학습자",
    description: "레벨 5에 도달했습니다",
    icon: "📈",
    category: "mastery",
    xpReward: 200,
    requirement: { type: "level", value: 5 },
    tier: "bronze",
  },
  {
    id: "level_10",
    name: "수학 도전자",
    description: "레벨 10에 도달했습니다",
    icon: "📈",
    category: "mastery",
    xpReward: 500,
    requirement: { type: "level", value: 10 },
    tier: "silver",
  },
  {
    id: "level_25",
    name: "수학 전문가",
    description: "레벨 25에 도달했습니다",
    icon: "🎓",
    category: "mastery",
    xpReward: 1500,
    requirement: { type: "level", value: 25 },
    tier: "gold",
  },
  {
    id: "level_50",
    name: "수학의 현자",
    description: "레벨 50에 도달했습니다",
    icon: "🧙",
    category: "mastery",
    xpReward: 3000,
    requirement: { type: "level", value: 50 },
    tier: "platinum",
  },
  {
    id: "level_100",
    name: "수학의 신",
    description: "최고 레벨에 도달했습니다",
    icon: "👑",
    category: "mastery",
    xpReward: 10000,
    requirement: { type: "level", value: 100 },
    tier: "diamond",
  },

  // 특별 업적
  {
    id: "xp_1000",
    name: "XP 수집가",
    description: "총 1,000 XP를 획득했습니다",
    icon: "⭐",
    category: "special",
    xpReward: 100,
    requirement: { type: "total_xp", value: 1000 },
    tier: "bronze",
  },
  {
    id: "xp_10000",
    name: "XP 헌터",
    description: "총 10,000 XP를 획득했습니다",
    icon: "⭐",
    category: "special",
    xpReward: 500,
    requirement: { type: "total_xp", value: 10000 },
    tier: "silver",
  },
  {
    id: "xp_100000",
    name: "XP 마스터",
    description: "총 100,000 XP를 획득했습니다",
    icon: "🌟",
    category: "special",
    xpReward: 2000,
    requirement: { type: "total_xp", value: 100000 },
    tier: "gold",
  },
];

// 업적 확인 및 잠금 해제 (D1 API로 위임)
export async function checkAndUnlockAchievements(
  userId: string,
  context: {
    type: string;
    totalXp?: number;
    level?: number;
    streakDays?: number;
    problemsSolved?: number;
    perfectSessions?: number;
    flowStates?: number;
    fastSolves?: number;
    maxStreak?: number;
    averageAccuracy?: number;
  },
): Promise<string[]> {
  try {
    const result = await api.checkAchievements(context);
    return result.newlyUnlocked || [];
  } catch {
    return [];
  }
}

// 업적 ID로 업적 정보 가져오기
export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

// 카테고리별 업적 가져오기
export function getAchievementsByCategory(
  category: Achievement["category"],
): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.category === category);
}

// 티어별 업적 가져오기
export function getAchievementsByTier(
  tier: Achievement["tier"],
): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.tier === tier);
}

// 사용자의 업적 진행 상황 계산 (API)
export async function getUserAchievementProgress(userId: string): Promise<{
  unlocked: string[];
  totalUnlocked: number;
  totalAchievements: number;
  xpFromAchievements: number;
  progress: Record<
    string,
    { current: number; required: number; percentage: number }
  >;
}> {
  try {
    // 유저 데이터 가져오기
    const userResult = await api.getUser();
    const userData = userResult.user || {};

    // 해금된 업적 가져오기
    const achResult = await api.getAchievements();
    const unlockedAchievements = (achResult.achievements || []).map(
      (a: any) => a.achievement_id,
    );

    // 해제된 업적에서 얻은 총 XP
    const xpFromAchievements = unlockedAchievements.reduce(
      (total: number, id: string) => {
        const achievement = getAchievementById(id);
        return total + (achievement?.xpReward || 0);
      },
      0,
    );

    // 각 업적 진행 상황
    const stats = {
      total_xp: userData.total_xp || 0,
      level: userData.current_level || 1,
      streak_days: userData.streak_days || 0,
      problems_solved: userData.problems_solved || 0,
      perfect_sessions: userData.perfect_sessions || 0,
      flow_states: userData.flow_states || 0,
      fast_solves: userData.fast_solves || 0,
      max_streak: userData.max_streak || 0,
      average_accuracy: userData.average_accuracy || 0,
    };

    const progress: Record<
      string,
      { current: number; required: number; percentage: number }
    > = {};

    for (const achievement of ACHIEVEMENTS) {
      const { type, value } = achievement.requirement;
      const current = stats[type as keyof typeof stats] || 0;
      progress[achievement.id] = {
        current,
        required: value,
        percentage: Math.min(100, Math.floor((current / value) * 100)),
      };
    }

    return {
      unlocked: unlockedAchievements,
      totalUnlocked: unlockedAchievements.length,
      totalAchievements: ACHIEVEMENTS.length,
      xpFromAchievements,
      progress,
    };
  } catch {
    return {
      unlocked: [],
      totalUnlocked: 0,
      totalAchievements: ACHIEVEMENTS.length,
      xpFromAchievements: 0,
      progress: {},
    };
  }
}

// 업적 해제 이벤트 (애니메이션/알림용)
export interface AchievementUnlockEvent {
  achievement: Achievement;
  unlockedAt: Date;
  xpAwarded: number;
}

// 최근 해제된 업적 가져오기 (API)
export async function getRecentAchievements(
  userId: string,
  limit: number = 5,
): Promise<AchievementUnlockEvent[]> {
  try {
    const achResult = await api.getAchievements();
    const achievements = achResult.achievements || [];

    return achievements
      .sort(
        (a: any, b: any) =>
          new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime(),
      )
      .slice(0, limit)
      .map((entry: any) => {
        const achievement = getAchievementById(entry.achievement_id);
        return {
          achievement: achievement!,
          unlockedAt: new Date(entry.unlocked_at),
          xpAwarded: achievement?.xpReward || 0,
        };
      })
      .filter((e: AchievementUnlockEvent) => e.achievement);
  } catch {
    return [];
  }
}
