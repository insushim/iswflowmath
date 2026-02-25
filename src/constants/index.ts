// ============================================================
// 셈마루(SemMaru) - Constants
// ============================================================

// IRT Constants
export const IRT_CONSTANTS = {
  MIN_THETA: -3,
  MAX_THETA: 3,
  INITIAL_THETA: 0,
  THETA_CHANGE_RATE: 0.1,
  MIN_DISCRIMINATION: 0.5,
  MAX_DISCRIMINATION: 2.5,
  DEFAULT_DISCRIMINATION: 1.0,
  MIN_GUESSING: 0,
  MAX_GUESSING: 0.3,
  DEFAULT_GUESSING: 0.2,
};

// Flow Constants
export const FLOW_CONSTANTS = {
  OPTIMAL_SUCCESS_RATE: 0.7, // 70% success rate for flow
  CHALLENGE_SKILL_RATIO: 1.0, // Ideal balance
  MIN_ENGAGEMENT: 30, // Below this = intervention needed
  FLOW_THRESHOLD: 70, // Above this = in flow state
  ADJUSTMENT_INTERVAL: 3, // Adjust difficulty every N problems
};

// XP & Leveling
export const XP_CONSTANTS = {
  BASE_XP_PER_PROBLEM: 10,
  CORRECT_MULTIPLIER: 2,
  STREAK_BONUS: 5,
  FLOW_BONUS: 10,
  HINT_PENALTY: 3,
  LEVEL_XP_BASE: 100,
  LEVEL_XP_MULTIPLIER: 1.5,
};

// Calculate XP needed for a level
export function getXPForLevel(level: number): number {
  return Math.floor(
    XP_CONSTANTS.LEVEL_XP_BASE *
      Math.pow(XP_CONSTANTS.LEVEL_XP_MULTIPLIER, level - 1),
  );
}

// Calculate level from total XP
export function getLevelFromXP(totalXP: number): number {
  let level = 1;
  let xpNeeded = getXPForLevel(level);
  let accumulatedXP = 0;

  while (accumulatedXP + xpNeeded <= totalXP) {
    accumulatedXP += xpNeeded;
    level++;
    xpNeeded = getXPForLevel(level);
  }

  return level;
}

// Time Constants
export const TIME_CONSTANTS = {
  MIN_TIME_PER_PROBLEM: 5000, // 5 seconds minimum
  MAX_TIME_PER_PROBLEM: 300000, // 5 minutes maximum
  IDEAL_TIME_PER_PROBLEM: 60000, // 1 minute ideal
  SESSION_TIMEOUT: 1800000, // 30 minutes
  STREAK_RESET_HOURS: 36, // Hours before streak resets
};

// API Limits
export const API_LIMITS = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  REQUEST_TIMEOUT: 30000,
  MAX_PROBLEMS_PER_SESSION: 50,
};

// Grade to Topic Mapping
export const GRADE_TOPICS: Record<number, string[]> = {
  1: ["arithmetic"],
  2: ["arithmetic", "fractions"],
  3: ["arithmetic", "fractions", "decimals"],
  4: ["arithmetic", "fractions", "decimals", "geometry"],
  5: ["fractions", "decimals", "geometry", "statistics"],
  6: ["fractions", "decimals", "geometry", "statistics", "probability"],
  7: ["algebra", "geometry", "statistics"],
  8: ["algebra", "functions", "geometry"],
  9: ["algebra", "functions", "geometry", "statistics"],
  10: ["algebra", "functions", "geometry", "probability"],
  11: ["functions", "calculus", "vectors", "sequences"],
  12: ["calculus", "vectors", "sequences", "probability"],
};

// Difficulty Labels
export const DIFFICULTY_LABELS: Record<string, string> = {
  "-3": "매우 쉬움",
  "-2": "쉬움",
  "-1": "약간 쉬움",
  "0": "보통",
  "1": "약간 어려움",
  "2": "어려움",
  "3": "매우 어려움",
};

