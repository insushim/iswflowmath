// ============================================================
// 셈마루(SemMaru) - D1 Immersion Problems API
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  getD1,
  authenticateRequest,
  nowISO,
  generateId,
} from "@/lib/d1/helpers";

export const runtime = "edge";

// GET: 활성 몰입 문제 조회 (query: difficulty)
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid } = auth;

    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get("difficulty");

    const db = getD1(request);

    let query = `SELECT id, difficulty, topic, content, hints, solution,
                        status, userAnswer, isCorrect, timeSpentMinutes,
                        assignedAt, completedAt
                 FROM immersion_problems
                 WHERE userId = ? AND status = 'active'`;
    const params: unknown[] = [uid];

    if (difficulty) {
      query += ` AND difficulty = ?`;
      params.push(difficulty);
    }

    query += ` ORDER BY assignedAt DESC`;

    const stmt = db.prepare(query);
    const { results } = await stmt.bind(...params).all<{
      id: string;
      difficulty: string;
      topic: string;
      content: string;
      hints: string | null;
      solution: string | null;
      status: string;
      userAnswer: string | null;
      isCorrect: number | null;
      timeSpentMinutes: number | null;
      assignedAt: string;
      completedAt: string | null;
    }>();

    // JSON 필드 파싱
    const problems = results.map((row) => ({
      ...row,
      content: JSON.parse(row.content),
      hints: row.hints ? JSON.parse(row.hints) : [],
      solution: row.solution ? JSON.parse(row.solution) : null,
      isCorrect: row.isCorrect === null ? null : Boolean(row.isCorrect),
    }));

    return NextResponse.json({
      success: true,
      problems,
      total: problems.length,
    });
  } catch (error) {
    console.error("GET /api/d1/immersion error:", error);
    return NextResponse.json(
      { error: "몰입 문제 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}

// POST: 몰입 문제 배정
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid } = auth;

    const body = await request.json();
    const { difficulty, topic, content, hints, solution } = body;

    if (!difficulty || !topic || !content) {
      return NextResponse.json(
        { error: "difficulty, topic, content는 필수입니다." },
        { status: 400 },
      );
    }

    const db = getD1(request);
    const now = nowISO();
    const id = generateId();

    await db
      .prepare(
        `INSERT INTO immersion_problems
         (id, userId, difficulty, topic, content, hints, solution,
          status, assignedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      )
      .bind(
        id,
        uid,
        difficulty,
        topic,
        JSON.stringify(content),
        hints ? JSON.stringify(hints) : null,
        solution ? JSON.stringify(solution) : null,
        now,
      )
      .run();

    return NextResponse.json({
      success: true,
      problemId: id,
      assignedAt: now,
    });
  } catch (error) {
    console.error("POST /api/d1/immersion error:", error);
    return NextResponse.json(
      { error: "몰입 문제 배정에 실패했습니다." },
      { status: 500 },
    );
  }
}

// PATCH: 몰입 문제 업데이트/완료
export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid } = auth;

    const body = await request.json();
    const { problemId, status, userAnswer, isCorrect, timeSpentMinutes } = body;

    if (!problemId) {
      return NextResponse.json(
        { error: "problemId는 필수입니다." },
        { status: 400 },
      );
    }

    const db = getD1(request);
    const now = nowISO();

    // 해당 문제가 본인 소유인지 확인
    const existing = await db
      .prepare(`SELECT id FROM immersion_problems WHERE id = ? AND userId = ?`)
      .bind(problemId, uid)
      .first<{ id: string }>();

    if (!existing) {
      return NextResponse.json(
        { error: "문제를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 동적 UPDATE 쿼리 구성
    const updates: string[] = [];
    const values: unknown[] = [];

    if (status !== undefined) {
      updates.push("status = ?");
      values.push(status);
    }
    if (userAnswer !== undefined) {
      updates.push("userAnswer = ?");
      values.push(userAnswer);
    }
    if (isCorrect !== undefined) {
      updates.push("isCorrect = ?");
      values.push(isCorrect ? 1 : 0);
    }
    if (timeSpentMinutes !== undefined) {
      updates.push("timeSpentMinutes = ?");
      values.push(timeSpentMinutes);
    }
    if (status === "completed") {
      updates.push("completedAt = ?");
      values.push(now);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "업데이트할 필드가 없습니다." },
        { status: 400 },
      );
    }

    values.push(problemId, uid);

    await db
      .prepare(
        `UPDATE immersion_problems
         SET ${updates.join(", ")}
         WHERE id = ? AND userId = ?`,
      )
      .bind(...values)
      .run();

    return NextResponse.json({
      success: true,
      problemId,
      updatedAt: now,
    });
  } catch (error) {
    console.error("PATCH /api/d1/immersion error:", error);
    return NextResponse.json(
      { error: "몰입 문제 업데이트에 실패했습니다." },
      { status: 500 },
    );
  }
}
