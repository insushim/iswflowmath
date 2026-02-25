// ============================================================
// 셈마루(SemMaru) - D1 API 클라이언트 래퍼
// Firebase Auth 토큰 자동 첨부
// ============================================================

import { auth } from "@/lib/firebase/config";

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = "";
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `API error: ${response.status}`);
    }

    return response.json();
  }

  // ============================================================
  // Users
  // ============================================================

  async getUser() {
    return this.request<any>("/api/d1/users");
  }

  async createUser(data: { name: string; email: string; grade: number }) {
    return this.request<any>("/api/d1/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateUser(data: Record<string, unknown>) {
    return this.request<any>("/api/d1/users", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async findUserByName(name: string) {
    return this.request<any>("/api/d1/users/find-by-name", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  // ============================================================
  // Diagnostic
  // ============================================================

  async getDiagnostic() {
    return this.request<any>("/api/d1/users/diagnostic");
  }

  async saveDiagnostic(data: {
    estimatedLevel: number;
    theta: number;
    grade: number;
    strengths: string[];
    weaknesses: string[];
    answers: { problemId: string; correct: boolean; topic: string }[];
  }) {
    return this.request<any>("/api/d1/users/diagnostic", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async resetDiagnostic() {
    return this.request<any>("/api/d1/users/diagnostic", {
      method: "DELETE",
    });
  }

  // ============================================================
  // Sessions
  // ============================================================

  async getSessions(limit = 10) {
    return this.request<any>(`/api/d1/sessions?limit=${limit}`);
  }

  async createSession(data: { topic: string; initialTheta: number }) {
    return this.request<any>("/api/d1/sessions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateSession(sessionId: string, data: Record<string, unknown>) {
    return this.request<any>(`/api/d1/sessions/${sessionId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // Attempts
  // ============================================================

  async getAttempts(sessionId?: string) {
    const query = sessionId ? `?sessionId=${sessionId}` : "";
    return this.request<any>(`/api/d1/attempts${query}`);
  }

  async saveAttempt(data: {
    sessionId: string;
    problemContent: string;
    problemIrt: { a: number; b: number; c: number };
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    timeSpentMs: number;
    hintsUsed: number;
    thetaBefore: number;
    thetaAfter: number;
    flowState?: string;
  }) {
    return this.request<any>("/api/d1/attempts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // Achievements
  // ============================================================

  async getAchievements() {
    return this.request<any>("/api/d1/achievements");
  }

  async unlockAchievement(achievementId: string) {
    return this.request<any>("/api/d1/achievements", {
      method: "POST",
      body: JSON.stringify({ achievementId }),
    });
  }

  // ============================================================
  // Daily Stats
  // ============================================================

  async getDailyStats(days = 7) {
    return this.request<any>(`/api/d1/daily-stats?days=${days}`);
  }

  async updateDailyStats(data: {
    problemsSolved: number;
    problemsCorrect: number;
    xpEarned: number;
    timeSpentMinutes: number;
    topic: string;
  }) {
    return this.request<any>("/api/d1/daily-stats", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // Immersion Problems
  // ============================================================

  async getActiveImmersionProblem(difficulty: string) {
    return this.request<any>(`/api/d1/immersion?difficulty=${difficulty}`);
  }

  async assignImmersionProblem(data: {
    difficulty: string;
    topic: string;
    content: string;
    hints: string[];
    solution: string;
  }) {
    return this.request<any>("/api/d1/immersion", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateImmersionProblem(
    problemId: string,
    data: Record<string, unknown>,
  ) {
    return this.request<any>("/api/d1/immersion", {
      method: "PATCH",
      body: JSON.stringify({ problemId, ...data }),
    });
  }

  // ============================================================
  // XP
  // ============================================================

  async awardXp(data: { amount: number; source: string }) {
    return this.request<any>("/api/d1/xp/award", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // Streak
  // ============================================================

  async getStreak() {
    return this.request<any>("/api/d1/streak");
  }

  async recordActivity() {
    return this.request<any>("/api/d1/streak", {
      method: "POST",
    });
  }

  // ============================================================
  // Gamification Check
  // ============================================================

  async checkAchievements(context: Record<string, unknown>) {
    return this.request<any>("/api/d1/gamification/check", {
      method: "POST",
      body: JSON.stringify(context),
    });
  }
}

export const api = new ApiClient();
