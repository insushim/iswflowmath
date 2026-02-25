#!/usr/bin/env npx tsx
// ============================================================
// 셈마루(SemMaru) - Firestore → D1 데이터 마이그레이션
// 1회성 실행 스크립트
//
// 사용법:
// 1. Firebase Admin SDK 서비스 계정 키 파일 준비
// 2. 환경변수 설정:
//    export GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
//    export CLOUDFLARE_ACCOUNT_ID=your_account_id
//    export CLOUDFLARE_API_TOKEN=your_api_token
//    export D1_DATABASE_ID=your_d1_database_id
// 3. 실행: npx tsx scripts/migrate-firestore-to-d1.ts
// ============================================================

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// Firebase Admin 초기화
const app = initializeApp({
  credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS!),
});
const firestore = getFirestore(app);

// D1 REST API 호출 헬퍼
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;
const D1_DB_ID = process.env.D1_DATABASE_ID!;

async function d1Query(sql: string, params: unknown[] = []) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${D1_DB_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`D1 query failed: ${response.status} - ${text}`);
  }

  return response.json();
}

// Timestamp → ISO string 변환
function tsToISO(ts: Timestamp | any): string | null {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate().toISOString();
  if (ts._seconds) return new Date(ts._seconds * 1000).toISOString();
  if (typeof ts === "string") return ts;
  return null;
}

// ============================================================
// 마이그레이션 함수들
// ============================================================

async function migrateUsers() {
  console.log("📦 Migrating users...");
  const snapshot = await firestore.collection("users").get();
  let count = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const diagnosticResult = data.diagnosticResult
      ? JSON.stringify(data.diagnosticResult)
      : null;
    const achievements = JSON.stringify(data.achievements || []);
    const achievementHistory = JSON.stringify(data.achievementHistory || []);
    const activityDates = JSON.stringify(data.activityDates || []);

    await d1Query(
      `INSERT OR REPLACE INTO users (
        id, name, email, grade, subscription_tier, total_xp, current_level,
        theta, streak_days, longest_streak, last_activity_date, streak_start_date,
        total_active_days, activity_dates, last_practice_date,
        diagnostic_completed, diagnostic_result, estimated_level,
        problems_solved, perfect_sessions, flow_states, fast_solves,
        max_streak, average_accuracy, achievements, achievement_history,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doc.id,
        data.name || "",
        data.email || "",
        data.grade || 7,
        data.subscriptionTier || "free",
        data.totalXp || 0,
        data.currentLevel || 1,
        data.theta || 0,
        data.streakDays || 0,
        data.longestStreak || 0,
        data.lastActivityDate || null,
        data.streakStartDate || null,
        data.totalActiveDays || 0,
        activityDates,
        tsToISO(data.lastPracticeDate),
        data.diagnosticCompleted ? 1 : 0,
        diagnosticResult,
        data.estimatedLevel || null,
        data.problemsSolved || 0,
        data.perfectSessions || 0,
        data.flowStates || 0,
        data.fastSolves || 0,
        data.maxStreak || 0,
        data.averageAccuracy || 0,
        achievements,
        achievementHistory,
        tsToISO(data.createdAt) || new Date().toISOString(),
        tsToISO(data.updatedAt) || new Date().toISOString(),
      ],
    );
    count++;
  }

  console.log(`  ✅ ${count} users migrated`);
}

async function migrateSessions() {
  console.log("📦 Migrating sessions...");
  const snapshot = await firestore.collection("sessions").get();
  let count = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    await d1Query(
      `INSERT OR REPLACE INTO sessions (
        id, user_id, topic, started_at, ended_at,
        problems_attempted, problems_correct, initial_theta, final_theta,
        xp_earned, flow_percentage, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doc.id,
        data.userId || "",
        data.topic || "",
        tsToISO(data.startedAt) || new Date().toISOString(),
        tsToISO(data.endedAt),
        data.problemsAttempted || 0,
        data.problemsCorrect || 0,
        data.initialTheta || 0,
        data.finalTheta || null,
        data.xpEarned || 0,
        data.flowPercentage || null,
        tsToISO(data.startedAt) || new Date().toISOString(),
        tsToISO(data.updatedAt) || new Date().toISOString(),
      ],
    );
    count++;
  }

  console.log(`  ✅ ${count} sessions migrated`);
}

