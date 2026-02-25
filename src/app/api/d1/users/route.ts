// ============================================================
// D1 API: /api/d1/users
// GET: 인증된 유저 프로필 조회
// POST: 새 유저 프로필 생성
// PATCH: 유저 프로필 업데이트
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getD1, authenticateRequest, nowISO } from "@/lib/d1/helpers";

export const runtime = "edge";

// GET: 인증된 유저의 프로필 조회
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid } = auth;

    const db = getD1(request);
    const user = await db
      .prepare("SELECT * FROM users WHERE id = ?")
      .bind(uid)
      .first();

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // JSON 필드 파싱
    const parsed = {
      ...user,
      activity_dates: JSON.parse((user as any).activity_dates || "[]"),
      achievements: JSON.parse((user as any).achievements || "[]"),
      achievement_history: JSON.parse(
        (user as any).achievement_history || "[]",
      ),
      diagnostic_result: (user as any).diagnostic_result
        ? JSON.parse((user as any).diagnostic_result)
        : null,
    };

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[GET /api/d1/users]", error);
    return NextResponse.json(
      { error: "프로필 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

// POST: 새 유저 프로필 생성
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid } = auth;

    const body = await request.json();
    const { name, email, grade } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "이름과 이메일은 필수입니다." },
        { status: 400 },
      );
    }

    const db = getD1(request);

    // 이미 존재하는지 확인
    const existing = await db
      .prepare("SELECT id FROM users WHERE id = ?")
      .bind(uid)
      .first();

    if (existing) {
      return NextResponse.json(
        { error: "이미 프로필이 존재합니다." },
        { status: 409 },
      );
    }

    const now = nowISO();
    await db
      .prepare(
        `INSERT INTO users (id, name, email, grade, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(uid, name, email, grade || 7, now, now)
      .run();

    const user = await db
      .prepare("SELECT * FROM users WHERE id = ?")
      .bind(uid)
      .first();

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("[POST /api/d1/users]", error);
    return NextResponse.json(
      { error: "프로필 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

// PATCH: 유저 프로필 업데이트
export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const { uid } = auth;

    const body = await request.json();

    // 업데이트 불가 필드 제외
    const forbidden = ["id", "created_at"];
    const fields: string[] = [];
    const values: unknown[] = [];

    // JSON 필드는 stringify 처리
    const jsonFields = [
      "activity_dates",
      "achievements",
      "achievement_history",
      "diagnostic_result",
    ];

    for (const [key, value] of Object.entries(body)) {
      if (forbidden.includes(key)) continue;

      fields.push(`${key} = ?`);
      if (jsonFields.includes(key) && typeof value !== "string") {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
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

    const db = getD1(request);
    values.push(uid);

    await db
      .prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    const updated = await db
      .prepare("SELECT * FROM users WHERE id = ?")
      .bind(uid)
      .first();

    if (!updated) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const parsed = {
      ...updated,
      activity_dates: JSON.parse((updated as any).activity_dates || "[]"),
      achievements: JSON.parse((updated as any).achievements || "[]"),
      achievement_history: JSON.parse(
        (updated as any).achievement_history || "[]",
      ),
      diagnostic_result: (updated as any).diagnostic_result
        ? JSON.parse((updated as any).diagnostic_result)
        : null,
    };

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[PATCH /api/d1/users]", error);
    return NextResponse.json(
      { error: "프로필 업데이트 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
