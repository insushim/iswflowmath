// ============================================================
// MathFlow - Gemini AI Problem Generator
// ============================================================
// Google Gemini API를 사용한 적응형 수학 문제 생성
// ============================================================

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import {
  MathTopic,
  ProblemWithIRT,
  IRTParameters,
  GenerateProblemRequest,
  MATH_TOPICS,
} from '@/types';
import { GRADE_TOPICS } from '@/constants';
import { generateIRTParameters, calculateTargetDifficulty } from '@/lib/irt';
import { generateUUID } from '@/lib/utils';

// Gemini AI 클라이언트 초기화
let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

function getGeminiClient(): GenerativeModel {
  if (!model) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    genAI = new GoogleGenerativeAI(apiKey);
    // Gemini 3.0 Flash 사용
    model = genAI.getGenerativeModel({ model: 'gemini-3.0-flash' });
  }
  return model;
}

// 학년별 난이도 및 주제 맵핑
const GRADE_DIFFICULTY_MAP: Record<number, { minTheta: number; maxTheta: number }> = {
  1: { minTheta: -3, maxTheta: -2 },
  2: { minTheta: -2.5, maxTheta: -1.5 },
  3: { minTheta: -2, maxTheta: -1 },
  4: { minTheta: -1.5, maxTheta: -0.5 },
  5: { minTheta: -1, maxTheta: 0 },
  6: { minTheta: -0.5, maxTheta: 0.5 },
  7: { minTheta: 0, maxTheta: 1 },
  8: { minTheta: 0.5, maxTheta: 1.5 },
  9: { minTheta: 1, maxTheta: 2 },
  10: { minTheta: 1.5, maxTheta: 2.5 },
  11: { minTheta: 2, maxTheta: 3 },
  12: { minTheta: 2.5, maxTheta: 3 },
};

// 주제별 프롬프트 생성
function getTopicPrompt(topic: MathTopic, grade: number): string {
  const topicPrompts: Record<MathTopic, (grade: number) => string> = {
    arithmetic: (g) => {
      if (g <= 2) return '한 자리 수의 덧셈과 뺄셈';
      if (g <= 4) return '두 자리 수 이상의 사칙연산';
      return '복잡한 사칙연산과 연산 순서';
    },
    fractions: (g) => {
      if (g <= 4) return '단위분수와 진분수의 이해';
      if (g <= 6) return '분수의 덧셈, 뺄셈, 곱셈, 나눗셈';
      return '복잡한 분수 계산과 분수 방정식';
    },
    decimals: (g) => {
      if (g <= 4) return '소수의 이해와 소수점 자리';
      if (g <= 6) return '소수의 사칙연산';
      return '순환소수와 소수의 응용';
    },
    geometry: (g) => {
      if (g <= 4) return '기본 도형의 특징과 둘레';
      if (g <= 6) return '도형의 넓이와 부피';
      if (g <= 9) return '피타고라스 정리와 도형의 성질';
      return '원, 다각형의 성질과 좌표기하학';
    },
    algebra: (g) => {
      if (g <= 6) return '미지수를 사용한 간단한 식';
      if (g <= 8) return '일차방정식과 연립방정식';
      if (g <= 10) return '이차방정식과 부등식';
      return '고차방정식과 복잡한 대수 문제';
    },
    functions: (g) => {
      if (g <= 8) return '함수의 기본 개념과 그래프';
      if (g <= 10) return '일차함수와 이차함수';
      return '다항함수, 지수함수, 로그함수';
    },
    statistics: (g) => {
      if (g <= 6) return '평균, 중앙값, 최빈값';
      if (g <= 9) return '도수분포표와 상관관계';
      return '확률분포와 통계적 추론';
    },
    probability: (g) => {
      if (g <= 6) return '경우의 수와 간단한 확률';
      if (g <= 9) return '확률의 덧셈과 곱셈 법칙';
      return '조건부확률과 베이즈 정리';
    },
    calculus: () => '미분과 적분의 기초',
    vectors: () => '벡터의 연산과 내적, 외적',
    sequences: (g) => {
      if (g <= 10) return '등차수열과 등비수열';
      return '급수와 수열의 극한';
    },
  };

  return topicPrompts[topic](grade);
}

