// ============================================================
// 셈마루(SemMaru) - Firestore → D1 API 래퍼
// Firestore 직접 접근을 API 호출로 교체
// ============================================================

import { api } from "@/lib/api/client";
import { MathTopic } from "@/types";

// ============================================================
// Practice Sessions
// ============================================================

export interface FirestoreSession {
  userId: string;
  topic: MathTopic;
  startedAt: any;
  endedAt?: any;
  problemsAttempted: number;
  problemsCorrect: number;
  initialTheta: number;
  finalTheta?: number;
  xpEarned: number;
}

export async function createSession(
  userId: string,
  topic: MathTopic,
  initialTheta: number,
): Promise<string> {
  const result = await api.createSession({ topic, initialTheta });
  return result.id;
}

export async function updateSession(
  sessionId: string,
  data: Partial<FirestoreSession>,
) {
  await api.updateSession(sessionId, data);
}

export async function endSession(
  sessionId: string,
  finalTheta: number,
  problemsAttempted: number,
  problemsCorrect: number,
  xpEarned: number,
) {
  await api.updateSession(sessionId, {
    ended: true,
    finalTheta,
    problems_attempted: problemsAttempted,
    problems_correct: problemsCorrect,
    xp_earned: xpEarned,
  });
}

export async function getUserSessions(userId: string, limitCount = 10) {
  const result = await api.getSessions(limitCount);
  return (result.sessions || []).map((s: any) => ({
    id: s.id,
    userId: s.user_id,
    topic: s.topic,
    startedAt: s.started_at
      ? {
          toDate: () => new Date(s.started_at),
          toMillis: () => new Date(s.started_at).getTime(),
          seconds: Math.floor(new Date(s.started_at).getTime() / 1000),
        }
      : null,
    endedAt: s.ended_at
      ? {
          toDate: () => new Date(s.ended_at),
          toMillis: () => new Date(s.ended_at).getTime(),
          seconds: Math.floor(new Date(s.ended_at).getTime() / 1000),
        }
      : null,
    problemsAttempted: s.problems_attempted,
    problemsCorrect: s.problems_correct,
    initialTheta: s.initial_theta,
    finalTheta: s.final_theta,
    xpEarned: s.xp_earned,
    flowPercentage: s.flow_percentage,
  }));
}

// ============================================================
// Problem Attempts
// ============================================================

export interface FirestoreAttempt {
  sessionId: string;
  userId: string;
  problemContent: string;
  problemIrt: { a: number; b: number; c: number };
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpentMs: number;
  hintsUsed: number;
  thetaBefore: number;
  thetaAfter: number;
  flowState: string;
  createdAt: any;
}

export async function saveAttempt(
  attempt: Omit<FirestoreAttempt, "createdAt">,
) {
  const result = await api.saveAttempt({
    sessionId: attempt.sessionId,
    problemContent: attempt.problemContent,
    problemIrt: attempt.problemIrt,
    userAnswer: attempt.userAnswer,
    correctAnswer: attempt.correctAnswer,
    isCorrect: attempt.isCorrect,
    timeSpentMs: attempt.timeSpentMs,
    hintsUsed: attempt.hintsUsed,
    thetaBefore: attempt.thetaBefore,
    thetaAfter: attempt.thetaAfter,
    flowState: attempt.flowState,
  });
  return result.id;
}

export async function getSessionAttempts(sessionId: string) {
  const result = await api.getAttempts(sessionId);
  return result.attempts || [];
}

// ============================================================
// User Stats
// ============================================================

export async function updateUserStats(
  userId: string,
  xpEarned: number,
  problemsCorrect: number,
  problemsAttempted: number,
) {
  await api.awardXp({ amount: xpEarned, source: "user_stats" });
}

export async function updateUserTheta(userId: string, newTheta: number) {
  await api.updateUser({ theta: newTheta });
}

export async function updateStreak(userId: string) {
  const result = await api.recordActivity();
  return result.streakData?.currentStreak || 0;
}

// ============================================================
// Achievements
// ============================================================

export async function unlockAchievement(userId: string, achievementId: string) {
  try {
    await api.unlockAchievement(achievementId);
    return true;
  } catch {
    return false;
  }
}

