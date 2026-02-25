// ============================================================
// 셈마루(SemMaru) - 8-Channel Flow Model (Csikszentmihalyi)
// ============================================================
// Challenge (도전) vs Skill (능력) 매트릭스
// ============================================================

import { FlowChannel, FlowState, ProblemAttempt } from "@/types";
import { FLOW_CONSTANTS } from "@/constants";
import { clamp, average } from "@/lib/utils";

/**
 * 8-Channel Flow 모델 채널 정의
 *
 *       High Challenge
 *            |
 *   Anxiety  |  Arousal  |  Flow
 *  (불안)    |  (각성)   |  (몰입)
 * -----------+-----------+----------
 *   Worry    |  (Center) |  Control
 *  (걱정)    |           |  (통제)
 * -----------+-----------+----------
 *   Apathy   |  Boredom  | Relaxation
 *  (무관심)  |  (지루함) |  (이완)
 *            |
 *       Low Challenge
 *
 *  Low Skill ------ High Skill
 */

interface FlowChannelBounds {
  challenge: [number, number]; // [min, max]
  skill: [number, number];
}

const CHANNEL_BOUNDS: Record<FlowChannel, FlowChannelBounds> = {
  anxiety: { challenge: [67, 100], skill: [0, 33] },
  arousal: { challenge: [67, 100], skill: [33, 67] },
  flow: { challenge: [67, 100], skill: [67, 100] },
  control: { challenge: [33, 67], skill: [67, 100] },
  relaxation: { challenge: [0, 33], skill: [67, 100] },
  boredom: { challenge: [0, 33], skill: [33, 67] },
  apathy: { challenge: [0, 33], skill: [0, 33] },
  worry: { challenge: [33, 67], skill: [0, 33] },
};

/**
 * Determine the flow channel based on challenge and skill levels
 * @param challengeLevel - 0-100 scale
 * @param skillLevel - 0-100 scale
 * @returns Flow channel
 */
export function determineFlowChannel(
  challengeLevel: number,
  skillLevel: number,
): FlowChannel {
  const c = clamp(challengeLevel, 0, 100);
  const s = clamp(skillLevel, 0, 100);

  // Find matching channel
  for (const [channel, bounds] of Object.entries(CHANNEL_BOUNDS)) {
    if (
      c >= bounds.challenge[0] &&
      c <= bounds.challenge[1] &&
      s >= bounds.skill[0] &&
      s <= bounds.skill[1]
    ) {
      return channel as FlowChannel;
    }
  }

  // Default to center (control/worry based on skill)
  return skillLevel > 50 ? "control" : "worry";
}

/**
 * Calculate challenge level from recent problem attempts
 * @param attempts - Recent problem attempts
 * @param problemDifficulties - Difficulty of each problem (IRT b parameter)
 * @param userTheta - User's ability level
 * @returns Challenge level (0-100)
 */
export function calculateChallengeLevel(
  attempts: ProblemAttempt[],
  problemDifficulties: number[],
  userTheta: number,
): number {
  if (attempts.length === 0) return 50;

  // Calculate average difficulty relative to user ability
  const relativeDifficulties = problemDifficulties.map((d) => d - userTheta);
  const avgRelativeDifficulty = average(relativeDifficulties);

  // Map to 0-100 scale (-3 to +3 theta scale)
  // If problems are 3 levels harder than user = 100% challenge
  // If problems are 3 levels easier = 0% challenge
  const challengeLevel = ((avgRelativeDifficulty + 3) / 6) * 100;

  return clamp(challengeLevel, 0, 100);
}

/**
 * Calculate skill level from recent performance
 * @param attempts - Recent problem attempts
 * @returns Skill level (0-100)
 */
export function calculateSkillLevel(attempts: ProblemAttempt[]): number {
  if (attempts.length === 0) return 50;

  // Calculate accuracy
  const correct = attempts.filter((a) => a.is_correct).length;
  const accuracy = correct / attempts.length;

  // Calculate speed factor (how quickly problems are solved)
  const avgTime = average(attempts.map((a) => a.time_spent_ms));
  const idealTime = 60000; // 1 minute
  const speedFactor = clamp(idealTime / avgTime, 0.5, 2);

  // Combine accuracy and speed
  // 70% weight on accuracy, 30% on speed
  const skillLevel = (accuracy * 0.7 + ((speedFactor - 0.5) / 1.5) * 0.3) * 100;

  return clamp(skillLevel, 0, 100);
}

