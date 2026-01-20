// ============================================================
// MathFlow - IRT (Item Response Theory) 3PL Model
// ============================================================
// P(θ) = c + (1-c) / (1 + e^(-a(θ-b)))
// θ: ability, a: discrimination, b: difficulty, c: guessing
// ============================================================

import { IRTParameters, ProblemWithIRT } from '@/types';
import { IRT_CONSTANTS } from '@/constants';
import { clamp } from '@/lib/utils';

/**
 * Calculate the probability of correct answer using 3PL IRT model
 * @param theta - Student ability (-3 to 3)
 * @param params - IRT parameters { a, b, c }
 * @returns Probability of correct answer (0 to 1)
 */
export function calculateProbability(theta: number, params: IRTParameters): number {
  const { a, b, c } = params;
  const exponent = -a * (theta - b);
  return c + (1 - c) / (1 + Math.exp(exponent));
}

/**
 * Calculate information function (how much info this problem provides)
 * @param theta - Student ability
 * @param params - IRT parameters
 * @returns Information value
 */
export function calculateInformation(theta: number, params: IRTParameters): number {
  const { a, b, c } = params;
  const p = calculateProbability(theta, params);
  const q = 1 - p;
  const exponent = -a * (theta - b);
  const expTerm = Math.exp(exponent);

  // Information = a² * (P - c)² * Q / ((1 - c)² * P)
  const numerator = Math.pow(a, 2) * Math.pow(p - c, 2) * q;
  const denominator = Math.pow(1 - c, 2) * p;

  return denominator > 0 ? numerator / denominator : 0;
}

/**
 * Update theta (ability estimate) after answering a problem
 * Uses Expected A Posteriori (EAP) estimation
 * @param currentTheta - Current ability estimate
 * @param params - Problem IRT parameters
 * @param isCorrect - Whether the answer was correct
 * @returns New theta estimate
 */
export function updateTheta(
  currentTheta: number,
  params: IRTParameters,
  isCorrect: boolean
): number {
  const p = calculateProbability(currentTheta, params);
  const info = calculateInformation(currentTheta, params);

  // Avoid division by zero
  if (info === 0) return currentTheta;

  // Bayesian update step
  const response = isCorrect ? 1 : 0;
  const step = (response - p) / info;

  // Apply learning rate and clamp
  const newTheta = currentTheta + step * IRT_CONSTANTS.THETA_CHANGE_RATE;

  return clamp(newTheta, IRT_CONSTANTS.MIN_THETA, IRT_CONSTANTS.MAX_THETA);
}

/**
 * Calculate target difficulty for optimal learning (flow state)
 * Target success probability around 70% (Csikszentmihalyi's optimal challenge)
 * @param theta - Current ability
 * @param targetProbability - Desired success probability (default 0.7)
 * @returns Target difficulty (b parameter)
 */
export function calculateTargetDifficulty(
  theta: number,
  targetProbability = 0.7
): number {
  // Assuming default a and c values
  const a = IRT_CONSTANTS.DEFAULT_DISCRIMINATION;
  const c = IRT_CONSTANTS.DEFAULT_GUESSING;

  // Solve for b: P = c + (1-c)/(1 + e^(-a(θ-b)))
  // (P - c) * (1 + e^(-a(θ-b))) = 1 - c
  // 1 + e^(-a(θ-b)) = (1-c)/(P-c)
  // e^(-a(θ-b)) = (1-c)/(P-c) - 1 = (1-P)/(P-c)
  // -a(θ-b) = ln((1-P)/(P-c))
  // b = θ + ln((1-P)/(P-c))/a

  const adjustedP = Math.max(targetProbability, c + 0.01); // Ensure P > c
  const b = theta + Math.log((1 - adjustedP) / (adjustedP - c)) / a;

  return clamp(b, IRT_CONSTANTS.MIN_THETA, IRT_CONSTANTS.MAX_THETA);
}

/**
 * Select optimal problem for a student based on maximum information
 * @param theta - Student ability
 * @param problems - Available problems
 * @param excludeIds - Problem IDs to exclude (already seen)
 * @returns Best problem for learning
 */
export function selectOptimalProblem(
  theta: number,
  problems: ProblemWithIRT[],
  excludeIds: string[] = []
): ProblemWithIRT | null {
  const availableProblems = problems.filter(
    (p) => !excludeIds.includes(p.id)
  );

  if (availableProblems.length === 0) return null;

  // Calculate information for each problem
  const problemsWithInfo = availableProblems.map((problem) => ({
    problem,
    info: calculateInformation(theta, problem.irt),
  }));

  // Sort by information (descending)
  problemsWithInfo.sort((a, b) => b.info - a.info);

  // Return the most informative problem
  return problemsWithInfo[0].problem;
}

