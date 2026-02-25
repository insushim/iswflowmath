// ============================================================
// 셈마루(SemMaru) - D1 Daily Stats API
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  getD1,
  authenticateRequest,
  nowISO,
  generateId,
} from "@/lib/d1/helpers";

export const runtime = "edge";

// 오늘 날짜 (YYYY-MM-DD) - KST 기준
function getTodayKST(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split("T")[0];
}

// GET: 일별 통계 조회 (query: days=7)
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid } = auth;

    const { searchParams } = new URL(request.url);
    const days = Math.min(Number(searchParams.get("days") || "7"), 365);

    const db = getD1(request);

    // 최근 N일간의 통계 조회
    const { results } = await db
      .prepare(
        `SELECT id, date, problemsSolved, problemsCorrect, xpEarned,
                timeSpentMinutes, topicsStudied, createdAt, updatedAt
         FROM daily_stats
         WHERE userId = ?
         ORDER BY date DESC
         LIMIT ?`,
      )
      .bind(uid, days)
      .all<{
        id: string;
        date: string;
        problemsSolved: number;
        problemsCorrect: number;
        xpEarned: number;
        timeSpentMinutes: number;
        topicsStudied: string | null;
        createdAt: string;
        updatedAt: string;
      }>();

    // topicsStudied JSON 파싱
    const stats = results.map((row) => ({
      ...row,
      topicsStudied: row.topicsStudied ? JSON.parse(row.topicsStudied) : [],
    }));

    return NextResponse.json({
      success: true,
      stats,
      days,
    });
  } catch (error) {
    console.error("GET /api/d1/daily-stats error:", error);
    return NextResponse.json(
      { error: "일별 통계 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}

// POST: 일별 통계 업데이트 (UPSERT - 오늘 데이터 있으면 누적, 없으면 생성)
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid } = auth;

    const body = await request.json();
    const {
      problemsSolved = 0,
      problemsCorrect = 0,
      xpEarned = 0,
      timeSpentMinutes = 0,
      topic,
    } = body;

    const db = getD1(request);
    const today = getTodayKST();
    const now = nowISO();

    // 오늘 날짜의 기존 데이터 확인
    const existing = await db
      .prepare(
        `SELECT id, topicsStudied FROM daily_stats
         WHERE userId = ? AND date = ?`,
      )
      .bind(uid, today)
      .first<{ id: string; topicsStudied: string | null }>();

    if (existing) {
      // UPDATE: 기존 데이터에 누적
      const existingTopics: string[] = existing.topicsStudied
        ? JSON.parse(existing.topicsStudied)
        : [];

      // topic이 있고, 아직 목록에 없으면 추가
      if (topic && !existingTopics.includes(topic)) {
        existingTopics.push(topic);
      }

      await db
        .prepare(
          `UPDATE daily_stats
           SET problemsSolved = problemsSolved + ?,
               problemsCorrect = problemsCorrect + ?,
               xpEarned = xpEarned + ?,
               timeSpentMinutes = timeSpentMinutes + ?,
               topicsStudied = ?,
               updatedAt = ?
           WHERE id = ?`,
        )
        .bind(
          problemsSolved,
          problemsCorrect,
          xpEarned,
          timeSpentMinutes,
          JSON.stringify(existingTopics),
          now,
          existing.id,
        )
        .run();

      return NextResponse.json({
        success: true,
        action: "updated",
        date: today,
      });
    } else {
      // INSERT: 새 데이터 생성
      const topics = topic ? [topic] : [];

      await db
        .prepare(
          `INSERT INTO daily_stats
           (id, userId, date, problemsSolved, problemsCorrect, xpEarned,
            timeSpentMinutes, topicsStudied, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          generateId(),
          uid,
          today,
          problemsSolved,
          problemsCorrect,
          xpEarned,
          timeSpentMinutes,
          JSON.stringify(topics),
          now,
          now,
        )
        .run();

      return NextResponse.json({
        success: true,
        action: "created",
        date: today,
      });
    }
  } catch (error) {
    console.error("POST /api/d1/daily-stats error:", error);
    return NextResponse.json(
      { error: "일별 통계 업데이트에 실패했습니다." },
      { status: 500 },
    );
  }
}