// Achievement Definitions
export const ACHIEVEMENTS = {
  // Problems solved
  FIRST_PROBLEM: {
    id: "first_problem",
    name: "첫 걸음",
    description: "첫 번째 문제를 풀었습니다",
    icon: "🎯",
    category: "problems" as const,
    requirement: 1,
    xp_reward: 50,
  },
  TEN_PROBLEMS: {
    id: "ten_problems",
    name: "열 번의 도전",
    description: "10문제를 풀었습니다",
    icon: "🔟",
    category: "problems" as const,
    requirement: 10,
    xp_reward: 100,
  },
  HUNDRED_PROBLEMS: {
    id: "hundred_problems",
    name: "백전백승",
    description: "100문제를 풀었습니다",
    icon: "💯",
    category: "problems" as const,
    requirement: 100,
    xp_reward: 500,
  },
  THOUSAND_PROBLEMS: {
    id: "thousand_problems",
    name: "천재",
    description: "1000문제를 풀었습니다",
    icon: "🏆",
    category: "problems" as const,
    requirement: 1000,
    xp_reward: 2000,
  },

  // Streaks
  THREE_DAY_STREAK: {
    id: "three_day_streak",
    name: "꾸준한 시작",
    description: "3일 연속 학습",
    icon: "🔥",
    category: "streak" as const,
    requirement: 3,
    xp_reward: 100,
  },
  WEEK_STREAK: {
    id: "week_streak",
    name: "일주일 마라톤",
    description: "7일 연속 학습",
    icon: "📅",
    category: "streak" as const,
    requirement: 7,
    xp_reward: 300,
  },
  MONTH_STREAK: {
    id: "month_streak",
    name: "한 달의 기적",
    description: "30일 연속 학습",
    icon: "🗓️",
    category: "streak" as const,
    requirement: 30,
    xp_reward: 1000,
  },

  // Accuracy
  PERFECT_SESSION: {
    id: "perfect_session",
    name: "완벽한 세션",
    description: "한 세션 100% 정답률",
    icon: "✨",
    category: "accuracy" as const,
    requirement: 100,
    xp_reward: 200,
  },
  HIGH_ACCURACY: {
    id: "high_accuracy",
    name: "정확도 마스터",
    description: "전체 정답률 90% 이상",
    icon: "🎯",
    category: "accuracy" as const,
    requirement: 90,
    xp_reward: 500,
  },

  // Flow
  FIRST_FLOW: {
    id: "first_flow",
    name: "첫 몰입",
    description: "처음으로 몰입 상태 도달",
    icon: "🧘",
    category: "flow" as const,
    requirement: 1,
    xp_reward: 100,
  },
  FLOW_MASTER: {
    id: "flow_master",
    name: "몰입의 달인",
    description: "1시간 연속 몰입",
    icon: "🧠",
    category: "flow" as const,
    requirement: 60,
    xp_reward: 500,
  },

  // Speed
  QUICK_SOLVER: {
    id: "quick_solver",
    name: "번개 솔버",
    description: "10초 이내 정답",
    icon: "⚡",
    category: "speed" as const,
    requirement: 10,
    xp_reward: 50,
  },

  // Mastery
  TOPIC_MASTER: {
    id: "topic_master",
    name: "주제 마스터",
    description: "한 주제 완전 정복",
    icon: "👑",
    category: "mastery" as const,
    requirement: 1,
    xp_reward: 1000,
  },
};

// App Configuration
export const APP_CONFIG = {
  name: "셈마루",
  nameEn: "SemMaru",
  tagline: "몰입으로 수학의 정상에 오르다",
  description: "AI 기반 적응형 수학 학습 플랫폼",
  version: "1.0.0",
  support_email: "support@semmaru.kr",
  github: "https://github.com/insushim/iswflowmath",
  updateCheckUrl:
    "https://api.github.com/repos/insushim/iswflowmath/releases/latest",
};
