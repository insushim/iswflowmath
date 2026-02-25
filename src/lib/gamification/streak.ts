// ============================================================
// 셈마루(SemMaru) - Streak System
// Firestore 직접 접근을 API 호출로 교체
// ============================================================

import { api } from "@/lib/api/client";
import { XP_REWARDS } from "./constants";

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null; // YYYY-MM-DD 형식
  streakStartDate: string | null;
  totalActiveDays: number;
  weeklyActivity: boolean[]; // 최근 7일 활동 여부
}

export interface StreakUpdateResult {
  streakData: StreakData;
  streakMaintained: boolean;
  streakBroken: boolean;
  streakIncreased: boolean;
  milestoneReached: number | null; // 3, 7, 30일 등 마일스톤
  xpBonus: number;
  achievementsUnlocked: string[];
}

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환
function getToday(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

// 어제 날짜를 YYYY-MM-DD 형식으로 반환
function getYesterday(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return now.toISOString().split("T")[0];
}

// 스트릭 마일스톤 확인
function checkMilestone(streak: number): number | null {
  const milestones = [3, 7, 14, 30, 50, 100, 200, 365];
  return milestones.find((m) => streak === m) || null;
}

// 마일스톤 XP 보너스
function getMilestoneXp(milestone: number): number {
  switch (milestone) {
    case 3:
      return XP_REWARDS.STREAK_MILESTONE_3;
    case 7:
      return XP_REWARDS.STREAK_MILESTONE_7;
    case 30:
      return XP_REWARDS.STREAK_MILESTONE_30;
    case 14:
      return 50;
    case 50:
      return 200;
    case 100:
      return 1000;
    case 200:
      return 2000;
    case 365:
      return 5000;
    default:
      return 0;
  }
}

// 최근 7일 활동 계산
function calculateWeeklyActivity(
  activityDates: string[],
  today: string,
): boolean[] {
  const result: boolean[] = [];
  const todayDate = new Date(today);

  for (let i = 6; i >= 0; i--) {
    const checkDate = new Date(todayDate);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split("T")[0];
    result.push(activityDates.includes(dateStr));
  }

  return result;
}

// 사용자 스트릭 데이터 가져오기 (API)
export async function getStreakData(userId: string): Promise<StreakData> {
  try {
    const result = await api.getStreak();
    const data = result.streakData || result;
    const today = getToday();
    const yesterday = getYesterday();
    const lastActivity = data.lastActivityDate || null;

    // 스트릭이 끊어졌는지 확인
    let currentStreak = data.streakDays || data.currentStreak || 0;
    if (lastActivity && lastActivity !== today && lastActivity !== yesterday) {
      currentStreak = 0;
    }

    const activityDates =
      typeof data.activityDates === "string"
        ? JSON.parse(data.activityDates)
        : data.activityDates || [];

    const weeklyActivity = calculateWeeklyActivity(activityDates, today);

    return {
      currentStreak,
      longestStreak: data.longestStreak || currentStreak,
      lastActivityDate: lastActivity,
      streakStartDate: data.streakStartDate || null,
      totalActiveDays: data.totalActiveDays || 0,
      weeklyActivity,
    };
  } catch {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      streakStartDate: null,
      totalActiveDays: 0,
      weeklyActivity: [false, false, false, false, false, false, false],
    };
  }
}

// 학습 활동 기록 및 스트릭 업데이트 (API)
export async function recordActivity(
  userId: string,
): Promise<StreakUpdateResult> {
  try {
    const result = await api.recordActivity();
    const streakResult = result.streakData || result;
    const currentStreak =
      streakResult.currentStreak || streakResult.streakDays || 1;

    const activityDates =
      typeof streakResult.activityDates === "string"
        ? JSON.parse(streakResult.activityDates)
        : streakResult.activityDates || [];

    const today = getToday();
    const weeklyActivity = calculateWeeklyActivity(activityDates, today);

    const streakData: StreakData = {
      currentStreak,
      longestStreak: streakResult.longestStreak || currentStreak,
      lastActivityDate: today,
      streakStartDate: streakResult.streakStartDate || today,
      totalActiveDays: streakResult.totalActiveDays || 1,
      weeklyActivity,
    };

    // 마일스톤 확인
    const milestoneReached = checkMilestone(currentStreak);
    let xpBonus = 0;
    if (milestoneReached) {
      xpBonus = getMilestoneXp(milestoneReached);
    }

    // 업적 확인 (API로 위임)
    let achievementsUnlocked: string[] = [];
    try {
      const achResult = await api.checkAchievements({
        type: "streak_update",
        streakDays: currentStreak,
      });
      achievementsUnlocked = achResult.newlyUnlocked || [];
    } catch {
      // 업적 확인 실패해도 스트릭은 성공
    }

    return {
      streakData,
      streakMaintained: result.alreadyRecorded || false,
      streakBroken: result.streakBroken || false,
      streakIncreased: !result.alreadyRecorded,
      milestoneReached,
      xpBonus,
      achievementsUnlocked,
    };
  } catch {
    // 에러 시 기본값 반환
    return {
      streakData: {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        streakStartDate: null,
        totalActiveDays: 0,
        weeklyActivity: [false, false, false, false, false, false, false],
      },
      streakMaintained: false,
      streakBroken: false,
      streakIncreased: false,
      milestoneReached: null,
      xpBonus: 0,
      achievementsUnlocked: [],
    };
  }
}

// 스트릭 복구 (프리미엄 기능 - API 호출로 교체 가능)
export async function restoreStreak(
  userId: string,
  previousStreak: number,
): Promise<StreakUpdateResult> {
  // 복구 기능은 추후 별도 API 구현 시 교체
  // 현재는 recordActivity로 대체
  return recordActivity(userId);
}

// 오늘이 첫 학습인지 확인
export async function isFirstActivityToday(userId: string): Promise<boolean> {
  try {
    const result = await api.getStreak();
    const data = result.streakData || result;
    const today = getToday();
    return data.lastActivityDate !== today;
  } catch {
    return true;
  }
}

// 스트릭 통계
export async function getStreakStats(userId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  thisWeekDays: number;
  thisMonthDays: number;
  averagePerWeek: number;
}> {
  try {
    const result = await api.getStreak();
    const data = result.streakData || result;

    const activityDates: string[] =
      typeof data.activityDates === "string"
        ? JSON.parse(data.activityDates)
        : data.activityDates || [];

    const today = new Date();

    // 이번 주 활동일
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const thisWeekDays = activityDates.filter(
      (d) => new Date(d) >= weekStart,
    ).length;

    // 이번 달 활동일
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthDays = activityDates.filter(
      (d) => new Date(d) >= monthStart,
    ).length;

    // 주당 평균 (최근 4주)
    const fourWeeksAgo = new Date(today);
    fourWeeksAgo.setDate(today.getDate() - 28);
    const recentDays = activityDates.filter(
      (d) => new Date(d) >= fourWeeksAgo,
    ).length;
    const averagePerWeek = Math.round((recentDays / 4) * 10) / 10;

    return {
      currentStreak: data.streakDays || data.currentStreak || 0,
      longestStreak: data.longestStreak || 0,
      totalActiveDays: data.totalActiveDays || 0,
      thisWeekDays,
      thisMonthDays,
      averagePerWeek,
    };
  } catch {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalActiveDays: 0,
      thisWeekDays: 0,
      thisMonthDays: 0,
      averagePerWeek: 0,
    };
  }
}
