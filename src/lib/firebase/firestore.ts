// ============================================================
// MathFlow - Firestore Database Operations
// ============================================================

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { MathTopic, FlowChannel } from '@/types';

// ============================================================
// Practice Sessions
// ============================================================

export interface FirestoreSession {
  userId: string;
  topic: MathTopic;
  startedAt: Timestamp;
  endedAt?: Timestamp;
  problemsAttempted: number;
  problemsCorrect: number;
  initialTheta: number;
  finalTheta?: number;
  xpEarned: number;
}

export async function createSession(
  userId: string,
  topic: MathTopic,
  initialTheta: number
): Promise<string> {
  const docRef = await addDoc(collection(db, 'sessions'), {
    userId,
    topic,
    startedAt: serverTimestamp(),
    problemsAttempted: 0,
    problemsCorrect: 0,
    initialTheta,
    xpEarned: 0,
  });
  return docRef.id;
}

export async function updateSession(
  sessionId: string,
  data: Partial<FirestoreSession>
) {
  await updateDoc(doc(db, 'sessions', sessionId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function endSession(
  sessionId: string,
  finalTheta: number,
  problemsAttempted: number,
  problemsCorrect: number,
  xpEarned: number
) {
  await updateDoc(doc(db, 'sessions', sessionId), {
    endedAt: serverTimestamp(),
    finalTheta,
    problemsAttempted,
    problemsCorrect,
    xpEarned,
  });
}

export async function getUserSessions(userId: string, limitCount = 10) {
  try {
    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', userId),
      orderBy('startedAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.warn('Firestore index error, using fallback:', error);
    try {
      const q = query(collection(db, 'sessions'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as any))
        .sort((a, b) => (b.startedAt?.toMillis?.() || 0) - (a.startedAt?.toMillis?.() || 0))
        .slice(0, limitCount);
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return []; // 빈 배열 반환
    }
  }
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
  flowState: FlowChannel;
  createdAt: Timestamp;
}

export async function saveAttempt(attempt: Omit<FirestoreAttempt, 'createdAt'>) {
  const docRef = await addDoc(collection(db, 'attempts'), {
    ...attempt,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getSessionAttempts(sessionId: string) {
  const q = query(
    collection(db, 'attempts'),
    where('sessionId', '==', sessionId),
    orderBy('createdAt', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// ============================================================
// User Stats
// ============================================================

export async function updateUserStats(
  userId: string,
  xpEarned: number,
  problemsCorrect: number,
  problemsAttempted: number
) {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    const data = userDoc.data();
    const newTotalXp = (data.totalXp || 0) + xpEarned;
    const newLevel = Math.floor(newTotalXp / 100) + 1;

    await updateDoc(userRef, {
      totalXp: newTotalXp,
      currentLevel: newLevel,
      updatedAt: serverTimestamp(),
    });
  }
}

export async function updateUserTheta(userId: string, newTheta: number) {
  await updateDoc(doc(db, 'users', userId), {
    theta: newTheta,
    updatedAt: serverTimestamp(),
  });
}

export async function updateStreak(userId: string) {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    const data = userDoc.data();
    const lastPractice = data.lastPracticeDate?.toDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let newStreak = data.streakDays || 0;

    if (lastPractice) {
      const lastDate = new Date(lastPractice);
      lastDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
      // diffDays === 0 means same day, don't change streak
    } else {
      newStreak = 1;
    }

    await updateDoc(userRef, {
      streakDays: newStreak,
      lastPracticeDate: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return newStreak;
  }
  return 0;
}

// ============================================================
// Achievements
// ============================================================

export async function unlockAchievement(userId: string, achievementId: string) {
  // Check if already unlocked
  const q = query(
    collection(db, 'achievements'),
    where('userId', '==', userId),
    where('achievementId', '==', achievementId)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    await addDoc(collection(db, 'achievements'), {
      userId,
      achievementId,
      unlockedAt: serverTimestamp(),
    });
    return true;
  }
  return false;
}

export async function getUserAchievements(userId: string) {
  try {
    const q = query(
      collection(db, 'achievements'),
      where('userId', '==', userId),
      orderBy('unlockedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.warn('Firestore index error, using fallback:', error);
    try {
      const q = query(collection(db, 'achievements'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as any))
        .sort((a, b) => (b.unlockedAt?.toMillis?.() || 0) - (a.unlockedAt?.toMillis?.() || 0));
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return [];
    }
  }
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
  topic: MathTopic
) {
  const today = new Date().toISOString().split('T')[0];
  const statsId = `${userId}_${today}`;
  const statsRef = doc(db, 'dailyStats', statsId);
  const statsDoc = await getDoc(statsRef);

  if (statsDoc.exists()) {
    const data = statsDoc.data();
    const topics = data.topicsPracticed || [];
    if (!topics.includes(topic)) {
      topics.push(topic);
    }

    await updateDoc(statsRef, {
      problemsSolved: (data.problemsSolved || 0) + problemsSolved,
      problemsCorrect: (data.problemsCorrect || 0) + problemsCorrect,
      xpEarned: (data.xpEarned || 0) + xpEarned,
      timeSpentMinutes: (data.timeSpentMinutes || 0) + timeSpentMinutes,
      topicsPracticed: topics,
      updatedAt: serverTimestamp(),
    });
  } else {
    await addDoc(collection(db, 'dailyStats'), {
      id: statsId,
      userId,
      date: today,
      problemsSolved,
      problemsCorrect,
      xpEarned,
      timeSpentMinutes,
      topicsPracticed: [topic],
      createdAt: serverTimestamp(),
    });
  }
}

export async function getUserDailyStats(userId: string, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  try {
    // 복합 인덱스가 필요한 쿼리 - 인덱스 없으면 폴백
    const q = query(
      collection(db, 'dailyStats'),
      where('userId', '==', userId),
      where('date', '>=', startDateStr),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.warn('Firestore index error, using fallback:', error);
    try {
      // 폴백: userId만으로 필터링 후 클라이언트에서 처리
      const q = query(collection(db, 'dailyStats'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as any))
        .filter((d) => d.date && d.date >= startDateStr)
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return []; // 빈 배열 반환으로 무한 로딩 방지
    }
  }
}

// ============================================================
// Diagnostic Results (진단 결과 저장)
// ============================================================

export interface DiagnosticResult {
  userId: string;
  estimatedLevel: number; // 추정 학년 (1-12)
  theta: number; // IRT 능력 파라미터
  grade: number; // 선택한 학년
  strengths: string[];
  weaknesses: string[];
  answers: { problemId: string; correct: boolean; topic: string }[];
  completedAt: Timestamp;
}

export async function saveDiagnosticResult(
  userId: string,
  result: Omit<DiagnosticResult, 'userId' | 'completedAt'>
) {
  // 기존 진단 결과가 있으면 업데이트, 없으면 생성
  const userRef = doc(db, 'users', userId);

  await updateDoc(userRef, {
    diagnosticCompleted: true,
    diagnosticResult: {
      ...result,
      completedAt: serverTimestamp(),
    },
    estimatedLevel: result.estimatedLevel,
    theta: result.theta,
    grade: result.grade,
    updatedAt: serverTimestamp(),
  });
}

export async function getDiagnosticResult(userId: string) {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    const data = userDoc.data();
    if (data.diagnosticCompleted && data.diagnosticResult) {
      return {
        completed: true,
        result: data.diagnosticResult,
        estimatedLevel: data.estimatedLevel,
        theta: data.theta,
        grade: data.grade,
      };
    }
  }
  return { completed: false, result: null };
}

export async function resetDiagnostic(userId: string) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    diagnosticCompleted: false,
    diagnosticResult: null,
    updatedAt: serverTimestamp(),
  });
}

// ============================================================
// Immersion Problems (몰입 문제 저장)
// ============================================================

export interface ImmersionProblem {
  id?: string;
  userId: string;
  difficulty: '5min' | '10min' | '30min' | '1hour' | '1day' | '3days' | '7days' | '1month';
  topic: string;
  content: string;
  hints: string[];
  solution: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'skipped';
  assignedAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  userAnswer?: string;
  isCorrect?: boolean;
  timeSpentMinutes?: number;
}

export async function assignImmersionProblem(
  userId: string,
  difficulty: ImmersionProblem['difficulty'],
  problem: { topic: string; content: string; hints: string[]; solution: string }
) {
  const docRef = await addDoc(collection(db, 'immersionProblems'), {
    userId,
    difficulty,
    ...problem,
    status: 'assigned',
    assignedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getActiveImmersionProblem(userId: string, difficulty: string) {
  const q = query(
    collection(db, 'immersionProblems'),
    where('userId', '==', userId),
    where('difficulty', '==', difficulty),
    where('status', 'in', ['assigned', 'in_progress']),
    orderBy('assignedAt', 'desc'),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as ImmersionProblem;
  }
  return null;
}

export async function updateImmersionProblem(
  problemId: string,
  data: Partial<ImmersionProblem>
) {
  await updateDoc(doc(db, 'immersionProblems', problemId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function completeImmersionProblem(
  problemId: string,
  userAnswer: string,
  isCorrect: boolean,
  timeSpentMinutes: number
) {
  await updateDoc(doc(db, 'immersionProblems', problemId), {
    status: 'completed',
    completedAt: serverTimestamp(),
    userAnswer,
    isCorrect,
    timeSpentMinutes,
  });
}
