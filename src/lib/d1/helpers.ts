// ============================================================
// 셈마루(SemMaru) - D1 Helper & Auth Middleware
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  verifyFirebaseToken,
  extractBearerToken,
} from "@/lib/auth/verify-token";

// D1 바인딩 타입
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: Record<string, unknown>;
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

// CloudflareEnv에서 DB 가져오기
export function getD1(request: NextRequest): D1Database {
  const env = (request as any).cf?.env || (globalThis as any).process?.env;
  // Next.js on Cloudflare에서 바인딩 접근
  const db =
    (env as any)?.DB ||
    (globalThis as any).__env__?.DB ||
    (request as any).env?.DB;

  if (!db) {
    throw new Error("D1 database binding not found");
  }
  return db as D1Database;
}

// 인증된 요청에서 유저 ID 추출
export async function authenticateRequest(
  request: NextRequest,
): Promise<{ uid: string } | NextResponse> {
  const authHeader = request.headers.get("Authorization");
  const token = extractBearerToken(authHeader);

  if (!token) {
    return NextResponse.json(
      { error: "인증 토큰이 필요합니다." },
      { status: 401 },
    );
  }

  try {
    const decoded = await verifyFirebaseToken(token);
    return { uid: decoded.uid };
  } catch (error) {
    return NextResponse.json(
      { error: "유효하지 않은 인증 토큰입니다." },
      { status: 401 },
    );
  }
}

// 현재 시간 ISO 문자열
export function nowISO(): string {
  return new Date().toISOString();
}

// 랜덤 ID 생성
export function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
