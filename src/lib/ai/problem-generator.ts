// ============================================================
// MathFlow - Expert-Level Problem Generator
// ============================================================
// 전문 수학 문제 출제 워크플로우 기반 AI 문제 생성기
//
// 참조 모델:
// - 한국교육과정평가원 수능/모의고사 출제 프로세스
// - EBS 연계 교재 문항 개발 가이드라인
// - 블룸의 신교육목표분류학 (Revised Bloom's Taxonomy)
// - 수학적 역량 평가 체계 (PISA 수학 프레임워크)
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
} from '@/data/curriculum-standards';

// ============================================================
// 전문가 출제 워크플로우 상수 정의
// ============================================================

/**
 * 블룸의 신교육목표분류학 기반 인지 수준
 * 수학 문제 출제 시 목표로 하는 인지 과정 정의
 */
const COGNITIVE_LEVELS = {
  remember: { level: 1, label: '기억하기', description: '개념, 공식, 정의 회상' },
  understand: { level: 2, label: '이해하기', description: '개념의 의미 파악, 변환, 해석' },
  apply: { level: 3, label: '적용하기', description: '알고리즘, 절차 실행' },
  analyze: { level: 4, label: '분석하기', description: '구조 파악, 관계 규명' },
  evaluate: { level: 5, label: '평가하기', description: '기준에 따른 판단' },
  create: { level: 6, label: '창안하기', description: '새로운 해법, 증명 생성' },
} as const;

/**
 * PISA 수학 역량 프레임워크
 */
const MATH_COMPETENCIES = {
  reasoning: '수학적 추론',
  modeling: '수학적 모델링',
  problem_solving: '문제 해결',
  representation: '수학적 표현',
  communication: '수학적 의사소통',
  tools: '수학적 도구 사용',
} as const;

/**
 * 문제 유형 분류 (수능/모의고사 기준)
 */
const PROBLEM_TYPES = {
  // 객관식 유형
  concept: { label: '개념 확인', difficulty_range: [-2, 0] },
  calculation: { label: '계산력', difficulty_range: [-1, 1] },
  reasoning: { label: '추론', difficulty_range: [0, 2] },
  application: { label: '응용', difficulty_range: [0, 2] },
  complex: { label: '복합', difficulty_range: [1, 3] },
  // 서술형 유형
  proof: { label: '증명', difficulty_range: [1, 3] },
  modeling: { label: '모델링', difficulty_range: [1, 3] },
} as const;

/**
 * 오답 유형 분류 (오답 선지 설계용)
 */