async function migrateAttempts() {
  console.log("📦 Migrating attempts...");
  const snapshot = await firestore.collection("attempts").get();
  let count = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    await d1Query(
      `INSERT OR REPLACE INTO attempts (
        id, session_id, user_id, problem_content, problem_irt,
        user_answer, correct_answer, is_correct, time_spent_ms,
        hints_used, theta_before, theta_after, flow_state, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doc.id,
        data.sessionId || "",
        data.userId || "",
        data.problemContent || "",
        JSON.stringify(data.problemIrt || {}),
        data.userAnswer || "",
        data.correctAnswer || "",
        data.isCorrect ? 1 : 0,
        data.timeSpentMs || 0,
        data.hintsUsed || 0,
        data.thetaBefore || 0,
        data.thetaAfter || 0,
        data.flowState || null,
        tsToISO(data.createdAt) || new Date().toISOString(),
      ],
    );
    count++;
  }

  console.log(`  ✅ ${count} attempts migrated`);
}

async function migrateAchievements() {
  console.log("📦 Migrating achievements...");
  const snapshot = await firestore.collection("achievements").get();
  let count = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    await d1Query(
      `INSERT OR IGNORE INTO achievements (id, user_id, achievement_id, unlocked_at)
       VALUES (?, ?, ?, ?)`,
      [
        doc.id,
        data.userId || "",
        data.achievementId || "",
        tsToISO(data.unlockedAt) || new Date().toISOString(),
      ],
    );
    count++;
  }

  console.log(`  ✅ ${count} achievements migrated`);
}

async function migrateDailyStats() {
  console.log("📦 Migrating daily stats...");
  const snapshot = await firestore.collection("dailyStats").get();
  let count = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const statsId = data.id || doc.id;

    await d1Query(
      `INSERT OR REPLACE INTO daily_stats (
        id, user_id, date, problems_solved, problems_correct,
        xp_earned, time_spent_minutes, topics_practiced,
        flow_percentage, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        statsId,
        data.userId || "",
        data.date || "",
        data.problemsSolved || 0,
        data.problemsCorrect || 0,
        data.xpEarned || 0,
        data.timeSpentMinutes || 0,
        JSON.stringify(data.topicsPracticed || []),
        data.flowPercentage || 0,
        tsToISO(data.createdAt) || new Date().toISOString(),
        tsToISO(data.updatedAt) || new Date().toISOString(),
      ],
    );
    count++;
  }

  console.log(`  ✅ ${count} daily stats migrated`);
}

async function migrateImmersionProblems() {
  console.log("📦 Migrating immersion problems...");
  const snapshot = await firestore.collection("immersionProblems").get();
  let count = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    await d1Query(
      `INSERT OR REPLACE INTO immersion_problems (
        id, user_id, difficulty, topic, content, hints, solution,
        status, assigned_at, started_at, completed_at,
        user_answer, is_correct, time_spent_minutes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doc.id,
        data.userId || "",
        data.difficulty || "",
        data.topic || "",
        data.content || "",
        JSON.stringify(data.hints || []),
        data.solution || "",
        data.status || "assigned",
        tsToISO(data.assignedAt) || new Date().toISOString(),
        tsToISO(data.startedAt),
        tsToISO(data.completedAt),
        data.userAnswer || null,
        data.isCorrect !== undefined ? (data.isCorrect ? 1 : 0) : null,
        data.timeSpentMinutes || null,
        tsToISO(data.assignedAt) || new Date().toISOString(),
        tsToISO(data.updatedAt) || new Date().toISOString(),
      ],
    );
    count++;
  }

  console.log(`  ✅ ${count} immersion problems migrated`);
}

// ============================================================
// 메인 실행
// ============================================================

async function main() {
  console.log("🚀 셈마루 Firestore → D1 마이그레이션 시작\n");

  const start = Date.now();

  try {
    await migrateUsers();
    await migrateSessions();
    await migrateAttempts();
    await migrateAchievements();
    await migrateDailyStats();
    await migrateImmersionProblems();

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\n✅ 마이그레이션 완료! (${elapsed}초)`);
  } catch (error) {
    console.error("\n❌ 마이그레이션 실패:", error);
    process.exit(1);
  }
}

main();