/**
 * Calculate standard error of measurement (SEM)
 * @param theta - Ability estimate
 * @param answeredProblems - Problems that were answered with their IRT params
 * @returns SEM value
 */
export function calculateSEM(
  theta: number,
  answeredProblems: { irt: IRTParameters }[]
): number {
  const totalInfo = answeredProblems.reduce(
    (sum, p) => sum + calculateInformation(theta, p.irt),
    0
  );

  return totalInfo > 0 ? 1 / Math.sqrt(totalInfo) : Infinity;
}

/**
 * Generate IRT parameters for a new problem based on target difficulty
 * @param targetDifficulty - Target b parameter
 * @param grade - Student grade (affects discrimination)
 * @returns Generated IRT parameters
 */
export function generateIRTParameters(
  targetDifficulty: number,
  grade: number
): IRTParameters {
  // Higher grades tend to have higher discrimination problems
  const baseDiscrimination = 0.8 + (grade / 12) * 0.7;

  // Add some randomness
  const a = clamp(
    baseDiscrimination + (Math.random() - 0.5) * 0.4,
    IRT_CONSTANTS.MIN_DISCRIMINATION,
    IRT_CONSTANTS.MAX_DISCRIMINATION
  );

  const b = clamp(
    targetDifficulty + (Math.random() - 0.5) * 0.3,
    IRT_CONSTANTS.MIN_THETA,
    IRT_CONSTANTS.MAX_THETA
  );

  // Lower guessing for higher grades
  const c = clamp(
    0.25 - (grade / 12) * 0.1 + (Math.random() - 0.5) * 0.05,
    IRT_CONSTANTS.MIN_GUESSING,
    IRT_CONSTANTS.MAX_GUESSING
  );

  return { a, b, c };
}

/**
 * Estimate initial theta from diagnostic test results
 * @param results - Array of { correct: boolean, difficulty: number }
 * @returns Estimated initial theta
 */
export function estimateInitialTheta(
  results: { correct: boolean; difficulty: number }[]
): number {
  if (results.length === 0) return IRT_CONSTANTS.INITIAL_THETA;

  // Simple MLE estimation
  const correctDifficulties = results
    .filter((r) => r.correct)
    .map((r) => r.difficulty);

  const incorrectDifficulties = results
    .filter((r) => !r.correct)
    .map((r) => r.difficulty);

  const avgCorrect =
    correctDifficulties.length > 0
      ? correctDifficulties.reduce((a, b) => a + b, 0) / correctDifficulties.length
      : 0;

  const avgIncorrect =
    incorrectDifficulties.length > 0
      ? incorrectDifficulties.reduce((a, b) => a + b, 0) / incorrectDifficulties.length
      : 0;

  // Estimate theta as midpoint between avg correct and avg incorrect
  const theta = (avgCorrect + avgIncorrect) / 2;

  return clamp(theta, IRT_CONSTANTS.MIN_THETA, IRT_CONSTANTS.MAX_THETA);
}

/**
 * Get difficulty label based on theta/b value
 * @param value - Theta or difficulty value
 * @returns Korean label
 */
export function getDifficultyLabel(value: number): string {
  if (value <= -2) return '매우 쉬움';
  if (value <= -1) return '쉬움';
  if (value <= 0) return '보통';
  if (value <= 1) return '어려움';
  if (value <= 2) return '매우 어려움';
  return '최상급';
}

/**
 * Get ability level description
 * @param theta - Ability parameter
 * @returns Description object
 */
export function getAbilityDescription(theta: number): {
  level: string;
  percentile: number;
  description: string;
} {
  // Convert theta to percentile (normal distribution)
  const percentile = Math.round(
    100 * (0.5 * (1 + erf(theta / Math.sqrt(2))))
  );

  let level: string;
  let description: string;

  if (theta >= 2) {
    level = '최상위';
    description = '상위 2% 수준의 뛰어난 실력입니다.';
  } else if (theta >= 1) {
    level = '상위';
    description = '평균 이상의 좋은 실력입니다.';
  } else if (theta >= 0) {
    level = '평균';
    description = '꾸준히 성장하고 있습니다.';
  } else if (theta >= -1) {
    level = '기초';
    description = '기초를 다지는 단계입니다.';
  } else {
    level = '입문';
    description = '시작이 반입니다. 함께 성장해요!';
  }

  return { level, percentile, description };
}

// Error function for normal distribution
function erf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y =
    1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}
