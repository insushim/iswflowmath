// ============================================================
// 셈마루(SemMaru) - XP System
// Firestore 직접 접근을 API 호출로 교체
// ============================================================

import { api } from "@/lib/api/client";
import {
  XP_REWARDS,
  calculateLevel,
  getLevelTitle,
  DIFFICULTY_MULTIPLIER,
  getAccuracyBonus,
} from "./constants";

export interface XpGainResult {
  xpGained: number;
  totalXp: number;
  newLevel: number;
  previousLevel: number;
  leveledUp: boolean;
  levelTitle: string;
  bonuses: XpBonus[];
  achievementsUnlocked: string[];
}

export interface XpBonus {
  type: string;
  amount: number;
  description: string;
}

export interface ProblemResult {
  correct: boolean;
  timeSpent: number; // 초
  firstTry: boolean;
  difficulty?: string;
  streakCount: number; // 연속 정답 수
}

// 문제 풀이 후 XP 계산
export function calculateProblemXp(result: ProblemResult): {
  totalXp: number;
  bonuses: XpBonus[];
} {
  const bonuses: XpBonus[] = [];
  let totalXp = 0;

  if (!result.correct) {
    return { totalXp: 0, bonuses: [] };
  }

  // 기본 정답 XP
  totalXp += XP_REWARDS.PROBLEM_CORRECT;
  bonuses.push({
    type: "correct",
    amount: XP_REWARDS.PROBLEM_CORRECT,
    description: "정답",
  });

  // 첫 시도 보너스
  if (result.firstTry) {
    totalXp += XP_REWARDS.PROBLEM_FIRST_TRY;
    bonuses.push({
      type: "first_try",
      amount: XP_REWARDS.PROBLEM_FIRST_TRY,
      description: "첫 시도 정답",
    });
  }

  // 빠른 풀이 보너스 (10초 이내)
  if (result.timeSpent <= 10) {
    totalXp += XP_REWARDS.PROBLEM_FAST;
    bonuses.push({
      type: "fast",
      amount: XP_REWARDS.PROBLEM_FAST,
      description: "빠른 풀이",
    });
  }

  // 연속 정답 보너스 (3개 이상)
  if (result.streakCount >= 3) {
    const streakBonus =
      XP_REWARDS.PROBLEM_CORRECT_STREAK * Math.min(result.streakCount - 2, 5);
    totalXp += streakBonus;
    bonuses.push({
      type: "streak",
      amount: streakBonus,
      description: `${result.streakCount}연속 정답`,
    });
  }

  // 난이도 배율
  if (result.difficulty && DIFFICULTY_MULTIPLIER[result.difficulty]) {
    const multiplier = DIFFICULTY_MULTIPLIER[result.difficulty];
    if (multiplier > 1) {
      const bonusXp = Math.floor(totalXp * (multiplier - 1));
      totalXp += bonusXp;
      bonuses.push({
        type: "difficulty",
        amount: bonusXp,
        description: `난이도 보너스 (x${multiplier})`,
      });
    }
  }

  return { totalXp, bonuses };
}