export async function getUserAchievements(userId: string) {
  const result = await api.getAchievements();
  return (result.achievements || []).map((a: any) => ({
    id: a.id,
    userId: a.user_id,
    achievementId: a.achievement_id,
    unlockedAt: a.unlocked_at
      ? {
          toDate: () => new Date(a.unlocked_at),
          toMillis: () => new Date(a.unlocked_at).getTime(),
          seconds: Math.floor(new Date(a.unlocked_at).getTime() / 1000),
        }
      : null,
  }));
}

// ============================================================
// Daily Stats
// ============================================================

export async function updateDailyStats(
  userId: string,
  problemsSolved: number,
  problemsCorrect: number,
  xpEarned: number,
  timeSpentMinutes: number,
  topic: MathTopic,
) {
  await api.updateDailyStats({
    problemsSolved,
    problemsCorrect,
    xpEarned,
    timeSpentMinutes,
    topic,
  });
}

export async function getUserDailyStats(userId: string, days = 7) {
  const result = await api.getDailyStats(days);
  return (result.stats || []).map((d: any) => ({
    id: d.id,
    userId: d.user_id,
    date: d.date,
    problemsSolved: d.problems_solved,
    problemsCorrect: d.problems_correct,
    xpEarned: d.xp_earned,
    timeSpentMinutes: d.time_spent_minutes,
    topicsPracticed:
      typeof d.topics_practiced === "string"
        ? JSON.parse(d.topics_practiced)
        : d.topics_practiced || [],
    flowPercentage: d.flow_percentage,
  }));
}

// ============================================================
// Diagnostic Results
// ============================================================

export interface DiagnosticResult {
  userId: string;
  estimatedLevel: number;
  theta: number;
  grade: number;
  strengths: string[];
  weaknesses: string[];
  answers: { problemId: string; correct: boolean; topic: string }[];
  completedAt: any;
}

export async function saveDiagnosticResult(
  userId: string,
  result: Omit<DiagnosticResult, "userId" | "completedAt">,
) {
  await api.saveDiagnostic(result);
}

export async function getDiagnosticResult(userId: string) {
  try {
    const result = await api.getDiagnostic();
    if (result.completed) {
      return {
        completed: true,
        result: result.result,
        estimatedLevel: result.estimatedLevel,
        theta: result.theta,
        grade: result.grade,
      };
    }
    return { completed: false, result: null };
  } catch {
    return { completed: false, result: null };
  }
}

export async function resetDiagnostic(userId: string) {
  await api.resetDiagnostic();
}

// ============================================================
// Immersion Problems
// ============================================================

export interface ImmersionProblem {
  id?: string;
  userId: string;
  difficulty: string;
  topic: string;
  content: string;
  hints: string[];
  solution: string;
  status: "assigned" | "in_progress" | "completed" | "skipped";
  assignedAt: any;
  startedAt?: any;
  completedAt?: any;
  userAnswer?: string;
  isCorrect?: boolean;
  timeSpentMinutes?: number;
}

export async function assignImmersionProblem(
  userId: string,
  difficulty: ImmersionProblem["difficulty"],
  problem: {
    topic: string;
    content: string;
    hints: string[];
    solution: string;
  },
) {
  const result = await api.assignImmersionProblem({
    difficulty,
    ...problem,
  });
  return result.id;
}

export async function getActiveImmersionProblem(
  userId: string,
  difficulty: string,
) {
  try {
    const result = await api.getActiveImmersionProblem(difficulty);
    if (result.problem) {
      return result.problem as ImmersionProblem;
    }
    return null;
  } catch {
    return null;
  }
}

export async function updateImmersionProblem(
  problemId: string,
  data: Partial<ImmersionProblem>,
) {
  await api.updateImmersionProblem(problemId, data);
}

export async function completeImmersionProblem(
  problemId: string,
  userAnswer: string,
  isCorrect: boolean,
  timeSpentMinutes: number,
) {
  await api.updateImmersionProblem(problemId, {
    status: "completed",
    userAnswer,
    isCorrect,
    timeSpentMinutes,
  });
}