// 난이도 설명 생성
function getDifficultyDescription(targetB: number): string {
  if (targetB <= -2) return '매우 쉬운';
  if (targetB <= -1) return '쉬운';
  if (targetB <= 0) return '보통 수준의';
  if (targetB <= 1) return '어려운';
  if (targetB <= 2) return '매우 어려운';
  return '최상위 수준의';
}

/**
 * Gemini AI를 사용하여 수학 문제 생성
 */
export async function generateProblem(
  request: GenerateProblemRequest
): Promise<ProblemWithIRT> {
  const { topic, theta, grade, previous_problems = [] } = request;

  // 목표 난이도 계산 (IRT 기반 70% 정답률 목표)
  const targetB = calculateTargetDifficulty(theta, 0.7);

  // IRT 파라미터 생성
  const irt = generateIRTParameters(targetB, grade);

  // 주제 및 난이도 설명
  const topicName = MATH_TOPICS[topic];
  const topicDetail = getTopicPrompt(topic, grade);
  const difficultyDesc = getDifficultyDescription(targetB);

  // 이전 문제 피하기 위한 지시
  const avoidPrevious =
    previous_problems.length > 0
      ? `\n주의: 다음과 같은 유형의 문제는 피해주세요: ${previous_problems.slice(-3).join(', ')}`
      : '';

  // Gemini 프롬프트 생성
  const prompt = `당신은 한국 ${grade}학년 학생을 위한 수학 문제를 만드는 전문가입니다.

요구사항:
- 주제: ${topicName} (${topicDetail})
- 난이도: ${difficultyDesc} (IRT b=${targetB.toFixed(2)})
- 학년: ${grade}학년
${avoidPrevious}

다음 JSON 형식으로 문제를 생성해주세요:

{
  "content": "문제 내용 (한국어로, LaTeX 수식 사용 가능)",
  "latex": "수식이 있다면 LaTeX 형식 (없으면 null)",
  "options": ["보기1", "보기2", "보기3", "보기4"],
  "correct_answer": "정답 (보기 중 하나)",
  "solution": "상세한 풀이 설명 (한국어)",
  "hints": ["힌트1", "힌트2", "힌트3"],
  "subtopic": "세부 주제"
}

주의사항:
1. 문제는 반드시 한국어로 작성
2. 수학 기호는 LaTeX 형식 사용 (예: $x^2$, $\\frac{a}{b}$)
3. 보기는 반드시 4개, 정답은 보기 중 하나
4. 풀이는 단계별로 자세히 설명
5. 힌트는 점진적으로 더 많은 정보 제공
6. 난이도에 맞는 적절한 문제 생성

JSON만 반환해주세요.`;

  try {
    const gemini = getGeminiClient();
    const result = await gemini.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // JSON 파싱 (마크다운 코드 블록 제거)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse Gemini response as JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // 문제 객체 생성
    const problem: ProblemWithIRT = {
      id: generateUUID(),
      content: parsed.content,
      latex: parsed.latex || undefined,
      options: parsed.options,
      correct_answer: parsed.correct_answer,
      solution: parsed.solution,
      hints: parsed.hints || [],
      topic,
      subtopic: parsed.subtopic || topicDetail,
      irt,
      created_at: new Date().toISOString(),
    };

    return problem;
  } catch (error) {
    console.error('Error generating problem with Gemini:', error);

    // 폴백: 기본 문제 반환
    return generateFallbackProblem(topic, grade, irt);
  }
}

/**
 * API 실패 시 폴백 문제 생성
 */