// 세션 완료 XP 계산
export function calculateSessionXp(params: {
  totalProblems: number;
  correctProblems: number;
  timeSpentMinutes: number;
  inFlowState: boolean;
  dailyFirst: boolean;
  currentStreak: number;
}): { totalXp: number; bonuses: XpBonus[] } {
  const bonuses: XpBonus[] = [];
  let totalXp = 0;

  // 세션 완료 기본 XP
  totalXp += XP_REWARDS.SESSION_COMPLETE;
  bonuses.push({
    type: "session_complete",
    amount: XP_REWARDS.SESSION_COMPLETE,
    description: "세션 완료",
  });

  // 정확도 보너스
  const accuracy =
    params.totalProblems > 0
      ? (params.correctProblems / params.totalProblems) * 100
      : 0;
  const accuracyBonus = getAccuracyBonus(accuracy);
  if (accuracyBonus > 0) {
    totalXp += accuracyBonus;
    bonuses.push({
      type: "accuracy",
      amount: accuracyBonus,
      description: `정확도 ${Math.round(accuracy)}%`,
    });
  }

  // 퍼펙트 세션
  if (
    params.totalProblems > 0 &&
    params.correctProblems === params.totalProblems
  ) {
    totalXp += XP_REWARDS.SESSION_PERFECT;
    bonuses.push({
      type: "perfect",
      amount: XP_REWARDS.SESSION_PERFECT,
      description: "퍼펙트 세션!",
    });
  }

  // 몰입 상태 보너스
  if (params.inFlowState) {
    totalXp += XP_REWARDS.SESSION_FLOW;
    bonuses.push({
      type: "flow",
      amount: XP_REWARDS.SESSION_FLOW,
      description: "몰입 상태 유지",
    });
  }

  // 오늘 첫 학습
  if (params.dailyFirst) {
    totalXp += XP_REWARDS.DAILY_FIRST;
    bonuses.push({
      type: "daily_first",
      amount: XP_REWARDS.DAILY_FIRST,
      description: "오늘의 첫 학습",
    });
  }

  // 스트릭 보너스
  if (params.currentStreak > 1) {
    const streakBonus =
      XP_REWARDS.STREAK_BONUS_PER_DAY * Math.min(params.currentStreak, 30);
    totalXp += streakBonus;
    bonuses.push({
      type: "streak_days",
      amount: streakBonus,
      description: `${params.currentStreak}일 연속 학습`,
    });
  }

  return { totalXp, bonuses };
}

// XP 획득 및 레벨업 처리 (D1 API 호출)
export async function awardXp(
  userId: string,
  xpAmount: number,
  source: string,
): Promise<XpGainResult> {
  // 현재 유저 데이터 가져오기
  const userResult = await api.getUser();
  const userData = userResult.user || {};
  const previousXp = userData.total_xp || 0;
  const previousLevelData = calculateLevel(previousXp);

  // API로 XP 지급
  const result = await api.awardXp({ amount: xpAmount, source });

  const newTotalXp = result.newTotalXp || previousXp + xpAmount;
  const newLevelData = calculateLevel(newTotalXp);
  const leveledUp =
    result.leveledUp || newLevelData.level > previousLevelData.level;

  // 업적 확인 (API로 위임)
  let achievementsUnlocked: string[] = [];
  try {
    const achResult = await api.checkAchievements({
      type: "xp_gained",
      totalXp: newTotalXp,
      level: newLevelData.level,
    });
    achievementsUnlocked = achResult.newlyUnlocked || [];
  } catch {
    // 업적 확인 실패해도 XP 지급은 성공
  }

  return {
    xpGained: xpAmount,
    totalXp: newTotalXp,
    newLevel: newLevelData.level,
    previousLevel: previousLevelData.level,
    leveledUp,
    levelTitle: getLevelTitle(newLevelData.level),
    bonuses: [],
    achievementsUnlocked,
  };
}

// 문제 풀이 결과 처리 (XP 계산 + 부여)
export async function processProblemResult(
  userId: string,
  result: ProblemResult,
): Promise<XpGainResult | null> {
  const { totalXp, bonuses } = calculateProblemXp(result);

  if (totalXp === 0) {
    return null;
  }

  const xpResult = await awardXp(userId, totalXp, "problem_solved");
  xpResult.bonuses = bonuses;

  return xpResult;
}

// 세션 완료 처리
export async function processSessionComplete(
  userId: string,
  sessionData: {
    totalProblems: number;
    correctProblems: number;
    timeSpentMinutes: number;
    inFlowState: boolean;
    dailyFirst: boolean;
    currentStreak: number;
  },
): Promise<XpGainResult> {
  const { totalXp, bonuses } = calculateSessionXp(sessionData);

  const xpResult = await awardXp(userId, totalXp, "session_complete");
  xpResult.bonuses = bonuses;

  return xpResult;
}
