// ============================================================
// D1 API: /api/d1/users/find-by-name
// POST: 이름으로 유저 검색 (공개 API - 인증 불필요)
// 이메일 마스킹 처리하여 반환
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getD1 } from "@/lib/d1/helpers";

export const runtime = "edge";

// 이메일 마스킹: abc@example.com → a**@example.com
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";

  if (local.length <= 1) {
    return `*@${domain}`;
  }
  if (local.length <= 3) {
    return `${local[0]}${"*".repeat(local.length - 1)}@${domain}`;
  }
  return `${local[0]}${"*".repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}

// POST: 이름으로 유저 검색
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "이름을 입력해주세요." },
        { status: 400 },
      );
    }

    const db = getD1(request);
    const result = await db
      .prepare("SELECT id, name, email FROM users WHERE name = ?")
      .bind(name.trim())
      .all<{ id: string; name: string; email: string }>();

    if (!result.results || result.results.length === 0) {
      return NextResponse.json(
        { error: "해당 이름의 사용자를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 이메일 마스킹 처리
    const users = result.results.map((user) => ({
      id: user.id,
      name: user.name,
      maskedEmail: maskEmail(user.email),
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[POST /api/d1/users/find-by-name]", error);
    return NextResponse.json(
      { error: "사용자 검색 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
