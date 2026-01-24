// ============================================================
// MathFlow - Gamification Constants
// ============================================================

// XP 보상 테이블
export const XP_REWARDS = {
  // 문제 풀이
  PROBLEM_CORRECT: 10,           // 정답
  PROBLEM_CORRECT_STREAK: 5,     // 연속 정답 보너스 (3개 이상)
  PROBLEM_FIRST_TRY: 3,          // 첫 시도 정답 보너스
  PROBLEM_FAST: 5,               // 빠른 풀이 (10초 이내) 보너스

  // 세션
  SESSION_COMPLETE: 20,          // 세션 완료
  SESSION_PERFECT: 50,           // 100% 정답 세션
  SESSION_FLOW: 30,              // 몰입 상태 유지 보너스

  // 연속 학습
  DAILY_FIRST: 15,               // 일일 첫 학습
  STREAK_BONUS_PER_DAY: 5,       // 스트릭 일수당 추가 XP
  STREAK_MILESTONE_3: 30,        // 3일 스트릭
  STREAK_MILESTONE_7: 100,       // 7일 스트릭
  STREAK_MILESTONE_30: 500,      // 30일 스트릭

  // 레벨업
  LEVEL_UP: 50,                  // 레벨업 보너스
} as const;

// 레벨 시스템
export const LEVEL_CONFIG = {
  BASE_XP: 100,                  // 레벨 1→2에 필요한 기본 XP
  SCALING_FACTOR: 1.2,           // 레벨당 필요 XP 증가율
  MAX_LEVEL: 100,                // 최대 레벨
} as const;

// 레벨별 필요 XP 계산
export function getXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(LEVEL_CONFIG.BASE_XP * Math.pow(LEVEL_CONFIG.SCALING_FACTOR, level - 2));
}

// 현재 레벨 계산
export function calculateLevel(totalXp: number): { level: number; currentXp: number; xpToNext: number; progress: number } {
  let level = 1;
  let xpRemaining = totalXp;

  while (level < LEVEL_CONFIG.MAX_LEVEL) {
    const xpNeeded = getXpForLevel(level + 1);
    if (xpRemaining < xpNeeded) {
      break;
    }
    xpRemaining -= xpNeeded;
    level++;
  }

  const xpToNext = level < LEVEL_CONFIG.MAX_LEVEL ? getXpForLevel(level + 1) : 0;
  const progress = xpToNext > 0 ? Math.min(100, (xpRemaining / xpToNext) * 100) : 100;

  return {
    level,
    currentXp: xpRemaining,
    xpToNext,
    progress
  };
}

// 레벨 타이틀
export const LEVEL_TITLES: Record<number, string> = {
  1: '수학 새싹',
  5: '수학 탐험가',
  10: '수학 도전자',
  15: '수학 연구원',
  20: '수학 전문가',
  30: '수학 마스터',
  50: '수학 현자',
  75: '수학 대가',
  100: '수학의 신',
};

export function getLevelTitle(level: number): string {
  const milestones = Object.keys(LEVEL_TITLES).map(Number).sort((a, b) => b - a);
  for (const milestone of milestones) {
    if (level >= milestone) {
      return LEVEL_TITLES[milestone];
    }
  }
  return LEVEL_TITLES[1];
}

// 난이도별 XP 배율
export const DIFFICULTY_MULTIPLIER: Record<string, number> = {
  '5min': 1.0,
  '10min': 1.2,
  '30min': 1.5,
  '1hour': 2.0,
  '1day': 2.5,
  '3days': 3.0,
  '7days': 3.5,
  '1month': 4.0,
};

// 정확도 보너스 (세션 완료 시)
export function getAccuracyBonus(accuracy: number): number {
  if (accuracy >= 100) return 50;
  if (accuracy >= 90) return 30;
  if (accuracy >= 80) return 15;
  if (accuracy >= 70) return 5;
  return 0;
}
