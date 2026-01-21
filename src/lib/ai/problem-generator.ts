// ============================================================
// MathFlow - Gemini AI Problem Generator
// ============================================================
// Google Gemini API를 사용한 적응형 수학 문제 생성
// 한국 교육과정 성취기준 DB 기반
// ============================================================

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import {
  MathTopic,
  ProblemWithIRT,
  IRTParameters,
  GenerateProblemRequest,
  MATH_TOPICS,
} from '@/types';
import { generateIRTParameters, calculateTargetDifficulty } from '@/lib/irt';
import { generateUUID } from '@/lib/utils';
import {
  CURRICULUM_DB,
  getAllStandards,
  getNotIncluded,
  CurriculumStandard,
  GRADE_DIFFICULTY_RANGE,
} from '@/data/curriculum-standards';

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
    // Gemini 2.0 Flash 사용 (안정적인 최신 버전)
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }
  return model;
}

// 학년에 맞는 성취기준 랜덤 선택
function selectRandomStandard(grade: number): CurriculumStandard | null {
  const standards = getAllStandards(grade);
  if (standards.length === 0) return null;
  return standards[Math.floor(Math.random() * standards.length)];
}

// 주제에 맞는 성취기준 선택
function selectStandardByTopic(grade: number, topic: MathTopic): CurriculumStandard | null {
  const curriculum = CURRICULUM_DB[grade];
  if (!curriculum) return null;

  // 주제와 영역 매핑
  const topicDomainMap: Record<MathTopic, string[]> = {
    arithmetic: ['수와 연산', '정수와 유리수', '다항식'],
    fractions: ['수와 연산', '분수'],
    decimals: ['수와 연산', '소수'],
    geometry: ['도형', '도형의 닮음', '기하'],
    algebra: ['문자와 식', '방정식과 부등식', '변화와 관계'],
    functions: ['함수', '좌표와 그래프'],
    statistics: ['통계', '자료와 가능성'],
    probability: ['확률', '자료와 가능성'],
    calculus: ['미분', '적분', '미적분 심화'],
    vectors: ['기하', '벡터'],
    sequences: ['수열'],
  };

  const relevantDomains = topicDomainMap[topic] || [];
  const allStandards: CurriculumStandard[] = [];

  // 1학기와 2학기 모두에서 관련 영역의 성취기준 수집
  for (const domainName of Object.keys(curriculum.semester1.domains)) {
    if (relevantDomains.some(d => domainName.includes(d) || d.includes(domainName))) {
      allStandards.push(...curriculum.semester1.domains[domainName].standards);
    }
  }
  for (const domainName of Object.keys(curriculum.semester2.domains)) {
    if (relevantDomains.some(d => domainName.includes(d) || d.includes(domainName))) {
      allStandards.push(...curriculum.semester2.domains[domainName].standards);
    }
  }

  if (allStandards.length === 0) {
    // 관련 영역이 없으면 랜덤 선택
    return selectRandomStandard(grade);
  }

  return allStandards[Math.floor(Math.random() * allStandards.length)];
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

// 학년 라벨 생성
function getGradeLabel(grade: number): string {
  if (grade <= 6) return `초등학교 ${grade}학년`;
  if (grade <= 9) return `중학교 ${grade - 6}학년`;
  return `고등학교 ${grade - 9}학년`;
}

/**
 * Gemini AI를 사용하여 수학 문제 생성 (성취기준 기반)
 */
export async function generateProblem(
  request: GenerateProblemRequest
): Promise<ProblemWithIRT> {
  const { topic, theta, grade, previous_problems = [] } = request;

  // 목표 난이도 계산 (IRT 기반 70% 정답률 목표)
  const targetB = calculateTargetDifficulty(theta, 0.7);

  // IRT 파라미터 생성
  const irt = generateIRTParameters(targetB, grade);

  // 성취기준 선택
  const standard = selectStandardByTopic(grade, topic);
  const notIncluded = getNotIncluded(grade);

  // 학년 라벨
  const gradeLabel = getGradeLabel(grade);
  const difficultyDesc = getDifficultyDescription(targetB);

  // 이전 문제 피하기 위한 지시
  const avoidPrevious =
    previous_problems.length > 0
      ? `\n\n⚠️ 주의: 다음과 같은 유형의 문제는 피해주세요: ${previous_problems.slice(-3).join(', ')}`
      : '';

  // Gemini 프롬프트 생성 (성취기준 기반)
  const prompt = `당신은 한국 ${gradeLabel} 학생을 위한 수학 문제를 만드는 교육 전문가입니다.

## 📚 한국 교육과정 성취기준 정보

${standard ? `
### 적용할 성취기준:
- 코드: ${standard.code}
- 내용: ${standard.description}
- 핵심 키워드: ${standard.keywords.join(', ')}
- 예시 문제 유형: ${standard.examples.join(' / ')}
` : ''}

### ❌ 이 학년에서 다루지 않는 내용 (절대 포함 금지):
${notIncluded.map(item => `- ${item}`).join('\n')}

## 📋 문제 생성 요구사항:
- 학년: ${gradeLabel}
- 주제: ${MATH_TOPICS[topic]}
- 난이도: ${difficultyDesc} (IRT b=${targetB.toFixed(2)})
${avoidPrevious}

## ⚠️ 중요 규칙:
1. **반드시 위 성취기준 범위 내에서만 문제를 출제**하세요
2. **이 학년에서 다루지 않는 내용은 절대 사용하지 마세요**
3. ${grade}학년 학생이 배운 개념으로만 풀 수 있어야 합니다
4. 문제는 한국어로 작성하고, 수식은 LaTeX 형식 사용
5. 실생활 연계 문제를 권장합니다

다음 JSON 형식으로 문제를 생성해주세요:

{
  "content": "문제 내용 (한국어, LaTeX 수식 가능)",
  "latex": "수식이 있다면 LaTeX 형식 (없으면 null)",
  "options": ["보기1", "보기2", "보기3", "보기4"],
  "correct_answer": "정답 (보기 중 하나와 정확히 일치)",
  "solution": "상세한 풀이 설명",
  "hints": ["힌트1", "힌트2", "힌트3"],
  "subtopic": "세부 주제 (성취기준 기반)"
}

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
      subtopic: parsed.subtopic || (standard?.description || MATH_TOPICS[topic]),
      irt,
      created_at: new Date().toISOString(),
    };

    return problem;
  } catch (error) {
    console.error('Error generating problem with Gemini:', error);

    // 폴백: 성취기준 기반 기본 문제 반환
    return generateFallbackProblem(topic, grade, irt, standard);
  }
}

/**
 * API 실패 시 폴백 문제 생성 (성취기준 기반)
 */
function generateFallbackProblem(
  topic: MathTopic,
  grade: number,
  irt: IRTParameters,
  standard: CurriculumStandard | null
): ProblemWithIRT {
  // 학년별 폴백 문제
  const gradeProblems: Record<number, () => Partial<ProblemWithIRT>> = {
    // 초등학교 1학년
    1: () => ({
      content: '사과가 5개 있습니다. 엄마가 3개를 더 주셨습니다. 사과는 모두 몇 개인가요?',
      options: ['7개', '8개', '6개', '9개'],
      correct_answer: '8개',
      solution: '5 + 3 = 8이므로 사과는 모두 8개입니다.',
      hints: ['5에 3을 더하세요', '손가락으로 세어보세요', '정답은 8개입니다'],
      subtopic: '한 자리 수의 덧셈',
    }),
    // 초등학교 2학년
    2: () => ({
      content: '구구단 7단에서 7 × 6의 값은 얼마인가요?',
      options: ['42', '48', '36', '49'],
      correct_answer: '42',
      solution: '7 × 6 = 42입니다. 7을 6번 더하면 7 + 7 + 7 + 7 + 7 + 7 = 42입니다.',
      hints: ['7을 6번 더해보세요', '7 × 5 = 35에 7을 더하세요', '정답은 42입니다'],
      subtopic: '구구단',
    }),
    // 초등학교 3학년
    3: () => ({
      content: '456 + 278을 계산하세요.',
      options: ['734', '724', '744', '714'],
      correct_answer: '734',
      solution: '일의 자리: 6 + 8 = 14 (4를 쓰고 1 받아올림)\n십의 자리: 5 + 7 + 1 = 13 (3을 쓰고 1 받아올림)\n백의 자리: 4 + 2 + 1 = 7\n따라서 734입니다.',
      hints: ['일의 자리부터 계산하세요', '받아올림을 잊지 마세요', '각 자리수를 더하세요'],
      subtopic: '세 자리 수의 덧셈',
    }),
    // 초등학교 4학년
    4: () => ({
      content: '삼각형의 세 각의 크기가 각각 50°, 70°, □°입니다. □에 알맞은 수를 구하세요.',
      options: ['60', '50', '70', '80'],
      correct_answer: '60',
      solution: '삼각형의 세 각의 합은 180°입니다.\n50° + 70° + □° = 180°\n□° = 180° - 50° - 70° = 60°',
      hints: ['삼각형의 세 각의 합은 180°입니다', '50 + 70 = 120입니다', '180 - 120을 계산하세요'],
      subtopic: '삼각형의 내각의 합',
    }),
    // 초등학교 5학년
    5: () => ({
      content: '밑변이 12cm, 높이가 8cm인 삼각형의 넓이를 구하세요.',
      options: ['48cm²', '96cm²', '20cm²', '24cm²'],
      correct_answer: '48cm²',
      solution: '삼각형의 넓이 = (밑변 × 높이) ÷ 2\n= (12 × 8) ÷ 2\n= 96 ÷ 2\n= 48cm²',
      hints: ['삼각형 넓이 공식을 사용하세요', '밑변 × 높이를 먼저 계산하세요', '그 결과를 2로 나누세요'],
      subtopic: '삼각형의 넓이',
    }),
    // 초등학교 6학년
    6: () => ({
      content: '어떤 물건의 원가가 20,000원입니다. 25%의 이익을 붙여 팔면 판매 가격은 얼마인가요?',
      options: ['25,000원', '24,000원', '22,500원', '27,500원'],
      correct_answer: '25,000원',
      solution: '이익 = 원가 × 이익률 = 20,000 × 0.25 = 5,000원\n판매 가격 = 원가 + 이익 = 20,000 + 5,000 = 25,000원',
      hints: ['25%를 소수로 바꾸면 0.25입니다', '원가에 이익률을 곱해 이익을 구하세요', '원가에 이익을 더하세요'],
      subtopic: '비율과 백분율',
    }),
    // 중학교 1학년
    7: () => ({
      content: '방정식 $3x - 7 = 14$를 풀어 $x$의 값을 구하세요.',
      latex: '3x - 7 = 14',
      options: ['7', '8', '6', '9'],
      correct_answer: '7',
      solution: '3x - 7 = 14\n3x = 14 + 7 (양변에 7을 더함)\n3x = 21\nx = 7 (양변을 3으로 나눔)',
      hints: ['먼저 -7을 이항하세요', '3x = 21이 됩니다', '양변을 3으로 나누세요'],
      subtopic: '일차방정식',
    }),
    // 중학교 2학년
    8: () => ({
      content: '연립방정식 $\\begin{cases} x + y = 7 \\\\ 2x - y = 5 \\end{cases}$를 풀어 $x$와 $y$의 값을 구하세요.',
      latex: '\\begin{cases} x + y = 7 \\\\ 2x - y = 5 \\end{cases}',
      options: ['x = 4, y = 3', 'x = 3, y = 4', 'x = 5, y = 2', 'x = 2, y = 5'],
      correct_answer: 'x = 4, y = 3',
      solution: '두 식을 더하면: x + y + 2x - y = 7 + 5\n3x = 12, x = 4\n첫 번째 식에 대입: 4 + y = 7, y = 3',
      hints: ['가감법을 사용하세요', '두 식을 더하면 y가 소거됩니다', 'x를 구한 후 대입하세요'],
      subtopic: '연립방정식',
    }),
    // 중학교 3학년
    9: () => ({
      content: '이차방정식 $x^2 - 5x + 6 = 0$의 두 근을 구하세요.',
      latex: 'x^2 - 5x + 6 = 0',
      options: ['x = 2 또는 x = 3', 'x = 1 또는 x = 6', 'x = -2 또는 x = -3', 'x = 2 또는 x = -3'],
      correct_answer: 'x = 2 또는 x = 3',
      solution: 'x² - 5x + 6 = 0\n(x - 2)(x - 3) = 0 (인수분해)\nx - 2 = 0 또는 x - 3 = 0\nx = 2 또는 x = 3',
      hints: ['인수분해를 시도하세요', '합이 5이고 곱이 6인 두 수를 찾으세요', '(x - 2)(x - 3) = 0'],
      subtopic: '이차방정식의 인수분해',
    }),
    // 고등학교 1학년
    10: () => ({
      content: '복소수 $(2 + 3i)(1 - 2i)$를 계산하세요. (단, $i^2 = -1$)',
      latex: '(2 + 3i)(1 - 2i)',
      options: ['8 - i', '8 + i', '-4 - i', '4 + 7i'],
      correct_answer: '8 - i',
      solution: '(2 + 3i)(1 - 2i)\n= 2(1) + 2(-2i) + 3i(1) + 3i(-2i)\n= 2 - 4i + 3i - 6i²\n= 2 - i - 6(-1)\n= 2 - i + 6\n= 8 - i',
      hints: ['분배법칙을 사용하세요', 'i² = -1임을 기억하세요', '실수부와 허수부를 정리하세요'],
      subtopic: '복소수의 연산',
    }),
    // 고등학교 2학년
    11: () => ({
      content: '$\\log_2 32$의 값을 구하세요.',
      latex: '\\log_2 32',
      options: ['5', '4', '6', '3'],
      correct_answer: '5',
      solution: 'log₂ 32 = x라 하면\n2^x = 32\n32 = 2^5 이므로\nx = 5',
      hints: ['로그의 정의를 사용하세요', '32를 2의 거듭제곱으로 나타내세요', '2^5 = 32입니다'],
      subtopic: '로그',
    }),
    // 고등학교 3학년
    12: () => ({
      content: '$f(x) = x^3 - 3x^2 + 2$의 도함수 $f\'(x)$를 구하세요.',
      latex: 'f(x) = x^3 - 3x^2 + 2',
      options: ['$3x^2 - 6x$', '$3x^2 - 6x + 2$', '$x^2 - 6x$', '$3x^2 - 3x$'],
      correct_answer: '$3x^2 - 6x$',
      solution: 'f(x) = x³ - 3x² + 2\nf\'(x) = 3x² - 6x (상수항 2의 도함수는 0)\n\n미분 공식: (xⁿ)\' = nxⁿ⁻¹',
      hints: ['각 항을 미분하세요', '(x³)\' = 3x²', '상수의 미분은 0입니다'],
      subtopic: '다항함수의 미분',
    }),
  };

  const fallback = gradeProblems[grade] ? gradeProblems[grade]() : gradeProblems[6]();

  return {
    id: generateUUID(),
    content: fallback.content || '문제를 불러오는 중 오류가 발생했습니다.',
    latex: fallback.latex,
    options: fallback.options || ['A', 'B', 'C', 'D'],
    correct_answer: fallback.correct_answer || 'A',
    solution: fallback.solution || '풀이를 불러올 수 없습니다.',
    hints: fallback.hints || ['힌트 없음'],
    topic,
    subtopic: fallback.subtopic || (standard?.description || MATH_TOPICS[topic]),
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

// ============================================================
// 몰입 학습 문제 생성 (시간 기반, 성취기준 기반)
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
 * 몰입 학습용 문제 생성 (시간 기반 난이도, 성취기준 기반)
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
  const gradeLabel = getGradeLabel(grade);

  // 성취기준에서 주제 선택
  const standard = preferredTopic
    ? selectStandardByTopic(grade, preferredTopic)
    : selectRandomStandard(grade);

  const notIncluded = getNotIncluded(grade);

  // 학년별 성취기준 기반 주제 목록
  const curriculum = CURRICULUM_DB[grade];
  let topicsList = '';
  if (curriculum) {
    const allDomains = [
      ...Object.keys(curriculum.semester1.domains),
      ...Object.keys(curriculum.semester2.domains),
    ];
    topicsList = allDomains.join(', ');
  }

  const prompt = `당신은 한국 ${gradeLabel} 학생을 위한 **몰입 학습용** 수학 문제를 만드는 교육 전문가입니다.

## 📚 한국 교육과정 성취기준 정보

### 이 학년에서 배우는 영역:
${topicsList}

${standard ? `
### 적용할 성취기준 (참고):
- 코드: ${standard.code}
- 내용: ${standard.description}
- 핵심 키워드: ${standard.keywords.join(', ')}
` : ''}

### ❌ 이 학년에서 다루지 않는 내용 (절대 포함 금지):
${notIncluded.map(item => `- ${item}`).join('\n')}

## 🎯 몰입 학습이란?
- 학생이 한 문제에 ${config.duration} 정도 깊이 몰두할 수 있는 문제
- 단순 계산이 아닌, **사고력과 창의력**을 요구하는 문제
- 여러 단계의 추론과 문제 해결 전략이 필요한 문제

## 📋 요구사항:
- 학년: ${gradeLabel}
- 예상 풀이 시간: ${config.duration}
- 복잡도: ${config.complexity}
- 풀이 단계: 약 ${config.steps}단계
- 특징: ${config.description}

## ⚠️ 중요 규칙:
1. **반드시 ${gradeLabel} 교육과정 범위 내에서만 출제**하세요
2. **배우지 않은 개념(함수 f(x), 방정식 등)은 절대 사용 금지**
3. 학생이 ${config.duration} 동안 고민하고 탐구할 수 있어야 합니다
4. 실생활 연계나 창의적 상황 설정을 권장합니다
5. ${gradeLabel} 수준에서 도전적이되 불가능하지 않은 문제

다음 JSON 형식으로 문제를 생성해주세요:

{
  "content": "문제 내용 (상세하게, LaTeX 수식 사용 가능. 상황 설정과 조건을 명확히)",
  "hints": ["힌트1 (방향 제시)", "힌트2 (핵심 개념)", "힌트3 (풀이 접근법)", "힌트4 (중간 단계)", "힌트5 (거의 답에 가까운 힌트)"],
  "solution": "상세한 단계별 풀이 (${config.steps}단계 이상으로 자세히)",
  "topic": "주제명 (성취기준 기반)"
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
      topic: parsed.topic || standard?.description || '수학',
      estimatedTime: config.duration,
    };
  } catch (error) {
    console.error('Error generating immersion problem:', error);

    // 폴백 문제
    return generateFallbackImmersionProblem(grade, difficulty, standard?.description || '수학');
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

  // 학년별 폴백 문제 (성취기준 기반)
  const gradeProblems: Record<number, Record<string, { content: string; hints: string[]; solution: string }>> = {
    1: {
      '5min': {
        content: '바구니에 사과가 8개 있습니다. 동생이 3개를 먹고, 엄마가 2개를 더 넣어주셨습니다. 바구니에 남은 사과는 몇 개인가요?',
        hints: ['먼저 동생이 먹은 것을 빼세요', '8 - 3 = 5입니다', '그 다음 엄마가 넣어준 것을 더하세요'],
        solution: '8 - 3 = 5 (동생이 먹은 후)\n5 + 2 = 7 (엄마가 넣어준 후)\n답: 7개',
      },
    },
    6: {
      '5min': {
        content: '어떤 물건의 원래 가격이 8,000원입니다. 20% 할인된 가격은 얼마인가요?',
        hints: ['20%를 분수나 소수로 바꿔보세요', '할인 금액 = 원래 가격 × 할인율', '원래 가격에서 할인 금액을 빼세요'],
        solution: '할인 금액 = 8,000 × 0.2 = 1,600원\n할인된 가격 = 8,000 - 1,600 = 6,400원',
      },
      '10min': {
        content: '직사각형 모양의 정원이 있습니다. 가로가 세로보다 4m 더 깁니다. 정원 둘레에 울타리를 치는데 총 32m의 울타리가 필요했습니다. 이 정원의 넓이를 구하세요.',
        hints: ['세로를 □라 하면 가로는 □+4입니다', '둘레 = 2 × (가로 + 세로)', '□ + □ + 4 = 16입니다', '넓이 = 가로 × 세로'],
        solution: '둘레 = 2(가로 + 세로) = 32\n가로 + 세로 = 16\n세로를 □라 하면: □ + (□+4) = 16\n2□ = 12, □ = 6\n세로 = 6m, 가로 = 10m\n넓이 = 6 × 10 = 60m²',
      },
      '30min': {
        content: '철수네 반 학생 30명이 수학, 영어 시험을 봤습니다. 수학을 80점 이상 받은 학생은 18명, 영어를 80점 이상 받은 학생은 15명, 두 과목 모두 80점 이상인 학생은 10명입니다. 두 과목 모두 80점 미만인 학생은 몇 명인가요? 벤 다이어그램을 그려서 설명하세요.',
        hints: ['벤 다이어그램을 그려보세요', '수학만 80점 이상 = 18 - 10', '영어만 80점 이상 = 15 - 10', '전체에서 빼세요'],
        solution: '수학만 80점 이상: 18 - 10 = 8명\n영어만 80점 이상: 15 - 10 = 5명\n둘 다 80점 이상: 10명\n80점 이상인 학생 수: 8 + 5 + 10 = 23명\n둘 다 80점 미만: 30 - 23 = 7명',
      },
    },
    7: {
      '5min': {
        content: '일차방정식 $3x + 5 = 2x - 7$을 풀어 $x$의 값을 구하세요.',
        hints: ['x가 있는 항을 한쪽으로 모으세요', '상수항을 다른 쪽으로 모으세요', 'x의 계수로 나누세요'],
        solution: '3x + 5 = 2x - 7\n3x - 2x = -7 - 5\nx = -12',
      },
      '10min': {
        content: '좌표평면에서 두 점 A(2, 3)과 B(5, 7) 사이의 거리를 구하세요.',
        hints: ['두 점 사이의 거리 공식을 사용하세요', 'x좌표의 차와 y좌표의 차를 각각 구하세요', '피타고라스 정리를 적용하세요'],
        solution: 'x좌표의 차: 5 - 2 = 3\ny좌표의 차: 7 - 3 = 4\n거리 = √(3² + 4²) = √(9 + 16) = √25 = 5',
      },
    },
    9: {
      '30min': {
        content: '이차방정식 $x^2 - 6x + k = 0$이 중근을 가질 때, 상수 $k$의 값과 그 중근을 구하세요. 또한 이차방정식이 중근을 가지는 조건을 설명하세요.',
        hints: ['중근 조건: 판별식 D = 0', 'D = b² - 4ac', 'a = 1, b = -6, c = k를 대입하세요', '중근은 x = -b/2a'],
        solution: '판별식 D = b² - 4ac = (-6)² - 4(1)(k) = 36 - 4k\n중근 조건: D = 0\n36 - 4k = 0, k = 9\n중근: x = -b/2a = 6/2 = 3\n\n이차방정식이 중근을 가지는 조건은 판별식 D = b² - 4ac = 0일 때입니다.',
      },
    },
  };

  const gradeFallbacks = gradeProblems[grade] || gradeProblems[6];
  const fallback = gradeFallbacks[difficulty] || gradeFallbacks['5min'] || {
    content: '문제를 불러오는 중입니다.',
    hints: ['힌트를 불러오는 중입니다'],
    solution: '풀이를 불러오는 중입니다.',
  };

  return {
    content: fallback.content,
    hints: fallback.hints,
    solution: fallback.solution,
    topic,
    estimatedTime: config.duration,
  };
}