const DISTRACTOR_TYPES = {
  sign_error: '부호 오류',
  calculation_error: '계산 실수',
  concept_confusion: '개념 혼동',
  partial_solution: '불완전한 풀이',
  common_misconception: '일반적 오개념',
  careless_reading: '문제 독해 실수',
} as const;

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
 * 전문가 출제 워크플로우 기반 문제 생성
 *
 * 워크플로우:
 * 1. 평가 목표 설정 (성취기준 + 인지 수준)
 * 2. 문제 유형 결정 (난이도 기반)
 * 3. 문항 설계 (상황, 조건, 발문)
 * 4. 오답 선지 설계 (오류 유형 기반)
 * 5. 채점 기준 및 풀이 작성
 * 6. 검토 및 수정
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

  // 학년 라벨 및 난이도 설명
  const gradeLabel = getGradeLabel(grade);
  const difficultyDesc = getDifficultyDescription(targetB);

  // 인지 수준 결정 (난이도에 따라)
  const cognitiveLevel = determineCognitiveLevel(targetB);

  // 문제 유형 결정
  const problemType = determineProblemType(targetB);

  // 이전 문제 피하기 위한 지시
  const avoidPrevious =
    previous_problems.length > 0
      ? `\n\n⚠️ 중복 방지: 다음 유형은 피해주세요: ${previous_problems.slice(-3).join(', ')}`
      : '';

  // 전문가 출제 워크플로우 프롬프트
  const prompt = `당신은 한국교육과정평가원 수준의 수학 문제 출제 전문가입니다.
아래 출제 워크플로우에 따라 체계적으로 문제를 설계해주세요.

═══════════════════════════════════════════════════
📋 1단계: 평가 목표 설정
═══════════════════════════════════════════════════

### 대상 학년: ${gradeLabel}
### 평가 영역: ${MATH_TOPICS[topic]}

### 성취기준 정보:
${standard ? `
- 성취기준 코드: ${standard.code}
- 성취기준 내용: ${standard.description}
- 핵심 개념/용어: ${standard.keywords.join(', ')}
- 관련 문제 유형: ${standard.examples.join(' / ')}
` : '일반적인 ' + MATH_TOPICS[topic] + ' 문제'}

### 인지적 목표 (블룸 분류):
- 수준: ${cognitiveLevel.label} (Level ${cognitiveLevel.level})
- 설명: ${cognitiveLevel.description}

### 수학적 역량:
- 문제 해결력, 추론 능력, 의사소통 능력 중 하나 이상 평가

═══════════════════════════════════════════════════
📋 2단계: 문제 유형 및 난이도
═══════════════════════════════════════════════════

### 문제 유형: ${problemType.label}형
### 목표 난이도: ${difficultyDesc} (IRT 난이도 파라미터 b = ${targetB.toFixed(2)})
### 예상 정답률: 약 ${Math.round((1 / (1 + Math.exp(-1.7 * (theta - targetB)))) * 100)}%

═══════════════════════════════════════════════════
📋 3단계: 문항 설계 지침
═══════════════════════════════════════════════════

### 상황 설정:
- 실생활 맥락 또는 순수 수학 맥락 중 선택
- 학생의 흥미와 경험을 고려한 소재 사용
- ${gradeLabel} 수준에서 이해 가능한 어휘 사용

### 조건 제시:
- 문제 해결에 필요한 정보를 명확히 제시
- 불필요한 정보(함정)는 난이도에 따라 조절
- 수학적으로 모순 없는 조건 설정

### 발문 작성:
- 구하고자 하는 바를 명확히 제시
- 중의적 해석의 여지가 없도록 작성

═══════════════════════════════════════════════════
📋 4단계: 오답 선지 설계 (매우 중요!)
═══════════════════════════════════════════════════

오답 선지는 학생들의 실제 오류 유형을 반영해야 합니다:

1. **부호 오류**: +/- 실수, 부등호 방향 착오
2. **계산 실수**: 단순 연산 오류, 받아올림/내림 실수
3. **개념 혼동**: 유사 공식 혼동, 조건 누락
4. **불완전한 풀이**: 중간 과정에서 멈춤, 단위 변환 누락
5. **문제 독해 실수**: 조건 잘못 파악, 구하는 것 착각

각 오답이 어떤 오류 유형인지 solution에 명시해주세요.

═══════════════════════════════════════════════════
📋 5단계: 풀이 작성 지침
═══════════════════════════════════════════════════

### 풀이 구조:
1. 문제 분석 (주어진 조건, 구하는 것)
2. 풀이 전략 (어떤 개념/공식 사용)
3. 단계별 계산 과정
4. 정답 도출 및 검토

### 다양한 풀이법:
- 가능하면 2가지 이상의 풀이 방법 제시
- 각 방법의 장단점 설명

═══════════════════════════════════════════════════
❌ 출제 금지 사항
═══════════════════════════════════════════════════

이 학년에서 다루지 않는 내용 (절대 사용 금지):
${notIncluded.map(item => `• ${item}`).join('\n')}
${avoidPrevious}

═══════════════════════════════════════════════════
📝 출력 형식 (JSON)
═══════════════════════════════════════════════════

다음 JSON 형식으로 문제를 출력하세요:

{
  "content": "완성된 문제 내용 (한국어, LaTeX 수식 사용 가능)",
  "latex": "주요 수식을 LaTeX로 (없으면 null)",
  "options": [
    "①정답",
    "②오답 (오류유형: 부호 오류)",
    "③오답 (오류유형: 계산 실수)",
    "④오답 (오류유형: 개념 혼동)"
  ],
  "correct_answer": "정답과 정확히 일치하는 보기",
  "solution": "단계별 상세 풀이 (각 오답 선지의 오류도 설명)",
  "hints": [
    "힌트1: 방향만 제시하는 간접적 힌트",
    "힌트2: 사용할 개념을 암시하는 중간 힌트",
    "힌트3: 풀이 첫 단계를 유도하는 직접적 힌트"
  ],
  "subtopic": "세부 주제",
  "cognitive_level": "${cognitiveLevel.label}",
  "problem_type": "${problemType.label}"
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

    // 옵션에서 오류 유형 설명 제거 (UI용)
    const cleanedOptions = parsed.options.map((opt: string) =>
      opt.replace(/\s*\(오류유형:.*?\)/g, '').trim()
    );

    // 문제 객체 생성
    const problem: ProblemWithIRT = {
      id: generateUUID(),
      content: parsed.content,
      latex: parsed.latex || undefined,
      options: cleanedOptions,
      correct_answer: parsed.correct_answer.replace(/\s*\(오류유형:.*?\)/g, '').trim(),
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
 * 난이도에 따른 인지 수준 결정
 */
function determineCognitiveLevel(targetB: number) {
  if (targetB <= -1.5) return COGNITIVE_LEVELS.remember;
  if (targetB <= -0.5) return COGNITIVE_LEVELS.understand;
  if (targetB <= 0.5) return COGNITIVE_LEVELS.apply;
  if (targetB <= 1.5) return COGNITIVE_LEVELS.analyze;
  if (targetB <= 2.5) return COGNITIVE_LEVELS.evaluate;
  return COGNITIVE_LEVELS.create;
}

/**
 * 난이도에 따른 문제 유형 결정
 */
function determineProblemType(targetB: number) {
  if (targetB <= -1) return PROBLEM_TYPES.concept;
  if (targetB <= 0) return PROBLEM_TYPES.calculation;
  if (targetB <= 1) return PROBLEM_TYPES.reasoning;
  if (targetB <= 2) return PROBLEM_TYPES.application;
  return PROBLEM_TYPES.complex;
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

interface ImmersionProblemConfigExtended extends ImmersionProblemConfig {
  gradeBoost: number; // 상위 학년 개념 허용 범위
  level: string;      // 난이도 레벨 설명
}

/**
 * 황농문 교수 몰입이론 기반 난이도 설정
 *
 * 핵심 원리:
 * - "실력보다 약간 높은 수준" = +10~20% 난이도
 * - "손을 뻗으면 닿을 듯한" 도전
 * - 60-80% 정답률을 목표로 설계
 * - 너무 어려우면 불안, 너무 쉬우면 지루 → 몰입 불가
 *
 * gradeBoost 원칙:
 * - 최대 1~2학년 상위 수준까지만
 * - 학생이 힌트를 통해 스스로 도달할 수 있는 범위
 * - "생각하면 풀 수 있다"는 확신이 있어야 몰입 발생
 */
const IMMERSION_CONFIG: Record<ImmersionDifficulty, ImmersionProblemConfigExtended> = {
  '5min': {
    duration: '5분',
    complexity: '해당 학년 기본 개념 복습',
    steps: 2,
    description: '빠르게 성공 경험을 쌓는 기초 문제',
    gradeBoost: 0,  // 해당 학년 수준
    level: '기초',
  },
  '10min': {
    duration: '10분',
    complexity: '해당 학년 응용',
    steps: 3,
    description: '약간의 사고력이 필요한 응용 문제 (정답률 70-80% 목표)',
    gradeBoost: 0,  // 해당 학년 수준
    level: '응용',
  },
  '30min': {
    duration: '30분',
    complexity: '해당 학년 심화',
    steps: 5,
    description: '여러 단계의 추론이 필요한 심화 문제 (정답률 60-70% 목표)',
    gradeBoost: 0,  // 해당 학년 심화 수준 (다음 학년 X)
    level: '심화',
  },
  '1hour': {
    duration: '1시간',
    complexity: '해당 학년 최상위 + 다음 학년 맛보기',
    steps: 8,
    description: '깊이 생각해야 하는 도전 문제, 다음 학년 개념 살짝 노출',
    gradeBoost: 1,  // 1학년 상위까지 (초6 → 중1 기초)
    level: '도전',
  },
  '1day': {
    duration: '하루',
    complexity: '다음 학년 기초~중간 수준',
    steps: 10,
    description: '하루 동안 고민하며 새로운 개념을 발견하는 문제',
    gradeBoost: 1,  // 1학년 상위 (탐구하면 도달 가능한 수준)
    level: '탐구',
  },
  '3days': {
    duration: '3일',
    complexity: '다음 학년 중간~심화 수준',
    steps: 12,
    description: '며칠간 고민하며 개념을 확장하는 프로젝트 문제',
    gradeBoost: 1,  // 1학년 상위 심화 (초6 → 중1 심화)
    level: '프로젝트',
  },
  '7days': {
    duration: '일주일',
    complexity: '1~2학년 상위 수준 융합',
    steps: 15,
    description: '일주일간 여러 개념을 연결하며 탐구하는 문제',
    gradeBoost: 2,  // 2학년 상위까지 (초6 → 중2 기초)
    level: '융합탐구',
  },
  '1month': {
    duration: '한 달',
    complexity: '2학년 상위 수준 도전',
    steps: 20,
    description: '한 달간 깊이 몰입하여 상위 개념을 스스로 발견하는 문제',
    gradeBoost: 2,  // 2학년 상위까지 (초6 → 중2 수준) - 손 뻗으면 닿는 거리!
    level: '심층탐구',
  },
};

/**
 * 몰입 학습용 문제 생성 (시간 기반 난이도)
 *
 * 핵심 철학:
 * - 진단 테스트: 해당 학년 수준만
 * - 몰입 학습: 난이도에 따라 상위 학년 개념 도전 가능!
 * - 소크라테스 산파법: 힌트를 통해 학생이 스스로 발견하도록 유도
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
  const baseGradeLabel = getGradeLabel(grade);

  // 목표 학년 계산 (난이도에 따라 상위 학년 개념 사용)
  const targetGrade = Math.min(12, grade + config.gradeBoost);
  const targetGradeLabel = getGradeLabel(targetGrade);

  // 목표 학년의 성취기준 선택
  const targetStandard = preferredTopic
    ? selectStandardByTopic(targetGrade, preferredTopic)
    : selectRandomStandard(targetGrade);

  // 목표 학년의 교육과정 정보
  const targetCurriculum = CURRICULUM_DB[targetGrade];
  let topicsList = '';
  if (targetCurriculum) {
    const allDomains = [
      ...Object.keys(targetCurriculum.semester1.domains),
      ...Object.keys(targetCurriculum.semester2.domains),
    ];
    topicsList = allDomains.join(', ');
  }

  // 소크라테스 산파법 설명
  const socraticMethod = `