function generateFallbackProblem(
  topic: MathTopic,
  grade: number,
  irt: IRTParameters
): ProblemWithIRT {
  // 기본 문제 풀 (주제별)
  const fallbackProblems: Record<MathTopic, () => Partial<ProblemWithIRT>> = {
    arithmetic: () => {
      const a = Math.floor(Math.random() * 50) + 10;
      const b = Math.floor(Math.random() * 50) + 10;
      const answer = a + b;
      return {
        content: `${a} + ${b} = ?`,
        options: [
          String(answer),
          String(answer + 10),
          String(answer - 10),
          String(answer + 5),
        ],
        correct_answer: String(answer),
        solution: `${a}와 ${b}를 더하면 ${answer}입니다.`,
        hints: ['덧셈을 해보세요', `${a}에 ${b}를 더합니다`, `정답은 ${answer}입니다`],
        subtopic: '덧셈',
      };
    },
    fractions: () => ({
      content: '다음 분수를 기약분수로 나타내시오: $\\frac{6}{8}$',
      latex: '\\frac{6}{8}',
      options: ['$\\frac{3}{4}$', '$\\frac{2}{3}$', '$\\frac{1}{2}$', '$\\frac{4}{5}$'],
      correct_answer: '$\\frac{3}{4}$',
      solution: '6과 8의 최대공약수는 2입니다. 분자와 분모를 2로 나누면 3/4가 됩니다.',
      hints: ['최대공약수를 찾아보세요', '6과 8의 공약수는 2입니다', '분자 분모를 2로 나누세요'],
      subtopic: '기약분수',
    }),
    decimals: () => ({
      content: '0.5 + 0.3 = ?',
      options: ['0.8', '0.7', '0.9', '0.6'],
      correct_answer: '0.8',
      solution: '소수점 이하 숫자를 더합니다. 5 + 3 = 8이므로 0.8입니다.',
      hints: ['소수점 위치를 맞추세요', '5 + 3을 계산하세요', '정답은 0.8입니다'],
      subtopic: '소수의 덧셈',
    }),
    geometry: () => ({
      content: '한 변의 길이가 5cm인 정사각형의 넓이는?',
      options: ['25cm²', '20cm²', '10cm²', '15cm²'],
      correct_answer: '25cm²',
      solution: '정사각형의 넓이 = 한 변의 길이 × 한 변의 길이 = 5 × 5 = 25cm²',
      hints: ['정사각형 넓이 공식을 사용하세요', '변의 길이를 제곱합니다', '5 × 5 = 25'],
      subtopic: '넓이',
    }),
    algebra: () => ({
      content: '방정식 $2x + 4 = 10$의 해를 구하시오.',
      latex: '2x + 4 = 10',
      options: ['3', '4', '2', '5'],
      correct_answer: '3',
      solution: '2x + 4 = 10\n2x = 10 - 4\n2x = 6\nx = 3',
      hints: ['4를 이항하세요', '2x = 6이 됩니다', '양변을 2로 나누세요'],
      subtopic: '일차방정식',
    }),
    functions: () => ({
      content: '$f(x) = 2x + 1$일 때, $f(3)$의 값은?',
      latex: 'f(x) = 2x + 1',
      options: ['7', '6', '8', '5'],
      correct_answer: '7',
      solution: 'f(3) = 2(3) + 1 = 6 + 1 = 7',
      hints: ['x에 3을 대입하세요', '2 × 3 = 6', '6 + 1 = 7'],
      subtopic: '함수값',
    }),
    statistics: () => ({
      content: '2, 4, 6, 8, 10의 평균은?',
      options: ['6', '5', '7', '8'],
      correct_answer: '6',
      solution: '평균 = (2 + 4 + 6 + 8 + 10) ÷ 5 = 30 ÷ 5 = 6',
      hints: ['모든 수를 더하세요', '합은 30입니다', '5로 나누세요'],
      subtopic: '평균',
    }),
    probability: () => ({
      content: '주사위를 한 번 던질 때, 짝수가 나올 확률은?',
      options: ['1/2', '1/3', '2/3', '1/6'],
      correct_answer: '1/2',
      solution: '짝수는 2, 4, 6으로 3개입니다. 전체 경우의 수는 6개이므로 확률은 3/6 = 1/2입니다.',
      hints: ['짝수의 개수를 세세요', '경우의 수는 6입니다', '3/6을 약분하세요'],
      subtopic: '기본 확률',
    }),
    calculus: () => ({
      content: '$f(x) = x^2$의 도함수 $f\'(x)$는?',
      latex: 'f(x) = x^2',
      options: ['2x', 'x', '2', 'x²'],
      correct_answer: '2x',
      solution: '멱함수의 미분 공식: (x^n)\' = nx^(n-1)\n따라서 (x^2)\' = 2x^1 = 2x',
      hints: ['멱함수 미분 공식을 사용하세요', '지수를 앞으로 내립니다', '지수에서 1을 빼세요'],
      subtopic: '미분',
    }),
    vectors: () => ({
      content: '벡터 $\\vec{a} = (2, 3)$과 $\\vec{b} = (4, 1)$의 합 $\\vec{a} + \\vec{b}$는?',
      latex: '\\vec{a} + \\vec{b}',
      options: ['(6, 4)', '(6, 2)', '(8, 4)', '(2, 4)'],
      correct_answer: '(6, 4)',
      solution: '벡터의 덧셈은 각 성분끼리 더합니다.\n(2, 3) + (4, 1) = (2+4, 3+1) = (6, 4)',
      hints: ['x성분끼리 더하세요', 'y성분끼리 더하세요', '(2+4, 3+1)을 계산하세요'],
      subtopic: '벡터 덧셈',
    }),
    sequences: () => ({
      content: '첫째항이 2이고 공차가 3인 등차수열의 5번째 항은?',
      options: ['14', '12', '15', '11'],
      correct_answer: '14',
      solution: '등차수열 공식: a_n = a_1 + (n-1)d\na_5 = 2 + (5-1)×3 = 2 + 12 = 14',
      hints: ['등차수열 공식을 사용하세요', 'n=5를 대입하세요', '2 + 4×3을 계산하세요'],
      subtopic: '등차수열',
    }),
  };

  const fallback = fallbackProblems[topic]();

  return {
    id: generateUUID(),
    content: fallback.content || '문제를 불러오는 중 오류가 발생했습니다.',
    latex: fallback.latex,
    options: fallback.options || ['A', 'B', 'C', 'D'],
    correct_answer: fallback.correct_answer || 'A',
    solution: fallback.solution || '풀이를 불러올 수 없습니다.',
    hints: fallback.hints || ['힌트 없음'],
    topic,
    subtopic: fallback.subtopic || MATH_TOPICS[topic],
    irt,
    created_at: new Date().toISOString(),
  };
}

