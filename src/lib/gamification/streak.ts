// ============================================================
// MathFlow - Streak System
// ============================================================
// 연속 학습 스트릭 관리

import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { XP_REWARDS } from './constants';
import { checkAndUnlockAchievements } from './achievements';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;  // YYYY-MM-DD 형식
  streakStartDate: string | null;
  totalActiveDays: number;
  weeklyActivity: boolean[];  // 최근 7일 활동 여부
}

export interface StreakUpdateResult {
  streakData: StreakData;
  streakMaintained: boolean;
  streakBroken: boolean;
  streakIncreased: boolean;
  milestoneReached: number | null;  // 3, 7, 30일 등 마일스톤
  xpBonus: number;
  achievementsUnlocked: string[];
}

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환
function getToday(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// 어제 날짜를 YYYY-MM-DD 형식으로 반환
function getYesterday(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return now.toISOString().split('T')[0];
}

// 두 날짜 사이의 일수 계산
function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
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

// 사용자 스트릭 데이터 가져오기
export async function getStreakData(userId: string): Promise<StreakData> {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      streakStartDate: null,
      totalActiveDays: 0,
      weeklyActivity: [false, false, false, false, false, false, false],
    };
  }

  const userData = userDoc.data();
  const today = getToday();
  const yesterday = getYesterday();
  const lastActivity = userData.lastActivityDate || null;

  // 스트릭이 끊어졌는지 확인 (어제 활동하지 않았으면)
  let currentStreak = userData.streakDays || 0;
  if (lastActivity && lastActivity !== today && lastActivity !== yesterday) {
    currentStreak = 0;  // 스트릭 리셋
  }

  // 주간 활동 계산
  const weeklyActivity = calculateWeeklyActivity(userData.activityDates || [], today);

  return {
    currentStreak,
    longestStreak: userData.longestStreak || currentStreak,
    lastActivityDate: lastActivity,
    streakStartDate: userData.streakStartDate || null,
    totalActiveDays: userData.totalActiveDays || 0,
    weeklyActivity,
  };
}

// 최근 7일 활동 계산
function calculateWeeklyActivity(activityDates: string[], today: string): boolean[] {
  const result: boolean[] = [];
  const todayDate = new Date(today);

  for (let i = 6; i >= 0; i--) {
    const checkDate = new Date(todayDate);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    result.push(activityDates.includes(dateStr));
  }

  return result;
}

// 학습 활동 기록 및 스트릭 업데이트
export async function recordActivity(userId: string): Promise<StreakUpdateResult> {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  const today = getToday();
  const yesterday = getYesterday();

  let streakData: StreakData;
  let streakMaintained = false;
  let streakBroken = false;
  let streakIncreased = false;
  let xpBonus = 0;

  if (!userDoc.exists()) {
    // 새 사용자
    streakData = {
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: today,
      streakStartDate: today,
      totalActiveDays: 1,
      weeklyActivity: [false, false, false, false, false, false, true],
    };
    streakIncreased = true;
  } else {
    const userData = userDoc.data();
    const lastActivity = userData.lastActivityDate || null;
    const previousStreak = userData.streakDays || 0;
    const activityDates: string[] = userData.activityDates || [];

    // 이미 오늘 활동한 경우
    if (lastActivity === today) {
      streakMaintained = true;
      streakData = await getStreakData(userId);
      return {
        streakData,
        streakMaintained,
        streakBroken: false,
        streakIncreased: false,
        milestoneReached: null,
        xpBonus: 0,
        achievementsUnlocked: [],
      };
    }

    // 스트릭 계산
    let newStreak: number;
    let newStreakStart: string;

    if (lastActivity === yesterday) {
      // 스트릭 유지
      newStreak = previousStreak + 1;
      newStreakStart = userData.streakStartDate || today;
      streakIncreased = true;
    } else if (lastActivity === null) {
      // 첫 활동
      newStreak = 1;
      newStreakStart = today;
      streakIncreased = true;
    } else {
      // 스트릭 끊김
      newStreak = 1;
      newStreakStart = today;
      streakBroken = previousStreak > 0;
      streakIncreased = true;
    }

    const newLongestStreak = Math.max(userData.longestStreak || 0, newStreak);
    const newActivityDates = [...activityDates, today].slice(-365);  // 최근 1년만 유지

    streakData = {
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastActivityDate: today,
      streakStartDate: newStreakStart,
      totalActiveDays: (userData.totalActiveDays || 0) + 1,
      weeklyActivity: calculateWeeklyActivity(newActivityDates, today),
    };

    // Firebase 업데이트
    await updateDoc(userRef, {
      streakDays: newStreak,
      longestStreak: newLongestStreak,
      lastActivityDate: today,
      streakStartDate: newStreakStart,
      totalActiveDays: streakData.totalActiveDays,
      activityDates: newActivityDates,
      updatedAt: Timestamp.now(),
    });
  }

  // 마일스톤 확인
  const milestoneReached = checkMilestone(streakData.currentStreak);
  if (milestoneReached) {
    xpBonus = getMilestoneXp(milestoneReached);
  }

  // 업적 확인
  const achievementsUnlocked = await checkAndUnlockAchievements(userId, {
    type: 'streak_update',
    streakDays: streakData.currentStreak,
  });

  return {
    streakData,
    streakMaintained,
    streakBroken,
    streakIncreased,
    milestoneReached,
    xpBonus,
    achievementsUnlocked,
  };
}

