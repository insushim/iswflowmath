// ============================================================
// D1 API: /api/d1/attempts
// GET: 문제 풀이 기록 조회 (query: sessionId)
// POST: 풀이 기록 저장
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  getD1,
  authenticateRequest,
  nowISO,
  generateId,
} from "@/lib/d1/helpers";

export const runtime = "edge";

// GET: 풀이 기록 조회
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid } = auth;

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    const db = getD1(request);

    let result;
    if (sessionId) {
      // 특정 세션의 풀이 기록
      result = await db
        .prepare(
          `SELECT * FROM attempts
           WHERE session_id = ? AND user_id = ?
           ORDER BY created_at ASC`,
        )
        .bind(sessionId, uid)
        .all();
    } else {
      // 최근 풀이 기록 (최대 50개)
      result = await db
        .prepare(
          `SELECT * FROM attempts
           WHERE user_id = ?
           ORDER BY created_at DESC
           LIMIT 50`,
        )
        .bind(uid)
        .all();
    }

    // JSON 필드 파싱
    const attempts = (result.results || []).map((row: any) => ({
      ...row,
      problem_irt: JSON.parse(row.problem_irt || "{}"),
    }));

    return NextResponse.json({
      attempts,
      count: attempts.length,
    });
  } catch (error) {
    console.error("[GET /api/d1/attempts]", error);
    return NextResponse.json(
      { error: "풀이 기록 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

// POST: 풀이 기록 저장
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid } = auth;

    const body = await request.json();
    const {
      sessionId,
      problemContent,
      problemIrt,
      userAnswer,
      correctAnswer,
      isCorrect,
      timeSpentMs,
      hintsUsed,
      thetaBefore,
      thetaAfter,
      flowState,
    } = body;

    if (
      !sessionId ||
      !problemContent ||
      userAnswer == null ||
      correctAnswer == null
    ) {
      return NextResponse.json(
        {
          error:
            "sessionId, problemContent, userAnswer, correctAnswer는 필수입니다.",
        },
        { status: 400 },
      );
    }

    const db = getD1(request);

    // 세션 소유권 확인
    const session = await db
      .prepare("SELECT id, user_id FROM sessions WHERE id = ?")
      .bind(sessionId)
      .first<{ id: string; user_id: string }>();

    if (!session) {
      return NextResponse.json(
        { error: "세션을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    if (session.user_id !== uid) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const id = generateId();
    const now = nowISO();

    await db
      .prepare(
        `INSERT INTO attempts
         (id, session_id, user_id, problem_content, problem_irt, user_answer,
          correct_answer, is_correct, time_spent_ms, hints_used,
          theta_before, theta_after, flow_state, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        sessionId,
        uid,
        problemContent,
        JSON.stringify(problemIrt || {}),
        String(userAnswer),
        String(correctAnswer),
        isCorrect ? 1 : 0,
        timeSpentMs || 0,
        hintsUsed || 0,
        thetaBefore ?? 0,
        thetaAfter ?? 0,
        flowState || null,
        now,
      )
      .run();

    // 세션의 문제 수 업데이트
    await db
      .prepare(
        `UPDATE sessions
         SET problems_attempted = problems_attempted + 1,
             problems_correct = problems_correct + ?,
             updated_at = ?
         WHERE id = ?`,
      )
      .bind(isCorrect ? 1 : 0, now, sessionId)
      .run();

    const attempt = await db
      .prepare("SELECT * FROM attempts WHERE id = ?")
      .bind(id)
      .first();

    const parsed = {
      ...(attempt as Record<string, unknown>),
      problem_irt: JSON.parse((attempt as any)?.problem_irt || "{}"),
    };

    return NextResponse.json(parsed, { status: 201 });
  } catch (error) {
    console.error("[POST /api/d1/attempts]", error);
    return NextResponse.json(
      { error: "풀이 기록 저장 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