/**
 * 힌트 요청 처리
 */
export async function generateHint(
  problem: ProblemWithIRT,
  hintIndex: number
): Promise<string> {
  // 이미 생성된 힌트가 있으면 반환
  if (problem.hints && problem.hints[hintIndex]) {
    return problem.hints[hintIndex];
  }

  // 새로운 힌트 생성
  const prompt = `다음 수학 문제에 대한 힌트를 생성해주세요.

문제: ${problem.content}
정답: ${problem.correct_answer}
요청된 힌트 번호: ${hintIndex + 1}

힌트 ${hintIndex + 1}번째는 ${hintIndex === 0 ? '가장 간접적인' : hintIndex === 1 ? '중간 정도의' : '직접적인'} 힌트여야 합니다.

힌트만 반환해주세요 (JSON 형식 아님, 텍스트만):`;

  try {
    const gemini = getGeminiClient();
    const result = await gemini.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error generating hint:', error);
    return `힌트 ${hintIndex + 1}: 문제를 천천히 다시 읽어보세요.`;
  }
}

/**
 * 상세 풀이 설명 생성
 */
export async function generateDetailedSolution(
  problem: ProblemWithIRT
): Promise<string> {
  const prompt = `다음 수학 문제에 대한 상세한 풀이를 한국어로 작성해주세요.

문제: ${problem.content}
${problem.latex ? `수식: ${problem.latex}` : ''}
정답: ${problem.correct_answer}

풀이 요구사항:
1. 단계별로 자세히 설명
2. 사용되는 개념과 공식 설명
3. 왜 이런 방법을 사용하는지 이유 설명
4. LaTeX 수식 사용 가능
5. 학생이 이해하기 쉬운 언어로 설명

상세 풀이:`;

  try {
    const gemini = getGeminiClient();
    const result = await gemini.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error generating detailed solution:', error);
    return problem.solution;
  }
}

/**
 * 문제 유형 분석
 */
export async function analyzeProblemType(content: string): Promise<{
  topic: MathTopic;
  subtopic: string;
  concepts: string[];
}> {
  const prompt = `다음 수학 문제를 분석해주세요:

"${content}"

다음 JSON 형식으로 응답해주세요:
{
  "topic": "arithmetic|fractions|decimals|geometry|algebra|functions|statistics|probability|calculus|vectors|sequences 중 하나",
  "subtopic": "세부 주제",
  "concepts": ["사용된 개념 목록"]
}`;

  try {
    const gemini = getGeminiClient();
    const result = await gemini.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Error analyzing problem:', error);
  }

  return {
    topic: 'arithmetic',
    subtopic: '기본',
    concepts: [],
  };
}

