// ============================================================
// 셈마루(SemMaru) - D1 Streak API
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getD1, authenticateRequest, nowISO } from "@/lib/d1/helpers";

export const runtime = "edge";

// KST 기준 오늘 날짜 (YYYY-MM-DD)
function getTodayKST(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split("T")[0];
}

// KST 기준 어제 날짜
function getYesterdayKST(): string {
  const now = new Date();
  const kst = new Date(
    now.getTime() + 9 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000,
  );
  return kst.toISOString().split("T")[0];
}

// GET: 스트릭 데이터 조회
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid } = auth;

    const db = getD1(request);

    const user = await db
      .prepare(
        `SELECT streakDays, longestStreak, lastActivityDate, activityDates
         FROM users
         WHERE id = ?`,
      )
      .bind(uid)
      .first<{
        streakDays: number;
        longestStreak: number;
        lastActivityDate: string | null;
        activityDates: string | null;
      }>();

    if (!user) {
      return NextResponse.json(
        { error: "유저를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const activityDates: string[] = user.activityDates
      ? JSON.parse(user.activityDates)
      : [];

    return NextResponse.json({
      success: true,
      streakDays: user.streakDays || 0,
      longestStreak: user.longestStreak || 0,
      lastActivityDate: user.lastActivityDate,
      activityDates,
    });
  } catch (error) {
    console.error("GET /api/d1/streak error:", error);
    return NextResponse.json(
      { error: "스트릭 데이터 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}

// POST: 활동 기록 및 스트릭 업데이트
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid } = auth;

    const db = getD1(request);
    const today = getTodayKST();
    const yesterday = getYesterdayKST();
    const now = nowISO();

    // 현재 유저 데이터 조회
    const user = await db
      .prepare(
        `SELECT streakDays, longestStreak, lastActivityDate, activityDates
         FROM users
         WHERE id = ?`,
      )
      .bind(uid)
      .first<{
        streakDays: number;
        longestStreak: number;
        lastActivityDate: string | null;
        activityDates: string | null;
      }>();

    if (!user) {
      return NextResponse.json(
        { error: "유저를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const lastDate = user.lastActivityDate;

    // 오늘 이미 기록되었으면 skip
    if (lastDate === today) {
      return NextResponse.json({
        success: true,
        action: "skipped",
        reason: "오늘 이미 활동이 기록되어 있습니다.",
        streakDays: user.streakDays || 0,
        longestStreak: user.longestStreak || 0,
      });
    }

    // 스트릭 계산
    let newStreak: number;
    if (lastDate === yesterday) {
      // 어제 활동했으면 스트릭 +1
      newStreak = (user.streakDays || 0) + 1;
    } else {
      // 그 외 (첫 활동이거나 하루 이상 쉰 경우) 스트릭 = 1
      newStreak = 1;
    }

    const longestStreak = Math.max(user.longestStreak || 0, newStreak);

    // activityDates 업데이트 (최근 365일만 유지)
    let activityDates: string[] = user.activityDates
      ? JSON.parse(user.activityDates)
      : [];

    if (!activityDates.includes(today)) {
      activityDates.push(today);
    }

    // 365일 초과하는 오래된 날짜 제거
    if (activityDates.length > 365) {
      activityDates = activityDates.sort().slice(activityDates.length - 365);
    }

    await db
      .prepare(
        `UPDATE users
         SET streakDays = ?,
             longestStreak = ?,
             lastActivityDate = ?,
             activityDates = ?,
             updatedAt = ?
         WHERE id = ?`,
      )
      .bind(
        newStreak,
        longestStreak,
        today,
        JSON.stringify(activityDates),
        now,
        uid,
      )
      .run();

    return NextResponse.json({
      success: true,
      action: "updated",
      streakDays: newStreak,
      longestStreak,
      lastActivityDate: today,
    });
  } catch (error) {
    console.error("POST /api/d1/streak error:", error);
    return NextResponse.json(
      { error: "스트릭 업데이트에 실패했습니다." },
      { status: 500 },
    );
  }
}
