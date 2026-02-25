// ============================================================
// 셈마루(SemMaru) - D1 Achievements API
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  getD1,
  authenticateRequest,
  nowISO,
  generateId,
} from "@/lib/d1/helpers";

export const runtime = "edge";

// GET: 유저의 업적 목록 조회
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid } = auth;

    const db = getD1(request);

    const { results } = await db
      .prepare(
        `SELECT id, achievementId, unlockedAt
         FROM achievements
         WHERE userId = ?
         ORDER BY unlockedAt DESC`,
      )
      .bind(uid)
      .all<{
        id: string;
        achievementId: string;
        unlockedAt: string;
      }>();

    return NextResponse.json({
      success: true,
      achievements: results,
      total: results.length,
    });
  } catch (error) {
    console.error("GET /api/d1/achievements error:", error);
    return NextResponse.json(
      { error: "업적 목록 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}

// POST: 업적 해금 (중복 방지 - UNIQUE constraint)
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid } = auth;

    const body = await request.json();
    const { achievementId } = body;

    if (!achievementId) {
      return NextResponse.json(
        { error: "achievementId는 필수입니다." },
        { status: 400 },
      );
    }

    const db = getD1(request);
    const now = nowISO();

    // UNIQUE constraint(userId, achievementId)로 중복 방지
    try {
      await db
        .prepare(
          `INSERT INTO achievements (id, userId, achievementId, unlockedAt)
           VALUES (?, ?, ?, ?)`,
        )
        .bind(generateId(), uid, achievementId, now)
        .run();
    } catch (err: any) {
      if (
        err?.message?.includes("UNIQUE") ||
        err?.message?.includes("unique")
      ) {
        return NextResponse.json(
          { error: "이미 해금된 업적입니다.", alreadyUnlocked: true },
          { status: 409 },
        );
      }
      throw err;
    }

    return NextResponse.json({
      success: true,
      achievementId,
      unlockedAt: now,
    });
  } catch (error) {
    console.error("POST /api/d1/achievements error:", error);
    return NextResponse.json(
      { error: "업적 해금에 실패했습니다." },
      { status: 500 },
    );
  }
}