## 🏛️ 소크라테스 산파법 (힌트 제공 방식)
힌트는 답을 직접 알려주지 않고, 학생이 **스스로 발견**하도록 유도해야 합니다:
1. 질문으로 방향 제시: "~를 생각해 본 적 있나요?"
2. 관련 개념 상기: "~와 비슷한 상황을 떠올려 보세요"
3. 작은 단계 유도: "먼저 ~부터 해보면 어떨까요?"
4. 연결고리 제공: "~와 ~의 관계를 찾아보세요"
5. 거의 답 근처: "~가 핵심이에요. 이것으로 무엇을 할 수 있을까요?"
`;

  // 난이도별 특화 지시사항
  let difficultySpecificInstructions = '';

  if (config.gradeBoost === 0) {
    // 5분, 10분: 해당 학년 수준
    difficultySpecificInstructions = `
## 📚 난이도 지침
- **${baseGradeLabel} 교육과정 범위 내**에서 출제
- 기본 개념의 응용 문제
- 실생활 연계 권장`;
  } else if (config.gradeBoost <= 2) {
    // 30분, 1시간: 약간 상위 개념
    difficultySpecificInstructions = `
## 📚 난이도 지침
- 기본: ${baseGradeLabel} 개념
- 도전: **${targetGradeLabel} 개념까지 사용 가능**
- 학생이 새로운 개념을 **스스로 발견**하도록 문제 설계
- 힌트를 통해 상위 개념을 자연스럽게 유도`;
  } else if (config.gradeBoost <= 4) {
    // 하루, 3일: 상위 학교급 개념
    difficultySpecificInstructions = `
