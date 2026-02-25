// ============================================================
// D1 API: /api/d1/users/diagnostic
// GET: 진단 결과 조회
// POST: 진단 결과 저장
// DELETE: 진단 초기화
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getD1, authenticateRequest, nowISO } from "@/lib/d1/helpers";

export const runtime = "edge";

// GET: 진단 결과 조회
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid } = auth;

    const db = getD1(request);
    const user = await db
      .prepare(
        `SELECT diagnostic_completed, diagnostic_result, estimated_level, theta
         FROM users WHERE id = ?`,
      )
      .bind(uid)
      .first<{
        diagnostic_completed: number;
        diagnostic_result: string | null;
        estimated_level: number | null;
        theta: number;
      }>();

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      diagnosticCompleted: Boolean(user.diagnostic_completed),
      diagnosticResult: user.diagnostic_result
        ? JSON.parse(user.diagnostic_result)
        : null,
      estimatedLevel: user.estimated_level,
      theta: user.theta,
    });
  } catch (error) {
    console.error("[GET /api/d1/users/diagnostic]", error);
    return NextResponse.json(
      { error: "진단 결과 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

// POST: 진단 결과 저장
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid } = auth;

    const body = await request.json();
    const { estimatedLevel, theta, grade, strengths, weaknesses, answers } =
      body;

    if (estimatedLevel == null || theta == null) {
      return NextResponse.json(
        { error: "estimatedLevel과 theta는 필수입니다." },
        { status: 400 },
      );
    }

    const diagnosticResult = JSON.stringify({
      estimatedLevel,
      theta,
      grade: grade || null,
      strengths: strengths || [],
      weaknesses: weaknesses || [],
      answers: answers || [],
      completedAt: nowISO(),
    });

    const db = getD1(request);
    const now = nowISO();

    await db
      .prepare(
        `UPDATE users
         SET diagnostic_completed = 1,
             diagnostic_result = ?,
             estimated_level = ?,
             theta = ?,
             updated_at = ?
         WHERE id = ?`,
      )
      .bind(diagnosticResult, estimatedLevel, theta, now, uid)
      .run();

    return NextResponse.json({
      diagnosticCompleted: true,
      diagnosticResult: JSON.parse(diagnosticResult),
      estimatedLevel,
      theta,
    });
  } catch (error) {
    console.error("[POST /api/d1/users/diagnostic]", error);
    return NextResponse.json(
      { error: "진단 결과 저장 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

// DELETE: 진단 초기화
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid } = auth;

    const db = getD1(request);
    const now = nowISO();

    await db
      .prepare(
        `UPDATE users
         SET diagnostic_completed = 0,
             diagnostic_result = NULL,
             estimated_level = NULL,
             theta = 0,
             updated_at = ?
         WHERE id = ?`,
      )
      .bind(now, uid)
      .run();

    return NextResponse.json({ message: "진단 결과가 초기화되었습니다." });
  } catch (error) {
    console.error("[DELETE /api/d1/users/diagnostic]", error);
    return NextResponse.json(
      { error: "진단 초기화 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