// 스트릭 복구 (프리미엄 기능 또는 특별 아이템)
export async function restoreStreak(
  userId: string,
  previousStreak: number
): Promise<StreakUpdateResult> {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  const userData = userDoc.data();
  const today = getToday();
  const yesterday = getYesterday();

  // 스트릭 복구
  const restoredStreak = previousStreak + 1;
  const activityDates: string[] = userData.activityDates || [];

  // 어제 날짜를 활동 기록에 추가 (복구)
  if (!activityDates.includes(yesterday)) {
    activityDates.push(yesterday);
  }
  if (!activityDates.includes(today)) {
    activityDates.push(today);
  }

  const newActivityDates = activityDates.slice(-365);
  const newLongestStreak = Math.max(userData.longestStreak || 0, restoredStreak);

  await updateDoc(userRef, {
    streakDays: restoredStreak,
    longestStreak: newLongestStreak,
    lastActivityDate: today,
    activityDates: newActivityDates,
    updatedAt: Timestamp.now(),
  });

  const streakData: StreakData = {
    currentStreak: restoredStreak,
    longestStreak: newLongestStreak,
    lastActivityDate: today,
    streakStartDate: userData.streakStartDate || today,
    totalActiveDays: (userData.totalActiveDays || 0) + 1,
    weeklyActivity: calculateWeeklyActivity(newActivityDates, today),
  };

  return {
    streakData,
    streakMaintained: true,
    streakBroken: false,
    streakIncreased: true,
    milestoneReached: checkMilestone(restoredStreak),
    xpBonus: 0,
    achievementsUnlocked: [],
  };
}

// 오늘이 첫 학습인지 확인
export async function isFirstActivityToday(userId: string): Promise<boolean> {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    return true;
  }

  const userData = userDoc.data();
  const today = getToday();
  return userData.lastActivityDate !== today;
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
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalActiveDays: 0,
      thisWeekDays: 0,
      thisMonthDays: 0,
      averagePerWeek: 0,
    };
  }

  const userData = userDoc.data();
  const activityDates: string[] = userData.activityDates || [];
  const today = new Date();

  // 이번 주 활동일
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const thisWeekDays = activityDates.filter((d) => new Date(d) >= weekStart).length;

  // 이번 달 활동일
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthDays = activityDates.filter((d) => new Date(d) >= monthStart).length;

  // 주당 평균 (최근 4주)
  const fourWeeksAgo = new Date(today);
  fourWeeksAgo.setDate(today.getDate() - 28);
  const recentDays = activityDates.filter((d) => new Date(d) >= fourWeeksAgo).length;
  const averagePerWeek = Math.round((recentDays / 4) * 10) / 10;

  return {
    currentStreak: userData.streakDays || 0,
    longestStreak: userData.longestStreak || 0,
    totalActiveDays: userData.totalActiveDays || 0,
    thisWeekDays,
    thisMonthDays,
    averagePerWeek,
  };
}