## 📚 난이도 지침
- 기본 출발: ${baseGradeLabel} 개념
- 목표 도달: **${targetGradeLabel} 수준의 심화 문제**
- ${grade <= 6 ? '중학교' : '고등학교'} 개념을 탐구하는 문제
- **경시대회/영재원 입문 수준**
- 수학적 사고력과 창의성 필요`;
  } else {
    // 7일, 한달: 올림피아드 수준
    difficultySpecificInstructions = `
## 📚 난이도 지침 (올림피아드 수준)
- **KMO(한국수학올림피아드), IMO 예선 수준**
- 기본 출발점: ${baseGradeLabel}의 개념
- 목표: 고등학교 이상의 수학적 사고
- **증명, 일반화, 극한적 사고** 필요
- 여러 분야의 수학을 융합하는 문제
- 창의적이고 우아한 풀이 존재`;
  }

  const prompt = `당신은 ${baseGradeLabel} 학생을 위한 **몰입 학습용** 수학 문제를 만드는 교육 전문가입니다.

${difficultySpecificInstructions}

## 🎯 문제 요구사항
- 학생 학년: ${baseGradeLabel}
- 목표 난이도: **${config.level}** (${targetGradeLabel} 수준)
- 예상 풀이 시간: **${config.duration}**
- 복잡도: ${config.complexity}
- 풀이 단계: 약 ${config.steps}단계

${targetStandard ? `
## 📖 참고할 성취기준 (${targetGradeLabel}):
- 코드: ${targetStandard.code}
- 내용: ${targetStandard.description}
- 키워드: ${targetStandard.keywords.join(', ')}
` : ''}

## 🎓 ${targetGradeLabel}에서 다루는 영역:
${topicsList}

${socraticMethod}

## ⚠️ 중요 규칙:
1. ${config.duration} 동안 **깊이 몰두**할 수 있는 문제여야 합니다
2. 단순 계산 문제 금지! **사고력, 창의력, 문제해결력** 필요
3. 힌트는 **소크라테스 산파법**으로: 질문을 통해 스스로 발견하게 유도
4. ${config.gradeBoost > 0 ? `상위 개념(${targetGradeLabel})을 **탐구하는 기회**로 설계` : '해당 학년 범위 내에서 도전적으로'}
5. 아름답고 우아한 풀이가 존재하는 문제 선호

## 📝 용어 설명 필수! (매우 중요)
- 학생은 ${baseGradeLabel}이므로 **${targetGradeLabel} 용어를 모를 수 있습니다**
- 문제에 사용되는 **모든 새로운 수학 용어**는 문제 속에서 쉽게 설명해주세요
- 예시:
  - "약수의 합(어떤 수를 나누어 떨어지게 하는 모든 수를 더한 것)"
  - "판별식(이차방정식에서 근의 개수를 알려주는 값으로, b²-4ac)"
  - "벡터(크기와 방향을 함께 나타내는 화살표)"
- 용어 설명은 **괄호 안에 짧고 명확하게** 넣어주세요
- 학생이 용어를 몰라서 문제를 포기하지 않도록!

다음 JSON 형식으로 문제를 생성해주세요:

{
  "content": "문제 내용 (상세하고 도전적으로, LaTeX 수식 사용)",
  "hints": [
    "힌트1: (소크라테스식 질문으로 방향 제시)",
    "힌트2: (관련 개념 상기시키는 질문)",
    "힌트3: (풀이의 첫 단계를 유도하는 질문)",
    "힌트4: (핵심 아이디어에 다가가는 질문)",
    "힌트5: (거의 답에 가까운 유도 질문)"
  ],
  "solution": "상세한 단계별 풀이 (${config.steps}단계 이상, 각 단계의 사고 과정 설명)",
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
      topic: parsed.topic || targetStandard?.description || `${config.level} 수학`,
      estimatedTime: config.duration,
    };
  } catch (error) {
    console.error('Error generating immersion problem:', error);

    // 폴백 문제 (난이도별 적절한 수준)
    return generateFallbackImmersionProblem(grade, difficulty, targetStandard?.description || '수학');
  }
}