/**
 * Calculate engagement score based on flow state and behavior
 * @param flowChannel - Current flow channel
 * @param timeOnTask - Time spent on current problem (ms)
 * @param hintsUsed - Number of hints used
 * @returns Engagement score (0-100)
 */
export function calculateEngagement(
  flowChannel: FlowChannel,
  timeOnTask: number,
  hintsUsed: number,
): number {
  // Base engagement by channel
  const channelEngagement: Record<FlowChannel, number> = {
    flow: 100,
    arousal: 85,
    control: 80,
    relaxation: 60,
    anxiety: 50,
    worry: 40,
    boredom: 30,
    apathy: 10,
  };

  let engagement = channelEngagement[flowChannel];

  // Penalize for too much time (might indicate confusion)
  if (timeOnTask > 180000) {
    // More than 3 minutes
    engagement *= 0.8;
  }

  // Penalize for hint usage
  engagement -= hintsUsed * 5;

  return clamp(engagement, 0, 100);
}

/**
 * Create a new flow state snapshot
 * @param attempts - Recent problem attempts
 * @param problemDifficulties - Difficulties of attempted problems
 * @param userTheta - Current user theta
 * @returns Flow state object
 */
export function createFlowState(
  attempts: ProblemAttempt[],
  problemDifficulties: number[],
  userTheta: number,
): FlowState {
  const challengeLevel = calculateChallengeLevel(
    attempts,
    problemDifficulties,
    userTheta,
  );
  const skillLevel = calculateSkillLevel(attempts);
  const channel = determineFlowChannel(challengeLevel, skillLevel);

  // Calculate engagement from most recent attempt
  const lastAttempt = attempts[attempts.length - 1];
  const engagement = lastAttempt
    ? calculateEngagement(
        channel,
        lastAttempt.time_spent_ms,
        lastAttempt.hints_used,
      )
    : 50;

  return {
    channel,
    challenge_level: Math.round(challengeLevel),
    skill_level: Math.round(skillLevel),
    engagement_score: Math.round(engagement),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get difficulty adjustment recommendation based on flow state
 * @param flowState - Current flow state
 * @returns Adjustment factor (-1 to +1, where negative = easier, positive = harder)
 */
export function getDifficultyAdjustment(flowState: FlowState): number {
  const adjustments: Record<FlowChannel, number> = {
    anxiety: -0.5, // Too hard, make easier
    arousal: -0.2, // Slightly too hard
    flow: 0, // Perfect, maintain
    control: 0.2, // Slightly too easy
    relaxation: 0.3, // Too easy, increase challenge
    boredom: 0.5, // Much too easy
    apathy: 0, // Reset/re-engage needed
    worry: -0.3, // Needs more skill building
  };

  return adjustments[flowState.channel];
}

/**
 * Check if intervention is needed (user struggling or disengaged)
 * @param flowHistory - Recent flow states
 * @returns Intervention recommendation
 */
export function checkIntervention(flowHistory: FlowState[]): {
  needed: boolean;
  type: "encouragement" | "break" | "difficulty" | "none";
  message: string;
} {
  if (flowHistory.length < 3) {
    return { needed: false, type: "none", message: "" };
  }

  const recent = flowHistory.slice(-5);
  const avgEngagement = average(recent.map((f) => f.engagement_score));
  const negativeChannels = recent.filter((f) =>
    ["anxiety", "worry", "apathy", "boredom"].includes(f.channel),
  ).length;

  // Low engagement
  if (avgEngagement < FLOW_CONSTANTS.MIN_ENGAGEMENT) {
    return {
      needed: true,
      type: "break",
      message: "잠시 휴식을 취해볼까요? 🧘",
    };
  }

  // Too many negative states
  if (negativeChannels >= 3) {
    const anxietyCount = recent.filter((f) =>
      ["anxiety", "worry"].includes(f.channel),
    ).length;

    if (anxietyCount >= 2) {
      return {
        needed: true,
        type: "difficulty",
        message: "조금 더 쉬운 문제로 자신감을 키워볼까요? 💪",
      };
    }

    if (
      recent.filter((f) => ["boredom", "apathy"].includes(f.channel)).length >=
      2
    ) {
      return {
        needed: true,
        type: "difficulty",
        message: "더 도전적인 문제를 풀어볼까요? 🚀",
      };
    }
  }

  // Consecutive struggles
  const lastThree = recent.slice(-3);
  if (lastThree.every((f) => f.engagement_score < 50)) {
    return {
      needed: true,
      type: "encouragement",
      message: "잘하고 있어요! 포기하지 마세요! ✨",
    };
  }

  return { needed: false, type: "none", message: "" };
}

/**
 * Calculate flow zone boundaries for visualization
 * @returns Boundaries for flow zone chart
 */
export function getFlowZoneBoundaries(): {
  channel: FlowChannel;
  x: number;
  y: number;
  width: number;
  height: number;
}[] {
  return Object.entries(CHANNEL_BOUNDS).map(([channel, bounds]) => ({
    channel: channel as FlowChannel,
    x: bounds.skill[0],
    y: 100 - bounds.challenge[1],
    width: bounds.skill[1] - bounds.skill[0],
    height: bounds.challenge[1] - bounds.challenge[0],
  }));
}

/**
 * Get flow state description for UI
 * @param channel - Flow channel
 * @returns Description and recommendation
 */
export function getFlowStateDescription(channel: FlowChannel): {
  title: string;
  description: string;
  recommendation: string;
  emoji: string;
} {
  const descriptions: Record<
    FlowChannel,
    {
      title: string;
      description: string;
      recommendation: string;
      emoji: string;
    }
  > = {
    flow: {
      title: "완벽한 몰입",
      description:
        "최적의 학습 상태입니다! 도전과 능력이 균형을 이루고 있어요.",
      recommendation: "이 상태를 유지하며 계속 학습하세요.",
      emoji: "🎯",
    },
    arousal: {
      title: "도전 상태",
      description: "약간 어렵지만 성장하고 있어요.",
      recommendation: "집중을 유지하면 곧 몰입 상태에 도달할 수 있어요.",
      emoji: "🔥",
    },
    control: {
      title: "통제 상태",
      description: "편안하게 잘 풀고 있어요.",
      recommendation: "조금 더 어려운 문제에 도전해보세요.",
      emoji: "💪",
    },
    relaxation: {
      title: "여유 상태",
      description: "문제가 쉽게 느껴지네요.",
      recommendation: "다음 단계로 도전해볼 준비가 되었어요!",
      emoji: "😌",
    },
    boredom: {
      title: "지루함",
      description: "너무 쉬운 문제를 풀고 있어요.",
      recommendation: "난이도를 높여 새로운 도전을 시작해보세요.",
      emoji: "😐",
    },
    apathy: {
      title: "무관심",
      description: "학습 의욕이 떨어진 상태예요.",
      recommendation: "잠시 휴식 후 흥미로운 주제로 다시 시작해보세요.",
      emoji: "😶",
    },
    worry: {
      title: "걱정",
      description: "문제가 어렵게 느껴지고 있어요.",
      recommendation: "기초부터 차근차근 다져보아요.",
      emoji: "😟",
    },
    anxiety: {
      title: "불안",
      description: "문제가 너무 어려워요.",
      recommendation: "더 쉬운 문제로 자신감을 키워보아요.",
      emoji: "😰",
    },
  };

  return descriptions[channel];
}

/**
 * Calculate optimal session duration based on flow history
 * @param flowHistory - Session flow history
 * @returns Recommended remaining time in minutes
 */
export function getRecommendedSessionDuration(
  flowHistory: FlowState[],
): number {
  if (flowHistory.length < 5) return 30; // Default 30 minutes

  const avgEngagement = average(flowHistory.map((f) => f.engagement_score));
  const flowTime = flowHistory.filter((f) => f.channel === "flow").length;
  const flowRatio = flowTime / flowHistory.length;

  // High engagement and flow = can continue longer
  if (avgEngagement > 70 && flowRatio > 0.5) {
    return 45;
  }

  // Low engagement = shorter session
  if (avgEngagement < 40) {
    return 15;
  }

  return 30;
}
