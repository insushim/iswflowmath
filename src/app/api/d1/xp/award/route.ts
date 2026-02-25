// ============================================================
// 셈마루(SemMaru) - D1 XP Award API
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  getD1,
  authenticateRequest,
  nowISO,
  generateId,
} from "@/lib/d1/helpers";
import { calculateLevel } from "@/lib/gamification/constants";

export const runtime = "edge";

// POST: XP 지급 (batch 트랜잭션)
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid } = auth;

    const body = await request.json();
    const { amount, source } = body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "유효한 amount (양수)가 필요합니다." },
        { status: 400 },
      );
    }

    if (!source) {
      return NextResponse.json(
        { error: "source는 필수입니다." },
        { status: 400 },
      );
    }

    const db = getD1(request);
    const now = nowISO();

    // 현재 유저의 totalXp 조회
    const user = await db
      .prepare(`SELECT totalXp FROM users WHERE id = ?`)
      .bind(uid)
      .first<{ totalXp: number }>();

    if (!user) {
      return NextResponse.json(
        { error: "유저를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const previousXp = user.totalXp || 0;
    const newTotalXp = previousXp + amount;

    // 레벨 계산
    const previousLevel = calculateLevel(previousXp);
    const newLevel = calculateLevel(newTotalXp);
    const leveledUp = newLevel.level > previousLevel.level;

    // batch 트랜잭션: users 업데이트 + xp_history 기록
    const statements = [
      // 1. users 테이블 totalXp 및 레벨 업데이트
      db
        .prepare(
          `UPDATE users
           SET totalXp = ?, currentLevel = ?, updatedAt = ?
           WHERE id = ?`,
        )
        .bind(newTotalXp, newLevel.level, now, uid),

      // 2. xp_history에 기록
      db
        .prepare(
          `INSERT INTO xp_history
           (id, userId, amount, source, totalXpAfter, createdAt)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(generateId(), uid, amount, source, newTotalXp, now),
    ];

    await db.batch(statements);

    return NextResponse.json({
      success: true,
      xpAwarded: amount,
      previousXp,
      totalXp: newTotalXp,
      level: newLevel,
      leveledUp,
      previousLevel: previousLevel.level,
    });
  } catch (error) {
    console.error("POST /api/d1/xp/award error:", error);
    return NextResponse.json(
      { error: "XP 지급에 실패했습니다." },
      { status: 500 },
    );
  }
}