/**
 * 황농문 교수 몰입이론 기반 폴백 문제 생성
 *
 * 핵심 원칙:
 * - "손을 뻗으면 닿을 듯한" 난이도 (현재 실력 +10~20%)
 * - 60-80% 정답률 목표
 * - 힌트를 통해 스스로 발견하는 기쁨
 * - 너무 어려우면 불안, 너무 쉬우면 지루 → 몰입 불가
 */
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

  // gradeBoost 적용 (황농문 이론: 최대 +2학년까지만)
  const targetGrade = Math.min(12, grade + config.gradeBoost);

  // ============================================================
  // 6학년 기준 몰입 문제 (학년별로 확장 가능)
  // 황농문 이론: "생각하면 풀 수 있다"는 확신이 있어야 몰입
  // ============================================================

  // 기초 문제 (5min, 10min) - 해당 학년 수준
  const basicProblems: Record<number, { content: string; hints: string[]; solution: string }[]> = {
    6: [
      {
        content: `어떤 물건의 정가가 10,000원입니다. 이 물건을 20% 할인해서 팔았습니다.

**질문**: 할인된 가격은 얼마인가요?`,
        hints: [
          '20%는 전체의 얼마일까요? 100% 중 20%를 생각해보세요.',
          '20% = 20/100 = 0.2 또는 1/5 이에요.',
          '할인 금액 = 정가 × 할인율',
          '할인된 가격 = 정가 - 할인 금액'
        ],
        solution: `할인 금액 = 10,000 × 0.2 = 2,000원
할인된 가격 = 10,000 - 2,000 = 8,000원

또는 한 번에:
할인된 가격 = 10,000 × (1 - 0.2) = 10,000 × 0.8 = 8,000원`,
      },
      {
        content: `철수네 반 학생 30명 중에서 안경을 쓴 학생은 12명입니다.

**질문**: 안경을 쓴 학생은 전체의 몇 %인가요?`,
        hints: [
          '비율 = 부분/전체',
          '12/30을 계산해보세요',
          '분수를 소수로 바꾸면?',
          '소수에 100을 곱하면 퍼센트!'
        ],
        solution: `비율 = 12/30 = 2/5 = 0.4
퍼센트 = 0.4 × 100 = 40%

답: 40%`,
      }
    ],
    7: [
      {
        content: `**[새로운 개념 소개]**
중학교에서는 '음수'를 배워요. 0보다 작은 수를 음수라고 해요. 예: -3, -5

**문제**:
어떤 수에 5를 더했더니 -3이 되었습니다. 어떤 수는 무엇인가요?

이것을 '방정식'으로 쓰면: x + 5 = -3`,
        hints: [
          '어떤 수를 x라고 하면, x + 5 = -3',
          '양쪽에서 5를 빼면 x만 남아요',
          'x = -3 - 5',
          '음수끼리 빼면? -3 - 5 = -8'
        ],
        solution: `x + 5 = -3
x = -3 - 5
x = -8

검산: -8 + 5 = -3 ✓`,
      }
    ],
    8: [
      {
        content: `**[새로운 개념 소개]**
두 개의 방정식을 동시에 만족하는 x, y를 찾는 것을 '연립방정식'이라고 해요.

**문제**:
사과 2개와 배 1개의 가격이 1,100원이고,
사과 1개와 배 2개의 가격이 1,300원입니다.
사과 1개와 배 1개의 가격은 각각 얼마인가요?

(힌트: 사과 가격을 x원, 배 가격을 y원이라 하면...)`,
        hints: [
          '2x + y = 1100 (사과 2개 + 배 1개)',
          'x + 2y = 1300 (사과 1개 + 배 2개)',
          '첫 번째 식에서 y = 1100 - 2x',
          '이것을 두 번째 식에 대입해보세요'
        ],
        solution: `2x + y = 1100 ... ①
x + 2y = 1300 ... ②

①에서 y = 1100 - 2x
②에 대입: x + 2(1100 - 2x) = 1300
x + 2200 - 4x = 1300
-3x = -900
x = 300

y = 1100 - 2(300) = 500

답: 사과 300원, 배 500원

검산: 2(300) + 500 = 1100 ✓
     300 + 2(500) = 1300 ✓`,
      }
    ]
  };

  // 심화 문제 (30min) - 해당 학년 도전
  const deeperProblems: Record<number, { content: string; hints: string[]; solution: string }[]> = {
    6: [
      {
        content: `**[도전 문제]**
어떤 물건을 정가의 20% 할인해서 팔았더니 판매 가격이 4,800원이었습니다.

**질문**: 이 물건의 정가는 얼마였나요?

(힌트: 거꾸로 생각해보세요!)`,
        hints: [
          '20% 할인했다는 것은 정가의 80%를 받았다는 뜻이에요',
          '정가 × 0.8 = 4,800',
          '정가를 구하려면 4,800을 0.8로 나누면 돼요',
          '4,800 ÷ 0.8 = ?'
        ],
        solution: `20% 할인 → 정가의 80% = 판매가

정가 × 0.8 = 4,800
정가 = 4,800 ÷ 0.8
정가 = 6,000원

검산: 6,000 × 0.8 = 4,800 ✓`,
      },
      {
        content: `**[도전 문제]**
정가의 20%를 할인한 가격에서 다시 10%를 추가 할인했습니다.

**질문**:
1. 최종 가격은 정가의 몇 %인가요?
2. 왜 30% 할인이 아닐까요? 설명해보세요.`,
        hints: [
          '첫 번째 할인 후: 정가 × 0.8',
          '두 번째 할인은 "할인된 가격"의 10%를 빼는 거예요',
          '(정가 × 0.8) × 0.9 = ?',
          '0.8 × 0.9를 계산해보세요'
        ],
        solution: `1단계: 20% 할인 → 정가의 80% = 정가 × 0.8
2단계: 추가 10% 할인 → (정가 × 0.8) × 0.9

최종 가격 = 정가 × 0.8 × 0.9 = 정가 × 0.72

답: 정가의 72% (= 28% 할인)

왜 30%가 아닐까?
- 두 번째 할인은 "정가"가 아니라 "이미 할인된 가격"에서 10%를 빼기 때문!
- 8,000원의 10%와 10,000원의 10%는 다르죠!`,
      }
    ],
    7: [
      {
        content: `**[도전 문제]**
**[용어 설명]**
- **일차방정식**: x가 1번만 나오는 방정식 (예: 3x + 5 = 11)

형이 동생보다 5살 많습니다.
3년 후에는 형의 나이가 동생 나이의 2배보다 1살 적습니다.
현재 형과 동생의 나이는?`,
        hints: [
          '동생의 현재 나이를 x살이라 하면, 형은 (x+5)살',
          '3년 후: 동생 (x+3)살, 형 (x+8)살',
          '3년 후 조건: x + 8 = 2(x + 3) - 1',
          '방정식을 풀어보세요!'
        ],
        solution: `동생 현재 나이: x살
형 현재 나이: (x + 5)살

3년 후:
- 동생: (x + 3)살
- 형: (x + 8)살

조건: 형 나이 = 동생 나이의 2배 - 1
x + 8 = 2(x + 3) - 1
x + 8 = 2x + 6 - 1
x + 8 = 2x + 5
8 - 5 = 2x - x
x = 3

답: 동생 3살, 형 8살

검산: 3년 후 → 동생 6살, 형 11살
11 = 2 × 6 - 1 = 11 ✓`,
      }
    ]
  };

  // 도전 문제 (1hour) - 다음 학년 맛보기
  const challengeProblems: Record<number, { content: string; hints: string[]; solution: string }[]> = {
    6: [
      {
        content: `**[다음 학년 미리보기 - 음수와 방정식]**

**[용어 설명]**
- **음수**: 0보다 작은 수 (예: -1, -5, -10)
- **양수**: 0보다 큰 수 (예: 1, 5, 10)
- 온도계를 생각해보세요: 영하 5도 = -5°C

**문제**:
아침 기온이 -3°C였습니다. 낮에는 기온이 올라서 아침보다 8°C 더 높아졌습니다.
낮 기온은 몇 °C인가요?

더 생각해보기: 저녁에 낮보다 10°C 내려갔다면, 저녁 기온은?`,
        hints: [
          '-3에서 8만큼 올라간다는 것은 -3 + 8',
          '음수 + 양수: 수직선에서 생각해보세요',
          '-3에서 오른쪽으로 8칸 이동',
          '저녁 기온: 낮 기온 - 10'
        ],
        solution: `낮 기온 = -3 + 8 = 5°C

수직선으로 이해:
... -5 -4 -3 -2 -1 0 1 2 3 4 5 ...
    ↑ 시작      →→→→→→→→ ↑ 도착

저녁 기온 = 5 - 10 = -5°C

답: 낮 5°C, 저녁 -5°C`,
      },
      {
        content: `**[다음 학년 미리보기 - 방정식의 아이디어]**

**[용어 설명]**
- **방정식**: 모르는 수(□나 x)가 들어간 등식
- **방정식을 푼다**: □에 어떤 수가 들어가야 등식이 성립하는지 찾는 것

**문제**:
어떤 수의 3배에서 7을 빼면 20이 됩니다.
어떤 수를 구하세요.

(힌트: 어떤 수를 □라 하면, □ × 3 - 7 = 20)`,
        hints: [
          '□ × 3 - 7 = 20',
          '양쪽에 7을 더하면: □ × 3 = 27',
          '양쪽을 3으로 나누면: □ = 9',
          '검산: 9 × 3 - 7 = 27 - 7 = 20 ✓'
        ],
        solution: `어떤 수를 □라 하면:
□ × 3 - 7 = 20
□ × 3 = 20 + 7
□ × 3 = 27
□ = 27 ÷ 3
□ = 9

검산: 9 × 3 - 7 = 27 - 7 = 20 ✓

답: 9`,
      }
    ],
    7: [
      {
        content: `**[다음 학년 미리보기 - 연립방정식 맛보기]**

**[용어 설명]**
- **연립방정식**: 두 개의 조건을 동시에 만족하는 값 찾기

**문제**:
연필 3자루와 지우개 2개를 사면 1,100원
연필 2자루와 지우개 3개를 사면 1,150원

연필 1자루와 지우개 1개의 가격은 각각 얼마인가요?`,
        hints: [
          '연필 가격을 x원, 지우개 가격을 y원이라 하면',
          '3x + 2y = 1100',
          '2x + 3y = 1150',
          '두 식을 빼거나 더해서 문자 하나를 없애보세요'
        ],
        solution: `3x + 2y = 1100 ... ①
2x + 3y = 1150 ... ②

①×3: 9x + 6y = 3300
②×2: 4x + 6y = 2300
빼면: 5x = 1000
    x = 200

①에 대입: 3(200) + 2y = 1100
600 + 2y = 1100
2y = 500
y = 250

답: 연필 200원, 지우개 250원`,
      }
    ]
  };

  // 탐구 문제 (1day, 3days) - 다음 학년 개념 탐구
  const explorationProblems: Record<number, { content: string; hints: string[]; solution: string }[]> = {
    6: [
      {
        content: `**[탐구 과제 - 규칙 발견하기]**

다음 계산 결과를 관찰하고 규칙을 발견해보세요:

1 = 1
1 + 3 = 4
1 + 3 + 5 = 9
1 + 3 + 5 + 7 = 16
1 + 3 + 5 + 7 + 9 = ?

**탐구 질문**:
1. 다음 결과는 무엇인가요?
2. 어떤 규칙이 있나요?
3. 1부터 시작하는 연속 홀수 10개의 합은 얼마일까요?
4. 왜 이런 규칙이 성립할까요? (그림으로 설명해보세요!)`,
        hints: [
          '결과가 1, 4, 9, 16, ... 이네요. 뭔가 보이나요?',
          '1 = 1², 4 = 2², 9 = 3², 16 = 4²',
          '연속 홀수 n개의 합 = n²',
          '정사각형 모양으로 점을 찍어보세요!'
        ],
        solution: `1 + 3 + 5 + 7 + 9 = 25 = 5²

규칙: 1부터 시작하는 연속 홀수 n개의 합 = n²

연속 홀수 10개의 합 = 10² = 100

왜 그럴까요? (그림으로 이해)
●        1개 (1)
●●●      +3개 (L자 모양)
●●●●●    +5개 (L자 모양)
...

이렇게 정사각형을 만들어가기 때문!

1 = 1×1 정사각형
1+3 = 2×2 정사각형
1+3+5 = 3×3 정사각형
...`,
      },
      {
        content: `**[탐구 과제 - 비율과 도형]**

직사각형의 가로와 세로의 비가 3:2입니다.
이 직사각형의 둘레가 50cm일 때, 넓이를 구하세요.

**더 탐구해보기**:
둘레가 같은 직사각형 중에서 어떤 비율일 때 넓이가 가장 클까요?`,
        hints: [
          '가로:세로 = 3:2 → 가로 = 3k, 세로 = 2k (k는 비례상수)',
          '둘레 = 2(가로 + 세로) = 2(3k + 2k) = 10k',
          '10k = 50 → k = 5',
          '가로 = 15cm, 세로 = 10cm'
        ],
        solution: `가로 = 3k, 세로 = 2k라 하면

둘레 = 2(3k + 2k) = 10k = 50
k = 5

가로 = 15cm, 세로 = 10cm
넓이 = 15 × 10 = 150cm²

[더 탐구]
둘레가 50cm로 같을 때:
- 3:2 비율 → 넓이 150cm²
- 4:1 비율 → 20×5 = 100cm²
- 1:1 비율(정사각형) → 12.5×12.5 = 156.25cm²

정사각형일 때 넓이가 가장 크다!`,
      }
    ],
    7: [
      {
        content: `**[탐구 과제 - 좌표의 발견]**

**[용어 설명]**
- **좌표**: 위치를 숫자 쌍으로 나타내는 방법 (가로 위치, 세로 위치)
- **좌표평면**: x축(가로)과 y축(세로)이 만나는 평면

**문제**:
좌표평면에서 세 점 A(0, 0), B(4, 0), C(2, 3)을 꼭짓점으로 하는 삼각형의 넓이를 구하세요.

**탐구**: 점 C를 움직여서 넓이가 12가 되게 하려면 C의 y좌표는 얼마여야 할까요?`,
        hints: [
          'A, B는 x축 위에 있어서 밑변 AB = 4',
          '높이는 C에서 x축까지의 거리 = C의 y좌표 = 3',
          '삼각형 넓이 = 밑변 × 높이 ÷ 2',
          '넓이가 12가 되려면: 4 × h ÷ 2 = 12'
        ],
        solution: `밑변 AB = 4 (A에서 B까지 거리)
높이 = 3 (C의 y좌표)

넓이 = 4 × 3 ÷ 2 = 6

[탐구]
넓이 = 4 × h ÷ 2 = 12
2h = 12
h = 6

C의 y좌표가 6이면 넓이가 12가 됩니다.
예: C(2, 6)`,
      }
    ]
  };

  // 융합탐구 문제 (7days, 1month) - 1~2학년 상위 개념 연결
  const advancedExplorationProblems: Record<number, { content: string; hints: string[]; solution: string }[]> = {
    6: [
      {
        content: `**[융합 탐구 - 규칙과 식]**

**[새로운 개념]**
숫자 대신 문자를 사용하면 규칙을 간단하게 표현할 수 있어요!

**문제**:
성냥개비로 정사각형을 만들고 있습니다.

□ (4개)
□□ (7개)
□□□ (10개)

1. 정사각형 5개를 만들려면 성냥개비가 몇 개 필요할까요?
2. 정사각형 n개를 만들 때 필요한 성냥개비 수를 n으로 나타내보세요.
3. 성냥개비 100개로 정사각형을 몇 개 만들 수 있을까요?`,
        hints: [
          '1개: 4, 2개: 7, 3개: 10 → 3씩 증가',
          '처음 4개 + 추가할 때마다 3개',
          '정사각형 n개 → 4 + 3(n-1) = 3n + 1',
          '3n + 1 = 100 → n = ?'
        ],
        solution: `규칙 발견:
1개: 4 = 4
2개: 4 + 3 = 7
3개: 4 + 3 + 3 = 10
n개: 4 + 3(n-1) = 3n + 1

1) 5개: 3×5 + 1 = 16개

2) n개일 때: 3n + 1개

3) 3n + 1 = 100
   3n = 99
   n = 33

   검산: 3×33 + 1 = 100 ✓

   답: 33개`,
      },
      {
        content: `**[융합 탐구 - 비율의 깊은 이해]**

**문제**:
소금물 A는 소금 30g이 물 270g에 녹아 있고,
소금물 B는 소금 40g이 물 160g에 녹아 있습니다.

1. A와 B의 소금물 농도(%)는 각각 얼마인가요?
2. A와 B를 섞으면 농도는 얼마가 될까요?
3. (심화) 농도 15%의 소금물을 만들려면 A와 B를 어떤 비율로 섞어야 할까요?`,
        hints: [
          '농도(%) = 소금 ÷ (소금 + 물) × 100',
          'A: 30/(30+270) × 100, B: 40/(40+160) × 100',
          '섞으면: (30+40)/(300+200) × 100',
          '심화: A를 x g, B를 y g 섞는다 하면...'
        ],
        solution: `1) 농도 계산
A: 30/300 × 100 = 10%
B: 40/200 × 100 = 20%

2) A+B 섞으면
전체 소금 = 30 + 40 = 70g
전체 소금물 = 300 + 200 = 500g
농도 = 70/500 × 100 = 14%

3) 15% 만들기
A(10%)를 x g, B(20%)를 y g 섞으면
(0.1x + 0.2y)/(x+y) = 0.15
0.1x + 0.2y = 0.15x + 0.15y
0.05y = 0.05x
x = y

→ A와 B를 1:1 비율로 섞으면 15%!

검산: (0.1×100 + 0.2×100)/200 = 30/200 = 0.15 ✓`,
      }
    ],
    7: [
      {
        content: `**[융합 탐구 - 방정식과 그래프]**

**[용어 설명]**
- **일차함수**: y = ax + b 형태의 식 (그래프가 직선)
- **기울기**: 직선이 얼마나 가파른지 (a값)
- **y절편**: 직선이 y축과 만나는 점 (b값)

**문제**:
휴대폰 요금제를 비교합니다.
- A요금제: 기본료 10,000원 + 1분당 50원
- B요금제: 기본료 15,000원 + 1분당 30원

1. x분 통화할 때 각 요금을 x로 나타내세요.
2. 몇 분 이상 통화하면 B요금제가 유리할까요?
3. 두 요금이 같아지는 통화 시간은?`,
        hints: [
          'A요금: 10000 + 50x, B요금: 15000 + 30x',
          'B가 유리 → B요금 < A요금',
          '15000 + 30x < 10000 + 50x',
          '두 요금이 같을 때: 10000 + 50x = 15000 + 30x'
        ],
        solution: `1) A요금 = 10000 + 50x (원)
   B요금 = 15000 + 30x (원)

2) B가 유리한 조건
   15000 + 30x < 10000 + 50x
   5000 < 20x
   250 < x
   → 251분 이상 통화하면 B가 유리

3) 같아지는 시점
   10000 + 50x = 15000 + 30x
   20x = 5000
   x = 250

   → 250분일 때 같음 (둘 다 22,500원)

검산: A: 10000 + 50×250 = 22500
     B: 15000 + 30×250 = 22500 ✓`,
      }
    ]
  };

  // 난이도에 따른 문제 선택 (황농문 이론 기반)
  let selectedProblem: { content: string; hints: string[]; solution: string };

  // 학년에 맞는 문제 풀 선택
  const gradeBasic = basicProblems[grade] || basicProblems[6];
  const gradeDeeper = deeperProblems[grade] || deeperProblems[6];
  const gradeChallenge = challengeProblems[grade] || challengeProblems[6];
  const gradeExploration = explorationProblems[grade] || explorationProblems[6];
  const gradeAdvanced = advancedExplorationProblems[grade] || advancedExplorationProblems[6];

  if (difficulty === '5min' || difficulty === '10min') {
    // 기초: 해당 학년 수준 (성공 경험 축적)
    selectedProblem = gradeBasic[Math.floor(Math.random() * gradeBasic.length)];
  } else if (difficulty === '30min') {
    // 심화: 해당 학년 도전
    selectedProblem = gradeDeeper[Math.floor(Math.random() * gradeDeeper.length)];
  } else if (difficulty === '1hour') {
    // 도전: 다음 학년 맛보기
    selectedProblem = gradeChallenge[Math.floor(Math.random() * gradeChallenge.length)];
  } else if (difficulty === '1day' || difficulty === '3days') {
    // 탐구: 다음 학년 개념 탐구
    selectedProblem = gradeExploration[Math.floor(Math.random() * gradeExploration.length)];
  } else {
    // 7days, 1month: 융합 탐구 (1~2학년 상위)
    selectedProblem = gradeAdvanced[Math.floor(Math.random() * gradeAdvanced.length)];
  }

  return {
    content: selectedProblem.content,
    hints: selectedProblem.hints,
    solution: selectedProblem.solution,
    topic,
    estimatedTime: config.duration,
  };
}
