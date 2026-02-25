// ============================================================
// D1 API: /api/d1/sessions
// GET: 세션 목록 조회
// POST: 새 세션 생성
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  getD1,
  authenticateRequest,
  nowISO,
  generateId,
} from "@/lib/d1/helpers";

export const runtime = "edge";

// GET: 세션 목록 조회 (query: limit)
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid } = auth;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "10", 10), 1),
      100,
    );

    const db = getD1(request);
    const result = await db
      .prepare(
        `SELECT * FROM sessions
         WHERE user_id = ?
         ORDER BY started_at DESC
         LIMIT ?`,
      )
      .bind(uid, limit)
      .all();

    return NextResponse.json({
      sessions: result.results || [],
      count: result.results?.length || 0,
    });
  } catch (error) {
    console.error("[GET /api/d1/sessions]", error);
    return NextResponse.json(
      { error: "세션 목록 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

// POST: 새 세션 생성
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid } = auth;

    const body = await request.json();
    const { topic, initialTheta } = body;

    if (!topic) {
      return NextResponse.json(
        { error: "학습 주제(topic)는 필수입니다." },
        { status: 400 },
      );
    }

    const db = getD1(request);
    const id = generateId();
    const now = nowISO();

    await db
      .prepare(
        `INSERT INTO sessions (id, user_id, topic, initial_theta, started_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, uid, topic, initialTheta ?? 0, now, now, now)
      .run();

    const session = await db
      .prepare("SELECT * FROM sessions WHERE id = ?")
      .bind(id)
      .first();

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("[POST /api/d1/sessions]", error);
    return NextResponse.json(
      { error: "세션 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