// ============================================================
// 몰입 학습 문제 생성 (시간 기반)
// ============================================================

export type ImmersionDifficulty = '5min' | '10min' | '30min' | '1hour' | '1day' | '3days' | '7days' | '1month';

interface ImmersionProblemConfig {
  duration: string;
  complexity: string;
  steps: number;
  description: string;
}

const IMMERSION_CONFIG: Record<ImmersionDifficulty, ImmersionProblemConfig> = {
  '5min': {
    duration: '5분',
    complexity: '기본적인 개념 적용',
    steps: 2,
    description: '짧은 시간 내에 풀 수 있는 기초 문제',
  },
  '10min': {
    duration: '10분',
    complexity: '여러 개념의 간단한 결합',
    steps: 3,
    description: '약간의 사고력이 필요한 응용 문제',
  },
  '30min': {
    duration: '30분',
    complexity: '복합적인 문제 해결',
    steps: 5,
    description: '여러 단계의 추론이 필요한 심화 문제',
  },
  '1hour': {
    duration: '1시간',
    complexity: '고도의 논리적 사고 필요',
    steps: 8,
    description: '깊은 분석과 창의적 접근이 필요한 도전 문제',
  },
  '1day': {
    duration: '하루',
    complexity: '연구 수준의 탐구',
    steps: 15,
    description: '장시간 몰두해야 하는 탐구형 문제',
  },
  '3days': {
    duration: '3일',
    complexity: '프로젝트형 문제',
    steps: 25,
    description: '여러 개념을 통합하는 프로젝트 문제',
  },
  '7days': {
    duration: '일주일',
    complexity: '심층 연구 문제',
    steps: 40,
    description: '수학적 증명이나 일반화가 필요한 연구 문제',
  },
  '1month': {
    duration: '한 달',
    complexity: '올림피아드/경시대회 수준',
    steps: 60,
    description: '수학 올림피아드 수준의 극도로 어려운 문제',
  },
};

/**
 * 몰입 학습용 문제 생성 (시간 기반 난이도)
 */
export async function generateImmersionProblem(
  grade: number,
  theta: number,
  difficulty: ImmersionDifficulty,
  preferredTopic?: MathTopic
): Promise<{
  content: string;
  hints: string[];
  solution: string;
  topic: string;
  estimatedTime: string;
}> {
  const config = IMMERSION_CONFIG[difficulty];

  // 학년에 맞는 주제 선택
  const topicsByGrade: Record<number, string[]> = {
    1: ['덧셈과 뺄셈', '수 세기', '기본 도형'],
    2: ['구구단', '시간과 길이', '덧셈과 뺄셈 응용'],
    3: ['나눗셈', '분수 기초', '평면도형'],
    4: ['큰 수의 연산', '분수와 소수', '각도'],
    5: ['약수와 배수', '분수 연산', '도형의 넓이'],
    6: ['비와 비율', '원의 넓이', '입체도형'],
    7: ['정수와 유리수', '일차방정식', '기본 도형의 성질'],
    8: ['일차함수', '연립방정식', '삼각형의 성질'],
    9: ['이차방정식', '피타고라스 정리', '통계'],
    10: ['집합과 명제', '이차함수', '삼각비'],
    11: ['지수와 로그', '삼각함수', '수열'],
    12: ['미분', '적분', '확률과 통계'],
  };

  const topics = topicsByGrade[grade] || topicsByGrade[7];
  const selectedTopic = preferredTopic ? MATH_TOPICS[preferredTopic] : topics[Math.floor(Math.random() * topics.length)];

  const prompt = `당신은 한국 ${grade}학년 학생을 위한 **몰입 학습용** 수학 문제를 만드는 전문가입니다.

## 몰입 학습이란?
- 학생이 한 문제에 ${config.duration} 정도 깊이 몰두할 수 있는 문제
- 단순 계산이 아닌, 사고력과 창의력을 요구하는 문제
- 여러 단계의 추론과 문제 해결 전략이 필요한 문제

## 요구사항:
- 학년: ${grade}학년
- 주제: ${selectedTopic}
- 예상 풀이 시간: ${config.duration}
- 복잡도: ${config.complexity}
- 풀이 단계: 약 ${config.steps}단계
- 특징: ${config.description}

## 중요:
- 단순한 사칙연산 문제가 아닌 **사고력을 요하는 문제**를 만들어주세요
- 학생이 ${config.duration} 동안 고민하고 탐구할 수 있어야 합니다
- ${grade}학년 수준에 맞되, 도전적이어야 합니다
- 실생활 연계나 창의적 상황 설정을 권장합니다

다음 JSON 형식으로 문제를 생성해주세요:

{
  "content": "문제 내용 (상세하게, LaTeX 수식 사용 가능. 상황 설정과 조건을 명확히)",
  "hints": ["힌트1 (방향 제시)", "힌트2 (핵심 개념)", "힌트3 (풀이 접근법)", "힌트4 (중간 단계)", "힌트5 (거의 답에 가까운 힌트)"],
  "solution": "상세한 단계별 풀이 (${config.steps}단계 이상으로 자세히)",
  "topic": "주제명"
}

JSON만 반환해주세요.`;

  try {
    const gemini = getGeminiClient();
    const result = await gemini.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      content: parsed.content,
      hints: parsed.hints || [],
      solution: parsed.solution,
      topic: parsed.topic || selectedTopic,
      estimatedTime: config.duration,
    };
  } catch (error) {
    console.error('Error generating immersion problem:', error);

    // 폴백 문제
    return generateFallbackImmersionProblem(grade, difficulty, selectedTopic);
  }
}

