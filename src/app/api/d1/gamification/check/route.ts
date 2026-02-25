// ============================================================
// 셈마루(SemMaru) - D1 Gamification Check API
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  getD1,
  authenticateRequest,
  nowISO,
  generateId,
} from "@/lib/d1/helpers";
import { ACHIEVEMENTS } from "@/lib/gamification/achievements";

export const runtime = "edge";

// POST: 업적 확인 + 해금
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid } = auth;

    const body = await request.json();
    const { context } = body;

    if (!context || !context.type) {
      return NextResponse.json(
        { error: "context.type은 필수입니다." },
        { status: 400 },
      );
    }

    const db = getD1(request);
    const now = nowISO();

    // 이미 해금된 업적 ID 목록 조회
    const { results: unlockedRows } = await db
      .prepare(`SELECT achievementId FROM achievements WHERE userId = ?`)
      .bind(uid)
      .all<{ achievementId: string }>();

    const unlockedIds = new Set(unlockedRows.map((r) => r.achievementId));

    // 유저 통계 조회 (context와 병합)
    const user = await db
      .prepare(
        `SELECT totalXp, currentLevel, streakDays, problemsSolved,
                perfectSessions, flowStates, fastSolves, maxStreak,
                averageAccuracy, achievements
         FROM users
         WHERE id = ?`,
      )
      .bind(uid)
      .first<{
        totalXp: number;
        currentLevel: number;
        streakDays: number;
        problemsSolved: number;
        perfectSessions: number;
        flowStates: number;
        fastSolves: number;
        maxStreak: number;
        averageAccuracy: number;
        achievements: string | null;
      }>();

    if (!user) {
      return NextResponse.json(
        { error: "유저를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // context 값과 DB 값 병합 (context 우선)
    const stats: Record<string, number> = {
      total_xp: context.totalXp ?? user.totalXp ?? 0,
      level: context.level ?? user.currentLevel ?? 1,
      streak_days: context.streakDays ?? user.streakDays ?? 0,
      problems_solved: context.problemsSolved ?? user.problemsSolved ?? 0,
      perfect_sessions: context.perfectSessions ?? user.perfectSessions ?? 0,
      flow_states: context.flowStates ?? user.flowStates ?? 0,
      fast_solves: context.fastSolves ?? user.fastSolves ?? 0,
      max_streak: context.maxStreak ?? user.maxStreak ?? 0,
      average_accuracy: context.averageAccuracy ?? user.averageAccuracy ?? 0,
    };

    // 조건 충족하는 새 업적 찾기
    const newlyUnlocked: Array<{
      id: string;
      name: string;
      xpReward: number;
    }> = [];

    for (const achievement of ACHIEVEMENTS) {
      // 이미 해금된 업적은 스킵
      if (unlockedIds.has(achievement.id)) {
        continue;
      }

      // 요구사항 확인
      const { type, value } = achievement.requirement;
      const currentValue = stats[type] ?? 0;

      if (currentValue >= value) {
        newlyUnlocked.push({
          id: achievement.id,
          name: achievement.name,
          xpReward: achievement.xpReward,
        });
      }
    }

    // 새로 해금된 업적이 있으면 DB에 기록
    if (newlyUnlocked.length > 0) {
      const statements = [];

      // 1. achievements 테이블에 INSERT
      for (const a of newlyUnlocked) {
        statements.push(
          db
            .prepare(
              `INSERT OR IGNORE INTO achievements (id, userId, achievementId, unlockedAt)
               VALUES (?, ?, ?, ?)`,
            )
            .bind(generateId(), uid, a.id, now),
        );
      }

      // 2. users.achievements 배열 업데이트
      const currentAchievements: string[] = user.achievements
        ? JSON.parse(user.achievements)
        : [];
      const updatedAchievements = [
        ...currentAchievements,
        ...newlyUnlocked.map((a) => a.id),
      ];

      statements.push(
        db
          .prepare(
            `UPDATE users
             SET achievements = ?, updatedAt = ?
             WHERE id = ?`,
          )
          .bind(JSON.stringify(updatedAchievements), now, uid),
      );

      await db.batch(statements);
    }

    return NextResponse.json({
      success: true,
      newlyUnlocked,
      totalUnlocked: unlockedIds.size + newlyUnlocked.length,
      totalAchievements: ACHIEVEMENTS.length,
    });
  } catch (error) {
    console.error("POST /api/d1/gamification/check error:", error);
    return NextResponse.json(
      { error: "업적 확인에 실패했습니다." },
      { status: 500 },
    );
  }
}
