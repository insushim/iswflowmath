// ============================================================
// MathFlow - Type Definitions
// IRT 3PL Model + 8-Channel Flow Theory
// ============================================================

// User & Authentication
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  grade: number; // 1-6 (elementary), 7-9 (middle), 10-12 (high)
  subscription_tier: SubscriptionTier;
  created_at: string;
  updated_at: string;
}

export type SubscriptionTier = 'free' | 'pro' | 'premium';

export interface UserProfile extends User {
  total_xp: number;
  current_level: number;
  streak_days: number;
  last_practice_date: string | null;
  theta: number; // IRT ability parameter (-3 to +3)
  achievements: Achievement[];
  stats: UserStats;
}

// IRT (Item Response Theory) Parameters
export interface IRTParameters {
  a: number; // Discrimination (0.5 ~ 2.5)
  b: number; // Difficulty (-3 ~ +3)
  c: number; // Guessing (0 ~ 0.3)
}

export interface ProblemWithIRT {
  id: string;
  content: string;
  latex?: string;
  options?: string[];
  correct_answer: string;
  solution: string;
  hints: string[];
  topic: MathTopic;
  subtopic: string;
  irt: IRTParameters;
  created_at: string;
}

// Math Topics
export type MathTopic =
  | 'arithmetic'      // 사칙연산
  | 'fractions'       // 분수
  | 'decimals'        // 소수
  | 'geometry'        // 기하학
  | 'algebra'         // 대수
  | 'functions'       // 함수
  | 'statistics'      // 통계
  | 'probability'     // 확률
  | 'calculus'        // 미적분
  | 'vectors'         // 벡터
  | 'sequences';      // 수열

export const MATH_TOPICS: Record<MathTopic, string> = {
  arithmetic: '사칙연산',
  fractions: '분수',
  decimals: '소수',
  geometry: '기하학',
  algebra: '대수',
  functions: '함수',
  statistics: '통계',
  probability: '확률',
  calculus: '미적분',
  vectors: '벡터',
  sequences: '수열',
};

// Flow State (8-Channel Model)
export type FlowChannel =
  | 'anxiety'     // 불안 (높은 도전, 낮은 능력)
  | 'arousal'     // 각성 (높은 도전, 중간 능력)
  | 'flow'        // 몰입 (높은 도전, 높은 능력)
  | 'control'     // 통제 (중간 도전, 높은 능력)
  | 'relaxation'  // 이완 (낮은 도전, 높은 능력)
  | 'boredom'     // 지루함 (낮은 도전, 중간 능력)
  | 'apathy'      // 무관심 (낮은 도전, 낮은 능력)
  | 'worry';      // 걱정 (중간 도전, 낮은 능력)

export interface FlowState {
  channel: FlowChannel;
  challenge_level: number; // 0-100
  skill_level: number;     // 0-100
  engagement_score: number; // 0-100
  timestamp: string;
}

export const FLOW_CHANNELS: Record<FlowChannel, { label: string; color: string; emoji: string }> = {
  anxiety: { label: '불안', color: '#EF4444', emoji: '😰' },
  arousal: { label: '각성', color: '#F97316', emoji: '🔥' },
  flow: { label: '몰입', color: '#22C55E', emoji: '🎯' },
  control: { label: '통제', color: '#3B82F6', emoji: '💪' },
  relaxation: { label: '이완', color: '#8B5CF6', emoji: '😌' },
  boredom: { label: '지루함', color: '#6B7280', emoji: '😐' },
  apathy: { label: '무관심', color: '#9CA3AF', emoji: '😶' },
  worry: { label: '걱정', color: '#EAB308', emoji: '😟' },
};

// Practice Session
export interface PracticeSession {
  id: string;
  user_id: string;
  topic: MathTopic;
  started_at: string;
  ended_at?: string;
  problems_attempted: number;
  problems_correct: number;
  initial_theta: number;
  final_theta: number;
  flow_history: FlowState[];
  xp_earned: number;
}

// Problem Attempt
export interface ProblemAttempt {
  id: string;
  session_id: string;
  problem_id: string;
  user_answer: string;
  is_correct: boolean;
  time_spent_ms: number;
  hints_used: number;
  theta_before: number;
  theta_after: number;
  flow_state: FlowChannel;
  created_at: string;
}

// User Statistics
export interface UserStats {
  total_problems: number;
  correct_problems: number;
  accuracy_rate: number;
  total_time_minutes: number;
  avg_time_per_problem: number;
  streak_days: number;
  longest_streak: number;
  flow_time_percentage: number;
  topics_mastered: MathTopic[];
  weekly_activity: DailyActivity[];
}

export interface DailyActivity {
  date: string;
  problems_solved: number;
  xp_earned: number;
  time_spent_minutes: number;
  flow_percentage: number;
}

// Achievements & Gamification
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirement: number;
  xp_reward: number;
  unlocked_at?: string;
}

export type AchievementCategory =
  | 'problems'   // 문제 풀이
  | 'streak'     // 연속 학습
  | 'accuracy'   // 정확도
  | 'flow'       // 몰입 시간
  | 'speed'      // 속도
  | 'mastery';   // 주제 마스터

// Leaderboard
export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  avatar_url?: string;
  total_xp: number;
  level: number;
  problems_solved: number;
}

// API Request/Response Types
export interface GenerateProblemRequest {
  topic: MathTopic;
  theta: number;
  grade: number;
  previous_problems?: string[];
}

export interface GenerateProblemResponse {
  problem: ProblemWithIRT;
  estimated_difficulty: number;
  probability_correct: number;
}

export interface SubmitAnswerRequest {
  session_id: string;
  problem_id: string;
  user_answer: string;
  time_spent_ms: number;
  hints_used: number;
}

export interface SubmitAnswerResponse {
  is_correct: boolean;
  correct_answer: string;
  solution: string;
  new_theta: number;
  xp_earned: number;
  new_flow_state: FlowState;
  achievements_unlocked: Achievement[];
}

export interface HintRequest {
  problem_id: string;
  hint_index: number;
}

export interface HintResponse {
  hint: string;
  hints_remaining: number;
  xp_penalty: number;
}

// Subscription & Billing
export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: {
    problems_per_day: number;
    hints_per_problem: number;
    analytics_days: number;
    ai_explanations: boolean;
  };
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: '무료',
    price_monthly: 0,
    price_yearly: 0,
    features: [
      '하루 10문제',
      '기본 통계',
      '힌트 1개/문제',
    ],
    limits: {
      problems_per_day: 10,
      hints_per_problem: 1,
      analytics_days: 7,
      ai_explanations: false,
    },
  },
  {
    id: 'pro',
    name: '프로',
    price_monthly: 9900,
    price_yearly: 99000,
    features: [
      '하루 50문제',
      '30일 통계',
      '힌트 3개/문제',
      'AI 풀이 설명',
    ],
    limits: {
      problems_per_day: 50,
      hints_per_problem: 3,
      analytics_days: 30,
      ai_explanations: true,
    },
  },
  {
    id: 'premium',
    name: '프리미엄',
    price_monthly: 19900,
    price_yearly: 199000,
    features: [
      '무제한 문제',
      '전체 통계',
      '무제한 힌트',
      'AI 풀이 설명',
      '1:1 AI 튜터',
      '부모 리포트',
    ],
    limits: {
      problems_per_day: Infinity,
      hints_per_problem: Infinity,
      analytics_days: 365,
      ai_explanations: true,
    },
  },
];
