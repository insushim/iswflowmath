// ============================================================
// 셈마루(SemMaru) - 이메일 찾기 API (D1 전환)
// firebase-admin 대신 D1 API 사용
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getD1 } from "@/lib/d1/helpers";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "이름을 입력해주세요." },
        { status: 400 },
      );
    }

    // D1에서 이름으로 사용자 검색
    const db = getD1(request);
    const user = await db
      .prepare("SELECT email FROM users WHERE name = ? LIMIT 1")
      .bind(name.trim())
      .first<{ email: string }>();

    if (!user) {
      return NextResponse.json(
        { error: "입력하신 정보와 일치하는 계정을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 이메일 마스킹
    const maskedEmail = maskEmail(user.email);

    return NextResponse.json({ email: maskedEmail });
  } catch (error) {
    console.error("Find email error:", error);
    return NextResponse.json(
      { error: "아이디 찾기 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (localPart.length <= 3) {
    return `${localPart[0]}**@${domain}`;
  }
  const visiblePart = localPart.slice(0, 3);
  const maskedPart = "*".repeat(localPart.length - 3);
  return `${visiblePart}${maskedPart}@${domain}`;
}
