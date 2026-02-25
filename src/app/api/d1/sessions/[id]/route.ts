// ============================================================
// D1 API: /api/d1/sessions/[id]
// PATCH: 세션 업데이트 (세션 종료 포함)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getD1, authenticateRequest, nowISO } from "@/lib/d1/helpers";

export const runtime = "edge";

// PATCH: 세션 업데이트
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid } = auth;

    const { id: sessionId } = await params;
    const body = await request.json();

    const db = getD1(request);

    // 세션 소유권 확인
    const existing = await db
      .prepare("SELECT id, user_id FROM sessions WHERE id = ?")
      .bind(sessionId)
      .first<{ id: string; user_id: string }>();

    if (!existing) {
      return NextResponse.json(
        { error: "세션을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    if (existing.user_id !== uid) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 업데이트 가능 필드
    const allowedFields = [
      "ended_at",
      "problems_attempted",
      "problems_correct",
      "final_theta",
      "xp_earned",
      "flow_percentage",
    ];

    const fields: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    // 세션 종료 처리: ended_at이 없으면 자동 설정
    if (body.ended === true && !body.ended_at) {
      fields.push("ended_at = ?");
      values.push(nowISO());
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { error: "업데이트할 필드가 없습니다." },
        { status: 400 },
      );
    }

    // updated_at 자동 갱신
    fields.push("updated_at = ?");
    values.push(nowISO());

    values.push(sessionId);

    await db
      .prepare(`UPDATE sessions SET ${fields.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    const updated = await db
      .prepare("SELECT * FROM sessions WHERE id = ?")
      .bind(sessionId)
      .first();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/d1/sessions/[id]]", error);
    return NextResponse.json(
      { error: "세션 업데이트 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