function generateFallbackImmersionProblem(
  grade: number,
  difficulty: ImmersionDifficulty,
  topic: string
): {
  content: string;
  hints: string[];
  solution: string;
  topic: string;
  estimatedTime: string;
} {
  const config = IMMERSION_CONFIG[difficulty];

  // 학년별 폴백 문제
  const problems: Record<string, { content: string; hints: string[]; solution: string }> = {
    '5min': {
      content: `철수는 사과 12개를 3명의 친구에게 똑같이 나누어 주려고 합니다. 그런데 2개가 상해서 버려야 합니다. 각 친구가 받을 수 있는 사과는 몇 개일까요? 그리고 남는 사과는 몇 개일까요?`,
      hints: ['먼저 상한 사과를 빼세요', '남은 사과를 3으로 나누세요', '나머지를 구하세요'],
      solution: '12 - 2 = 10개의 사과가 남습니다. 10 ÷ 3 = 3 나머지 1이므로, 각 친구는 3개씩 받고 1개가 남습니다.',
    },
    '10min': {
      content: `직사각형 모양의 정원이 있습니다. 가로가 세로보다 4m 더 깁니다. 정원 둘레에 울타리를 치는데 총 32m의 울타리가 필요했습니다. 이 정원의 가로와 세로의 길이를 각각 구하고, 정원의 넓이를 구하세요.`,
      hints: ['세로를 x라 하면 가로는?', '둘레 공식: 2(가로+세로)', '방정식을 세우세요', '넓이 = 가로 × 세로'],
      solution: '세로를 x라 하면 가로는 x+4입니다. 둘레: 2(x + x+4) = 32, 4x + 8 = 32, x = 6. 세로 6m, 가로 10m, 넓이 60m²',
    },
    '30min': {
      content: `어떤 수의 제곱에서 그 수를 뺀 값이 72입니다. 이 수를 구하세요. 또한, 이 문제를 풀 수 있는 모든 방법(인수분해, 근의 공식 등)을 사용하여 풀이하고, 왜 음수 해도 답이 될 수 있는지 또는 없는지 설명하세요.`,
      hints: ['x² - x = 72로 방정식을 세우세요', 'x² - x - 72 = 0 형태로 정리', '인수분해 또는 근의 공식 사용', '두 해 중 어떤 것이 적절한지 판단'],
      solution: 'x² - x - 72 = 0, (x-9)(x+8) = 0, x = 9 또는 x = -8. 문제에서 "어떤 수"라고만 했으므로 -8도 가능. -8의 제곱 64에서 -8을 빼면 72.',
    },
  };

  const fallback = problems[difficulty] || problems['5min'];

  return {
    content: fallback.content,
    hints: fallback.hints,
    solution: fallback.solution,
    topic,
    estimatedTime: config.duration,
  };
}
