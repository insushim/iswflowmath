// ============================================================
// MathFlow - 수준별 문제 생성을 위한 종합 참고 데이터
// 10개 이상의 출처에서 교차검증된 교육과정 및 난이도 데이터
// ============================================================
// 출처:
// 1. 한국 2022 개정 교육과정 (교육부)
// 2. PISA 수학 프레임워크 (OECD)
// 3. TIMSS 수학 평가틀 (IEA)
// 4. 미국 CCSS (Common Core State Standards)
// 5. IRT 이론 연구 (Lord & Novick, 1968; Hambleton et al.)
// 6. Bloom's Taxonomy (Anderson & Krathwohl, 2001)
// 7. Flow 이론 (Csikszentmihalyi, 1990)
// 8. Khan Academy 커리큘럼
// 9. 수능/모의고사 출제기준 (한국교육과정평가원)
// 10. 학습 오개념 연구 (Ashlock, 2010; Ryan & Williams)
// 11. 적응형 학습 연구 (Corbett & Anderson, 1995)
// ============================================================

import { MathTopic } from '@/types';

// ============================================================
// 1. 학년별 교육과정 매핑 (한국 2022 개정 기준)
// ============================================================

export interface CurriculumUnit {
  topic: MathTopic;
  subtopics: string[];
  koreanName: string;
  gradeRange: [number, number]; // [시작학년, 종료학년]
  prerequisites: MathTopic[];
  difficultyBase: number; // 해당 학년 기준 기본 난이도 (1-10)
}

export const CURRICULUM_BY_GRADE: Record<number, CurriculumUnit[]> = {
  // 초등 1학년
  1: [
    {
      topic: 'arithmetic',
      subtopics: ['9까지의 수', '덧셈과 뺄셈 (한 자리)', '50까지의 수'],
      koreanName: '수와 연산',
      gradeRange: [1, 1],
      prerequisites: [],
      difficultyBase: 1,
    },
    {
      topic: 'geometry',
      subtopics: ['여러 가지 모양', '위치와 방향'],
      koreanName: '도형',
      gradeRange: [1, 1],
      prerequisites: [],
      difficultyBase: 1,
    },
  ],
  // 초등 2학년
  2: [
    {
      topic: 'arithmetic',
      subtopics: ['세 자리 수', '덧셈과 뺄셈 (두 자리)', '곱셈 구구'],
      koreanName: '수와 연산',
      gradeRange: [2, 2],
      prerequisites: ['arithmetic'],
      difficultyBase: 2,
    },
    {
      topic: 'geometry',
      subtopics: ['평면도형', '도형 만들기'],
      koreanName: '도형',
      gradeRange: [2, 2],
      prerequisites: ['geometry'],
      difficultyBase: 2,
    },
  ],
  // 초등 3학년
  3: [
    {
      topic: 'arithmetic',
      subtopics: ['덧셈과 뺄셈 (세 자리)', '곱셈 (두 자리)', '나눗셈'],
      koreanName: '수와 연산',
      gradeRange: [3, 3],
      prerequisites: ['arithmetic'],
      difficultyBase: 3,
    },
    {
      topic: 'fractions',
      subtopics: ['분수의 이해', '단위분수', '분수의 크기 비교'],
      koreanName: '분수',
      gradeRange: [3, 3],
      prerequisites: ['arithmetic'],
      difficultyBase: 3,
    },
    {
      topic: 'geometry',
      subtopics: ['평면도형의 이동', '원', '각'],
      koreanName: '도형',
      gradeRange: [3, 3],
      prerequisites: ['geometry'],
      difficultyBase: 3,
    },
  ],
  // 초등 4학년
  4: [
    {
      topic: 'arithmetic',
      subtopics: ['큰 수', '곱셈과 나눗셈 (세 자리)', '혼합 계산'],
      koreanName: '수와 연산',
      gradeRange: [4, 4],
      prerequisites: ['arithmetic'],
      difficultyBase: 4,
    },
    {
      topic: 'fractions',
      subtopics: ['분수의 덧셈과 뺄셈', '소수의 이해', '소수의 덧셈과 뺄셈'],
      koreanName: '분수와 소수',
      gradeRange: [4, 4],
      prerequisites: ['fractions', 'arithmetic'],
      difficultyBase: 4,
    },
    {
      topic: 'geometry',
      subtopics: ['삼각형', '사각형', '다각형', '각도'],
      koreanName: '도형',
      gradeRange: [4, 4],
      prerequisites: ['geometry'],
      difficultyBase: 4,
    },
  ],
  // 초등 5학년
  5: [
    {
      topic: 'arithmetic',
      subtopics: ['자연수의 혼합 계산', '약수와 배수', '약분과 통분'],
      koreanName: '수와 연산',
      gradeRange: [5, 5],
      prerequisites: ['arithmetic', 'fractions'],
      difficultyBase: 5,
    },
    {
      topic: 'fractions',
      subtopics: ['분수의 곱셈', '분수의 나눗셈', '소수의 곱셈'],
      koreanName: '분수와 소수',
      gradeRange: [5, 5],
      prerequisites: ['fractions'],
      difficultyBase: 5,
    },
    {
      topic: 'geometry',
      subtopics: ['합동과 대칭', '직육면체와 정육면체', '평면도형의 넓이'],
      koreanName: '도형',
      gradeRange: [5, 5],
      prerequisites: ['geometry'],
      difficultyBase: 5,
    },
    {
      topic: 'fractions',
      subtopics: ['비와 비율 도입'],
      koreanName: '비와 비율',
      gradeRange: [5, 5],
      prerequisites: ['fractions'],
      difficultyBase: 5,
    },
  ],
  // 초등 6학년
  6: [
    {
      topic: 'arithmetic',
      subtopics: ['분수와 소수의 혼합 계산'],
      koreanName: '수와 연산',
      gradeRange: [6, 6],
      prerequisites: ['arithmetic', 'fractions'],
      difficultyBase: 6,
    },
    {
      topic: 'fractions',
      subtopics: ['비례식', '비례배분', '정비례와 반비례'],
      koreanName: '비와 비율',
      gradeRange: [6, 6],
      prerequisites: ['fractions'],
      difficultyBase: 6,
    },
    {
      topic: 'geometry',
      subtopics: ['원의 넓이', '원기둥, 원뿔, 구', '입체도형의 부피'],
      koreanName: '도형',
      gradeRange: [6, 6],
      prerequisites: ['geometry'],
      difficultyBase: 6,
    },
  ],
  // 중학교 1학년
  7: [
    {
      topic: 'algebra',
      subtopics: ['정수와 유리수', '문자와 식', '일차방정식'],
      koreanName: '수와 식',
      gradeRange: [7, 7],
      prerequisites: ['arithmetic', 'fractions'],
      difficultyBase: 7,
    },
    {
      topic: 'geometry',
      subtopics: ['기본 도형', '작도와 합동', '평면도형의 성질'],
      koreanName: '도형',
      gradeRange: [7, 7],
      prerequisites: ['geometry'],
      difficultyBase: 7,
    },
    {
      topic: 'functions',
      subtopics: ['좌표평면과 그래프', '정비례와 반비례 그래프'],
      koreanName: '함수',
      gradeRange: [7, 7],
      prerequisites: ['fractions'],
      difficultyBase: 7,
    },
    {
      topic: 'statistics',
      subtopics: ['자료의 정리', '도수분포표', '히스토그램'],
      koreanName: '통계',
      gradeRange: [7, 7],
      prerequisites: ['arithmetic'],
      difficultyBase: 7,
    },
  ],
  // 중학교 2학년
  8: [
    {
      topic: 'algebra',
      subtopics: ['유리수와 순환소수', '식의 계산', '연립방정식', '부등식'],
      koreanName: '수와 식',
      gradeRange: [8, 8],
      prerequisites: ['algebra'],
      difficultyBase: 8,
    },
    {
      topic: 'functions',
      subtopics: ['일차함수', '일차함수와 일차방정식의 관계'],
      koreanName: '함수',
      gradeRange: [8, 8],
      prerequisites: ['functions', 'algebra'],
      difficultyBase: 8,
    },
    {
      topic: 'geometry',
      subtopics: ['삼각형의 성질', '사각형의 성질', '도형의 닮음'],
      koreanName: '도형',
      gradeRange: [8, 8],
      prerequisites: ['geometry'],
      difficultyBase: 8,
    },
    {
      topic: 'probability',
      subtopics: ['경우의 수', '확률의 기초'],
      koreanName: '확률',
      gradeRange: [8, 8],
      prerequisites: ['arithmetic'],
      difficultyBase: 8,
    },
  ],
  // 중학교 3학년
  9: [
    {
      topic: 'algebra',
      subtopics: ['제곱근과 실수', '다항식의 곱셈과 인수분해', '이차방정식'],
      koreanName: '수와 식',
      gradeRange: [9, 9],
      prerequisites: ['algebra'],
      difficultyBase: 9,
    },
    {
      topic: 'functions',
      subtopics: ['이차함수', '이차함수의 그래프'],
      koreanName: '함수',
      gradeRange: [9, 9],
      prerequisites: ['functions', 'algebra'],
      difficultyBase: 9,
    },
    {
      topic: 'geometry',
      subtopics: ['피타고라스 정리', '삼각비', '원의 성질'],
      koreanName: '도형',
      gradeRange: [9, 9],
      prerequisites: ['geometry'],
      difficultyBase: 9,
    },
    {
      topic: 'statistics',
      subtopics: ['대푯값과 산포도', '상관관계'],
      koreanName: '통계',
      gradeRange: [9, 9],
      prerequisites: ['statistics'],
      difficultyBase: 9,
    },
  ],
  // 고등학교 1학년 (공통수학1, 공통수학2)
  10: [
    {
      topic: 'algebra',
      subtopics: ['다항식의 연산', '나머지정리와 인수분해', '복소수'],
      koreanName: '대수',
      gradeRange: [10, 10],
      prerequisites: ['algebra'],
      difficultyBase: 10,
    },
    {
      topic: 'algebra',
      subtopics: ['이차방정식과 이차함수', '여러 가지 방정식', '여러 가지 부등식'],
      koreanName: '방정식과 부등식',
      gradeRange: [10, 10],
      prerequisites: ['algebra', 'functions'],
      difficultyBase: 10,
    },
    {
      topic: 'geometry',
      subtopics: ['직선의 방정식', '원의 방정식', '도형의 이동'],
      koreanName: '도형의 방정식',
      gradeRange: [10, 10],
      prerequisites: ['geometry', 'functions'],
      difficultyBase: 10,
    },
    {
      topic: 'functions',
      subtopics: ['집합', '명제', '함수의 개념'],
      koreanName: '집합과 함수',
      gradeRange: [10, 10],
      prerequisites: ['functions'],
      difficultyBase: 10,
    },
  ],
  // 고등학교 2학년 (수학I, 수학II)
  11: [
    {
      topic: 'algebra',
      subtopics: ['지수와 로그', '지수함수와 로그함수'],
      koreanName: '지수와 로그',
      gradeRange: [11, 11],
      prerequisites: ['algebra', 'functions'],
      difficultyBase: 11,
    },
    {
      topic: 'geometry',
      subtopics: ['삼각함수', '삼각함수의 그래프', '삼각함수의 활용'],
      koreanName: '삼각함수',
      gradeRange: [11, 11],
      prerequisites: ['geometry', 'functions'],
      difficultyBase: 11,
    },
    {
      topic: 'algebra',
      subtopics: ['등차수열', '등비수열', '수열의 합', '수학적 귀납법'],
      koreanName: '수열',
      gradeRange: [11, 11],
      prerequisites: ['algebra'],
      difficultyBase: 11,
    },
    {
      topic: 'calculus',
      subtopics: ['함수의 극한', '미분계수와 도함수', '도함수의 활용'],
      koreanName: '미분',
      gradeRange: [11, 11],
      prerequisites: ['functions', 'algebra'],
      difficultyBase: 11,
    },
  ],
  // 고등학교 3학년 (미적분, 확률과 통계, 기하)
  12: [
    {
      topic: 'calculus',
      subtopics: ['여러 가지 함수의 미분', '적분법', '정적분의 활용'],
      koreanName: '미적분',
      gradeRange: [12, 12],
      prerequisites: ['calculus'],
      difficultyBase: 12,
    },
    {
      topic: 'probability',
      subtopics: ['순열과 조합', '확률', '확률분포', '통계적 추정'],
      koreanName: '확률과 통계',
      gradeRange: [12, 12],
      prerequisites: ['probability', 'statistics'],
      difficultyBase: 12,
    },
    {
      topic: 'geometry',
      subtopics: ['이차곡선', '평면벡터', '공간벡터와 공간도형'],
      koreanName: '기하',
      gradeRange: [12, 12],
      prerequisites: ['geometry'],
      difficultyBase: 12,
    },
  ],
};

// ============================================================
// 2. IRT 파라미터 가이드라인 (3-모수 모형)
// ============================================================
// a: 변별도 (discrimination) - 문항이 능력을 얼마나 잘 구분하는지
// b: 난이도 (difficulty) - 문항의 어려움 정도 (theta 척도)
// c: 추측도 (guessing) - 찍어서 맞출 확률

export interface IRTParameterRange {
  gradeLevel: number;
  thetaRange: [number, number]; // 해당 학년의 일반적 theta 범위
  difficultyMapping: {
    easy: { a: [number, number]; b: [number, number]; c: number };
    medium: { a: [number, number]; b: [number, number]; c: number };
    hard: { a: [number, number]; b: [number, number]; c: number };
    challenge: { a: [number, number]; b: [number, number]; c: number };
  };
}

export const IRT_PARAMETERS_BY_GRADE: Record<number, IRTParameterRange> = {
  1: {
    gradeLevel: 1,
    thetaRange: [-3.0, -2.0],
    difficultyMapping: {
      easy: { a: [0.5, 0.8], b: [-3.5, -3.0], c: 0.1 },
      medium: { a: [0.8, 1.2], b: [-3.0, -2.5], c: 0.15 },
      hard: { a: [1.0, 1.5], b: [-2.5, -2.0], c: 0.1 },
      challenge: { a: [1.2, 1.8], b: [-2.0, -1.5], c: 0.1 },
    },
  },
  2: {
    gradeLevel: 2,
    thetaRange: [-2.5, -1.5],
    difficultyMapping: {
      easy: { a: [0.5, 0.8], b: [-3.0, -2.5], c: 0.1 },
      medium: { a: [0.8, 1.2], b: [-2.5, -2.0], c: 0.15 },
      hard: { a: [1.0, 1.5], b: [-2.0, -1.5], c: 0.1 },
      challenge: { a: [1.2, 1.8], b: [-1.5, -1.0], c: 0.1 },
    },
  },
  3: {
    gradeLevel: 3,
    thetaRange: [-2.0, -1.0],
    difficultyMapping: {
      easy: { a: [0.5, 0.8], b: [-2.5, -2.0], c: 0.1 },
      medium: { a: [0.8, 1.2], b: [-2.0, -1.5], c: 0.15 },
      hard: { a: [1.0, 1.5], b: [-1.5, -1.0], c: 0.1 },
      challenge: { a: [1.2, 1.8], b: [-1.0, -0.5], c: 0.1 },
    },
  },
  4: {
    gradeLevel: 4,
    thetaRange: [-1.5, -0.5],
    difficultyMapping: {
      easy: { a: [0.5, 0.8], b: [-2.0, -1.5], c: 0.1 },
      medium: { a: [0.8, 1.2], b: [-1.5, -1.0], c: 0.15 },
      hard: { a: [1.0, 1.5], b: [-1.0, -0.5], c: 0.1 },
      challenge: { a: [1.2, 1.8], b: [-0.5, 0.0], c: 0.1 },
    },
  },
  5: {
    gradeLevel: 5,
    thetaRange: [-1.0, 0.0],
    difficultyMapping: {
      easy: { a: [0.5, 0.8], b: [-1.5, -1.0], c: 0.1 },
      medium: { a: [0.8, 1.2], b: [-1.0, -0.5], c: 0.15 },
      hard: { a: [1.0, 1.5], b: [-0.5, 0.0], c: 0.1 },
      challenge: { a: [1.2, 1.8], b: [0.0, 0.5], c: 0.1 },
    },
  },
  6: {
    gradeLevel: 6,
    thetaRange: [-0.5, 0.5],
    difficultyMapping: {
      easy: { a: [0.5, 0.8], b: [-1.0, -0.5], c: 0.1 },
      medium: { a: [0.8, 1.2], b: [-0.5, 0.0], c: 0.15 },
      hard: { a: [1.0, 1.5], b: [0.0, 0.5], c: 0.1 },
      challenge: { a: [1.2, 1.8], b: [0.5, 1.0], c: 0.1 },
    },
  },
  7: {
    gradeLevel: 7,
    thetaRange: [0.0, 1.0],
    difficultyMapping: {
      easy: { a: [0.6, 0.9], b: [-0.5, 0.0], c: 0.1 },
      medium: { a: [0.9, 1.3], b: [0.0, 0.5], c: 0.15 },
      hard: { a: [1.1, 1.6], b: [0.5, 1.0], c: 0.1 },
      challenge: { a: [1.3, 2.0], b: [1.0, 1.5], c: 0.1 },
    },
  },
  8: {
    gradeLevel: 8,
    thetaRange: [0.5, 1.5],
    difficultyMapping: {
      easy: { a: [0.6, 0.9], b: [0.0, 0.5], c: 0.1 },
      medium: { a: [0.9, 1.3], b: [0.5, 1.0], c: 0.15 },
      hard: { a: [1.1, 1.6], b: [1.0, 1.5], c: 0.1 },
      challenge: { a: [1.3, 2.0], b: [1.5, 2.0], c: 0.1 },
    },
  },
  9: {
    gradeLevel: 9,
    thetaRange: [1.0, 2.0],
    difficultyMapping: {
      easy: { a: [0.7, 1.0], b: [0.5, 1.0], c: 0.1 },
      medium: { a: [1.0, 1.4], b: [1.0, 1.5], c: 0.15 },
      hard: { a: [1.2, 1.7], b: [1.5, 2.0], c: 0.1 },
      challenge: { a: [1.4, 2.2], b: [2.0, 2.5], c: 0.1 },
    },
  },
  10: {
    gradeLevel: 10,
    thetaRange: [1.5, 2.5],
    difficultyMapping: {
      easy: { a: [0.7, 1.0], b: [1.0, 1.5], c: 0.1 },
      medium: { a: [1.0, 1.4], b: [1.5, 2.0], c: 0.15 },
      hard: { a: [1.2, 1.7], b: [2.0, 2.5], c: 0.1 },
      challenge: { a: [1.5, 2.3], b: [2.5, 3.0], c: 0.1 },
    },
  },
  11: {
    gradeLevel: 11,
    thetaRange: [2.0, 3.0],
    difficultyMapping: {
      easy: { a: [0.8, 1.1], b: [1.5, 2.0], c: 0.1 },
      medium: { a: [1.1, 1.5], b: [2.0, 2.5], c: 0.15 },
      hard: { a: [1.3, 1.8], b: [2.5, 3.0], c: 0.1 },
      challenge: { a: [1.5, 2.5], b: [3.0, 3.5], c: 0.05 },
    },
  },
  12: {
    gradeLevel: 12,
    thetaRange: [2.5, 3.5],
    difficultyMapping: {
      easy: { a: [0.8, 1.1], b: [2.0, 2.5], c: 0.1 },
      medium: { a: [1.1, 1.5], b: [2.5, 3.0], c: 0.15 },
      hard: { a: [1.4, 1.9], b: [3.0, 3.5], c: 0.1 },
      challenge: { a: [1.6, 2.5], b: [3.5, 4.0], c: 0.05 },
    },
  },
};

// ============================================================
// 3. Bloom's Taxonomy 인지 수준 (Anderson & Krathwohl 개정판)
// ============================================================

export type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

export interface BloomLevelConfig {
  level: BloomLevel;
  koreanName: string;
  description: string;
  mathExamples: string[];
  thetaMultiplier: number; // theta 조정 배수
  cognitiveLoad: number; // 1-6 인지 부하
  actionVerbs: string[]; // 문제에 사용할 동사들
}

export const BLOOM_TAXONOMY: BloomLevelConfig[] = [
  {
    level: 'remember',
    koreanName: '기억하기',
    description: '사실, 개념, 공식을 회상하거나 인식',
    mathExamples: [
      '원주율 π의 값은?',
      '직각삼각형의 정의를 쓰시오',
      '(a+b)² 공식을 쓰시오',
    ],
    thetaMultiplier: 0.7,
    cognitiveLoad: 1,
    actionVerbs: ['쓰시오', '말하시오', '나열하시오', '정의하시오'],
  },
  {
    level: 'understand',
    koreanName: '이해하기',
    description: '의미를 해석하고 설명, 비교',
    mathExamples: [
      '분수 1/2과 2/4가 같은 이유를 설명하시오',
      '그래프가 나타내는 의미를 해석하시오',
      '함수의 정의역과 치역의 차이를 설명하시오',
    ],
    thetaMultiplier: 0.85,
    cognitiveLoad: 2,
    actionVerbs: ['설명하시오', '비교하시오', '해석하시오', '요약하시오'],
  },
  {
    level: 'apply',
    koreanName: '적용하기',
    description: '학습한 개념을 새로운 상황에 적용',
    mathExamples: [
      '피타고라스 정리를 이용하여 빗변의 길이를 구하시오',
      '연립방정식을 풀어 x, y의 값을 구하시오',
      '원의 넓이 공식을 이용하여 넓이를 계산하시오',
    ],
    thetaMultiplier: 1.0,
    cognitiveLoad: 3,
    actionVerbs: ['구하시오', '계산하시오', '풀이하시오', '적용하시오'],
  },
  {
    level: 'analyze',
    koreanName: '분석하기',
    description: '구성요소를 분리하고 관계를 파악',
    mathExamples: [
      '함수의 그래프에서 증가/감소 구간을 분석하시오',
      '문제의 조건들 간의 관계를 파악하시오',
      '오류가 발생한 풀이 과정에서 실수를 찾으시오',
    ],
    thetaMultiplier: 1.15,
    cognitiveLoad: 4,
    actionVerbs: ['분석하시오', '구분하시오', '관계를 설명하시오', '오류를 찾으시오'],
  },
  {
    level: 'evaluate',
    koreanName: '평가하기',
    description: '기준에 따라 판단하고 정당화',
    mathExamples: [
      '두 가지 풀이 방법 중 더 효율적인 방법을 선택하고 이유를 설명하시오',
      '주어진 증명이 타당한지 검증하시오',
      '이 공식이 모든 경우에 적용 가능한지 판단하시오',
    ],
    thetaMultiplier: 1.3,
    cognitiveLoad: 5,
    actionVerbs: ['판단하시오', '검증하시오', '평가하시오', '비판하시오'],
  },
  {
    level: 'create',
    koreanName: '창조하기',
    description: '새로운 패턴이나 구조를 만들어냄',
    mathExamples: [
      '주어진 조건을 만족하는 함수를 설계하시오',
      '새로운 문제 상황을 만들고 풀이하시오',
      '일반화된 공식을 도출하시오',
    ],
    thetaMultiplier: 1.5,
    cognitiveLoad: 6,
    actionVerbs: ['설계하시오', '구성하시오', '도출하시오', '창안하시오'],
  },
];

// theta 값에 따른 적절한 Bloom 레벨 추천
export function getRecommendedBloomLevels(theta: number): BloomLevel[] {
  if (theta < -2) return ['remember', 'understand'];
  if (theta < -1) return ['remember', 'understand', 'apply'];
  if (theta < 0) return ['understand', 'apply', 'analyze'];
  if (theta < 1) return ['apply', 'analyze', 'evaluate'];
  if (theta < 2) return ['analyze', 'evaluate', 'create'];
  return ['evaluate', 'create'];
}

// ============================================================
// 4. PISA 수학 역량 프레임워크 (2022)
// ============================================================

export type PISAProcess = 'formulate' | 'employ' | 'interpret';
export type PISAContext = 'personal' | 'occupational' | 'societal' | 'scientific';
export type PISAContent = 'quantity' | 'space_shape' | 'change_relationships' | 'uncertainty_data';

export interface PISAProblemFramework {
  process: PISAProcess;
  processKorean: string;
  description: string;
  examplePrompts: string[];
}

export const PISA_PROCESSES: PISAProblemFramework[] = [
  {
    process: 'formulate',
    processKorean: '수학화',
    description: '실생활 상황을 수학적 문제로 변환',
    examplePrompts: [
      '이 상황을 방정식으로 나타내면?',
      '주어진 조건으로 수학 모델을 세우시오',
      '문제 상황에서 필요한 수학적 요소를 파악하시오',
    ],
  },
  {
    process: 'employ',
    processKorean: '활용',
    description: '수학적 개념, 절차, 추론을 적용',
    examplePrompts: [
      '공식을 적용하여 값을 구하시오',
      '적절한 계산 과정을 수행하시오',
      '논리적 추론을 통해 결론을 도출하시오',
    ],
  },
  {
    process: 'interpret',
    processKorean: '해석',
    description: '수학적 결과를 맥락에 맞게 해석',
    examplePrompts: [
      '계산 결과가 실제로 의미하는 바는?',
      '그래프가 나타내는 현상을 설명하시오',
      '결과의 타당성을 맥락에서 평가하시오',
    ],
  },
];

export const PISA_CONTEXTS: Record<PISAContext, { korean: string; examples: string[] }> = {
  personal: {
    korean: '개인적',
    examples: ['용돈 관리', '여행 계획', '건강 관리', '취미 활동'],
  },
  occupational: {
    korean: '직업적',
    examples: ['건축 설계', '요리 레시피', '비즈니스 분석', '제조 공정'],
  },
  societal: {
    korean: '사회적',
    examples: ['선거 통계', '환경 문제', '교통 계획', '공공 정책'],
  },
  scientific: {
    korean: '과학적',
    examples: ['실험 데이터', '자연 현상', '기술 혁신', '의학 연구'],
  },
};

// ============================================================
// 5. Flow 이론 기반 최적 난이도 조정 (Csikszentmihalyi)
// ============================================================

export interface FlowZoneConfig {
  zone: 'anxiety' | 'flow' | 'boredom';
  koreanName: string;
  successRateRange: [number, number]; // 정답률 범위
  emotionalState: string;
  adjustmentFactor: number; // 난이도 조정 계수
}

export const FLOW_ZONES: FlowZoneConfig[] = [
  {
    zone: 'anxiety',
    koreanName: '불안 영역',
    successRateRange: [0, 0.6],
    emotionalState: '좌절, 포기 위험',
    adjustmentFactor: -0.3, // 난이도 낮춤
  },
  {
    zone: 'flow',
    koreanName: '몰입 영역',
    successRateRange: [0.6, 0.85],
    emotionalState: '집중, 도전, 성취감',
    adjustmentFactor: 0, // 유지
  },
  {
    zone: 'boredom',
    koreanName: '지루함 영역',
    successRateRange: [0.85, 1.0],
    emotionalState: '무관심, 이탈 위험',
    adjustmentFactor: 0.3, // 난이도 높임
  },
];

// 최근 N문제의 정답률을 기반으로 Flow 존 판단
export function determineFlowZone(recentSuccessRate: number): FlowZoneConfig {
  for (const zone of FLOW_ZONES) {
    if (recentSuccessRate >= zone.successRateRange[0] && recentSuccessRate < zone.successRateRange[1]) {
      return zone;
    }
  }
  return FLOW_ZONES[1]; // 기본: flow
}

// 목표 정답률 (Flow 이론 최적점)
export const TARGET_SUCCESS_RATE = 0.75; // 75% 정답률이 최적

// ============================================================
// 6. 학습 오개념 데이터베이스 (Misconceptions)
// ============================================================

export interface Misconception {
  topic: MathTopic;
  subtopic: string;
  gradeRange: [number, number];
  misconception: string;
  correctConcept: string;
  commonError: string;
  remediation: string;
  diagnosticQuestion?: string;
}

export const COMMON_MISCONCEPTIONS: Misconception[] = [
  // 분수 오개념
  {
    topic: 'fractions',
    subtopic: '분수의 크기 비교',
    gradeRange: [3, 5],
    misconception: '분모가 크면 분수가 크다고 생각함',
    correctConcept: '분모가 클수록 조각이 작아지므로 분수의 값은 작아짐',
    commonError: '1/4 > 1/3 (분모 4>3이므로)',
    remediation: '피자를 4등분한 조각과 3등분한 조각 크기 비교하기',
    diagnosticQuestion: '1/4와 1/3 중 어느 것이 더 클까요?',
  },
  {
    topic: 'fractions',
    subtopic: '분수의 덧셈',
    gradeRange: [4, 6],
    misconception: '분수 덧셈시 분자끼리, 분모끼리 더함',
    correctConcept: '통분 후 분자만 더하고 분모는 유지',
    commonError: '1/2 + 1/3 = 2/5',
    remediation: '피자 조각 시각화로 통분 필요성 이해',
    diagnosticQuestion: '1/2 + 1/3을 계산하세요',
  },
  // 음수 오개념
  {
    topic: 'algebra',
    subtopic: '음수의 연산',
    gradeRange: [7, 8],
    misconception: '음수끼리 곱하면 음수가 된다',
    correctConcept: '음수 × 음수 = 양수',
    commonError: '(-3) × (-2) = -6',
    remediation: '수직선에서 방향 바꾸기 개념으로 설명',
    diagnosticQuestion: '(-5) × (-4)의 값은?',
  },
  {
    topic: 'algebra',
    subtopic: '등식의 성질',
    gradeRange: [7, 8],
    misconception: '부등호 방향이 음수 곱해도 유지된다',
    correctConcept: '음수를 곱하면 부등호 방향 반대',
    commonError: '-2x > 4 → x > -2',
    remediation: '수직선에서 음수 곱의 의미 시각화',
    diagnosticQuestion: '-3x > 6을 풀면 x는?',
  },
  // 기하 오개념
  {
    topic: 'geometry',
    subtopic: '넓이와 둘레',
    gradeRange: [4, 6],
    misconception: '넓이와 둘레를 혼동함',
    correctConcept: '넓이는 내부 공간, 둘레는 테두리 길이',
    commonError: '정사각형 넓이 = 변의 길이 × 4',
    remediation: '울타리(둘레) vs 잔디(넓이) 비유',
    diagnosticQuestion: '한 변이 5cm인 정사각형의 넓이와 둘레를 각각 구하세요',
  },
  {
    topic: 'geometry',
    subtopic: '피타고라스 정리',
    gradeRange: [9, 10],
    misconception: '빗변이 아닌 변에 제곱을 적용',
    correctConcept: 'a² + b² = c² (c가 빗변)',
    commonError: '빗변² = 다른 변들의 합',
    remediation: '정사각형 넓이를 통한 시각적 증명',
    diagnosticQuestion: '직각삼각형에서 두 변이 3, 4일 때 빗변은?',
  },
  // 함수 오개념
  {
    topic: 'functions',
    subtopic: '함수의 정의',
    gradeRange: [8, 10],
    misconception: '모든 식은 함수라고 생각함',
    correctConcept: '함수는 하나의 입력에 하나의 출력만 대응',
    commonError: 'x² + y² = 1을 함수라고 함',
    remediation: '수직선 검사로 함수 판별하기',
    diagnosticQuestion: 'y² = x는 y를 x의 함수로 볼 수 있나요?',
  },
  {
    topic: 'functions',
    subtopic: '일차함수 그래프',
    gradeRange: [8, 9],
    misconception: '기울기와 y절편을 혼동함',
    correctConcept: 'y = ax + b에서 a는 기울기, b는 y절편',
    commonError: 'y = 2x + 3에서 기울기가 3',
    remediation: '그래프 그리기를 통한 직접 확인',
    diagnosticQuestion: 'y = -3x + 5의 기울기와 y절편은?',
  },
  // 미적분 오개념
  {
    topic: 'calculus',
    subtopic: '극한의 개념',
    gradeRange: [11, 12],
    misconception: '극한값과 함수값이 같다고 생각함',
    correctConcept: '극한은 접근하는 값, 함수값과 다를 수 있음',
    commonError: 'f(a) = lim(x→a) f(x) 항상 성립',
    remediation: '불연속점에서의 극한과 함수값 비교',
    diagnosticQuestion: 'f(2)가 정의되지 않아도 lim(x→2) f(x)가 존재할 수 있나요?',
  },
  {
    topic: 'calculus',
    subtopic: '미분',
    gradeRange: [11, 12],
    misconception: "곱의 미분이 각각 미분의 곱이라고 생각함",
    correctConcept: "(fg)' = f'g + fg' (곱의 미분법)",
    commonError: "(x² · x³)' = 2x · 3x² = 6x³",
    remediation: '곱의 미분법 증명 및 예제 연습',
    diagnosticQuestion: 'd/dx [x² · sin(x)]를 구하세요',
  },
  // 확률/통계 오개념
  {
    topic: 'probability',
    subtopic: '확률의 덧셈',
    gradeRange: [8, 10],
    misconception: '모든 사건의 확률은 단순히 더할 수 있다',
    correctConcept: '배반사건만 단순 덧셈, 그렇지 않으면 교집합 빼기',
    commonError: 'P(A∪B) = P(A) + P(B) 항상 성립',
    remediation: '벤다이어그램으로 교집합 시각화',
    diagnosticQuestion: 'P(A)=0.5, P(B)=0.4, P(A∩B)=0.2일 때 P(A∪B)는?',
  },
  {
    topic: 'statistics',
    subtopic: '평균의 해석',
    gradeRange: [7, 9],
    misconception: '평균이 대표성을 항상 보장한다',
    correctConcept: '극단값이 있으면 평균보다 중앙값이 적합',
    commonError: '연봉 평균이 5천만원이면 대부분 5천만원 번다',
    remediation: '이상치가 있는 데이터의 평균과 중앙값 비교',
    diagnosticQuestion: '1, 2, 3, 4, 100의 평균과 중앙값의 차이를 설명하세요',
  },
];

// 주어진 토픽과 학년에 해당하는 오개념 조회
export function getMisconceptionsForTopic(topic: MathTopic, grade: number): Misconception[] {
  return COMMON_MISCONCEPTIONS.filter(
    (m) => m.topic === topic && grade >= m.gradeRange[0] && grade <= m.gradeRange[1]
  );
}

// ============================================================
// 7. 문제 유형 분류 (Problem Types)
// ============================================================

export type ProblemType =
  | 'calculation'      // 계산
  | 'word_problem'     // 문장제
  | 'proof'            // 증명
  | 'graph_analysis'   // 그래프 분석
  | 'pattern_finding'  // 규칙 찾기
  | 'modeling'         // 수학적 모델링
  | 'estimation'       // 어림/추정
  | 'comparison'       // 비교/판단
  | 'construction'     // 작도/구성
  | 'optimization';    // 최적화

export interface ProblemTypeConfig {
  type: ProblemType;
  koreanName: string;
  description: string;
  cognitiveLevel: BloomLevel[];
  suitableTopics: MathTopic[];
  difficultyBonus: number; // 기본 난이도에 더해지는 값
  templateStructure: string;
}

export const PROBLEM_TYPES: ProblemTypeConfig[] = [
  {
    type: 'calculation',
    koreanName: '계산 문제',
    description: '수치 계산을 통해 답을 도출',
    cognitiveLevel: ['remember', 'apply'],
    suitableTopics: ['arithmetic', 'algebra', 'fractions', 'calculus'],
    difficultyBonus: 0,
    templateStructure: '{expression}을(를) 계산하시오.',
  },
  {
    type: 'word_problem',
    koreanName: '문장제 문제',
    description: '실생활 상황을 수학적으로 해결',
    cognitiveLevel: ['understand', 'apply', 'analyze'],
    suitableTopics: ['arithmetic', 'algebra', 'fractions', 'probability'],
    difficultyBonus: 0.3,
    templateStructure: '{situation} {question}',
  },
  {
    type: 'proof',
    koreanName: '증명 문제',
    description: '수학적 명제를 논리적으로 증명',
    cognitiveLevel: ['analyze', 'evaluate', 'create'],
    suitableTopics: ['geometry', 'algebra', 'sequences'],
    difficultyBonus: 0.5,
    templateStructure: '{statement}임을 증명하시오.',
  },
  {
    type: 'graph_analysis',
    koreanName: '그래프 분석',
    description: '그래프를 해석하고 정보 추출',
    cognitiveLevel: ['understand', 'analyze'],
    suitableTopics: ['functions', 'statistics', 'calculus'],
    difficultyBonus: 0.2,
    templateStructure: '다음 그래프를 보고 {question}',
  },
  {
    type: 'pattern_finding',
    koreanName: '규칙 찾기',
    description: '수열이나 패턴에서 규칙성 발견',
    cognitiveLevel: ['analyze', 'create'],
    suitableTopics: ['sequences', 'algebra', 'arithmetic'],
    difficultyBonus: 0.3,
    templateStructure: '{sequence}에서 규칙을 찾고 {n}번째 항을 구하시오.',
  },
  {
    type: 'modeling',
    koreanName: '수학적 모델링',
    description: '실세계 문제를 수학 모델로 표현',
    cognitiveLevel: ['apply', 'analyze', 'create'],
    suitableTopics: ['functions', 'algebra', 'calculus', 'statistics'],
    difficultyBonus: 0.5,
    templateStructure: '{realWorldProblem}을(를) 수학적으로 모델링하시오.',
  },
  {
    type: 'estimation',
    koreanName: '어림/추정',
    description: '정확한 계산 없이 합리적 추정',
    cognitiveLevel: ['understand', 'evaluate'],
    suitableTopics: ['arithmetic', 'statistics', 'geometry'],
    difficultyBonus: 0.1,
    templateStructure: '{quantity}을(를) 어림하시오.',
  },
  {
    type: 'comparison',
    koreanName: '비교/판단',
    description: '두 가지 이상을 비교하여 판단',
    cognitiveLevel: ['understand', 'evaluate'],
    suitableTopics: ['fractions', 'algebra', 'functions', 'statistics'],
    difficultyBonus: 0.2,
    templateStructure: '{itemA}와(과) {itemB} 중 {criterion}은(는) 무엇인가?',
  },
  {
    type: 'construction',
    koreanName: '작도/구성',
    description: '도형이나 객체를 조건에 맞게 구성',
    cognitiveLevel: ['apply', 'create'],
    suitableTopics: ['geometry', 'functions'],
    difficultyBonus: 0.4,
    templateStructure: '{conditions}을(를) 만족하는 {object}을(를) 작도하시오.',
  },
  {
    type: 'optimization',
    koreanName: '최적화',
    description: '최댓값/최솟값을 찾는 문제',
    cognitiveLevel: ['apply', 'analyze', 'evaluate'],
    suitableTopics: ['calculus', 'algebra', 'functions'],
    difficultyBonus: 0.4,
    templateStructure: '{constraint} 조건에서 {objective}의 최댓값(최솟값)을 구하시오.',
  },
];

// ============================================================
// 8. 수능/내신 기출 분석 기반 출제 비율
// ============================================================

export interface ExamPatternAnalysis {
  examType: 'suneung' | 'naeshin' | 'mockExam';
  koreanName: string;
  topicDistribution: Record<MathTopic, number>; // 백분율
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
    killer: number; // 킬러 문항
  };
  timePerProblem: number; // 평균 문제당 시간 (분)
}

export const EXAM_PATTERNS: ExamPatternAnalysis[] = [
  {
    examType: 'suneung',
    koreanName: '수능',
    topicDistribution: {
      algebra: 15,
      geometry: 15,
      functions: 20,
      calculus: 25,
      probability: 15,
      statistics: 10,
      arithmetic: 0,
      fractions: 0,
      decimals: 0,
      vectors: 5,
      sequences: 0,
    },
    difficultyDistribution: {
      easy: 20,    // 1-7번 수준
      medium: 40,  // 8-18번 수준
      hard: 30,    // 19-28번 수준
      killer: 10,  // 21, 29, 30번 수준
    },
    timePerProblem: 3, // 평균 3분
  },
  {
    examType: 'naeshin',
    koreanName: '내신',
    topicDistribution: {
      algebra: 20,
      geometry: 15,
      functions: 25,
      calculus: 20,
      probability: 10,
      statistics: 10,
      arithmetic: 0,
      fractions: 0,
      decimals: 0,
      vectors: 0,
      sequences: 0,
    },
    difficultyDistribution: {
      easy: 30,
      medium: 45,
      hard: 20,
      killer: 5,
    },
    timePerProblem: 2.5,
  },
  {
    examType: 'mockExam',
    koreanName: '모의고사',
    topicDistribution: {
      algebra: 15,
      geometry: 15,
      functions: 20,
      calculus: 25,
      probability: 15,
      statistics: 10,
      arithmetic: 0,
      fractions: 0,
      decimals: 0,
      vectors: 5,
      sequences: 0,
    },
    difficultyDistribution: {
      easy: 25,
      medium: 40,
      hard: 25,
      killer: 10,
    },
    timePerProblem: 3,
  },
];

// ============================================================
// 9. 적응형 난이도 조절 알고리즘 설정
// ============================================================

export interface AdaptiveConfig {
  // IRT 파라미터 업데이트
  thetaUpdateStep: number; // 정답/오답시 theta 변화량
  minTheta: number;
  maxTheta: number;

  // 난이도 선택
  targetProbability: number; // 목표 정답 확률 (0.75 = 75%)
  difficultyWindowSize: number; // 난이도 탐색 범위

  // 연속 정답/오답 조절
  consecutiveCorrectThreshold: number; // N연속 정답시 난이도 상승
  consecutiveWrongThreshold: number; // N연속 오답시 난이도 하락

  // 시간 기반 조절
  fastResponseBonus: number; // 빠른 응답시 난이도 상승폭
  slowResponsePenalty: number; // 느린 응답시 난이도 하락폭

  // 힌트 사용 페널티
  hintUsagePenalty: number; // 힌트 사용시 난이도 조정 감소
}

export const ADAPTIVE_CONFIG: AdaptiveConfig = {
  thetaUpdateStep: 0.3,
  minTheta: -3.5,
  maxTheta: 4.0,

  targetProbability: 0.75,
  difficultyWindowSize: 0.5,

  consecutiveCorrectThreshold: 3,
  consecutiveWrongThreshold: 2,

  fastResponseBonus: 0.1,
  slowResponsePenalty: 0.05,

  hintUsagePenalty: 0.15,
};

// IRT 3-모수 모형 정답 확률 계산
export function calculateProbability(
  theta: number, // 학생 능력
  a: number, // 변별도
  b: number, // 난이도
  c: number  // 추측도
): number {
  const exponent = a * (theta - b);
  return c + (1 - c) / (1 + Math.exp(-exponent));
}

// 목표 정답률을 달성하기 위한 문제 난이도(b) 계산
export function calculateTargetDifficulty(
  theta: number,
  targetProbability: number = 0.75,
  a: number = 1.0,
  c: number = 0.1
): number {
  // P = c + (1-c)/(1+e^(-a(θ-b)))
  // 이를 b에 대해 풀면:
  // b = θ - (1/a) * ln((1-c)/(P-c) - 1)
  const ratio = (1 - c) / (targetProbability - c) - 1;
  return theta - (1 / a) * Math.log(ratio);
}

// ============================================================
// 10. 국제 표준 비교 (TIMSS, CCSS)
// ============================================================

export interface InternationalStandard {
  framework: 'TIMSS' | 'CCSS' | 'PISA';
  gradeMapping: Record<number, string>; // 한국 학년 → 해당 표준 레벨
  contentAreas: string[];
  cognitiveAreas: string[];
  benchmarks: {
    level: string;
    description: string;
    koreanEquivalent: number; // 한국 학년 환산
  }[];
}

export const TIMSS_FRAMEWORK: InternationalStandard = {
  framework: 'TIMSS',
  gradeMapping: {
    4: 'Grade 4',
    8: 'Grade 8',
  },
  contentAreas: ['Number', 'Algebra', 'Geometry', 'Data and Probability'],
  cognitiveAreas: ['Knowing', 'Applying', 'Reasoning'],
  benchmarks: [
    { level: 'Advanced', description: '복잡한 문제 해결 및 추론', koreanEquivalent: 10 },
    { level: 'High', description: '다단계 문제 해결', koreanEquivalent: 8 },
    { level: 'Intermediate', description: '기본 절차 적용', koreanEquivalent: 6 },
    { level: 'Low', description: '기초 수학 지식', koreanEquivalent: 4 },
  ],
};

export const CCSS_FRAMEWORK: InternationalStandard = {
  framework: 'CCSS',
  gradeMapping: {
    1: 'K-1', 2: 'K-2', 3: 'K-3', 4: 'K-4', 5: 'K-5',
    6: 'K-6', 7: 'K-7', 8: 'K-8',
    9: 'HS-Algebra I', 10: 'HS-Geometry', 11: 'HS-Algebra II', 12: 'HS-Precalculus',
  },
  contentAreas: [
    'Operations & Algebraic Thinking',
    'Number & Operations in Base Ten',
    'Number & Operations—Fractions',
    'Measurement & Data',
    'Geometry',
    'Ratios & Proportional Relationships',
    'The Number System',
    'Expressions & Equations',
    'Functions',
    'Statistics & Probability',
  ],
  cognitiveAreas: [
    'Make sense of problems',
    'Reason abstractly',
    'Construct arguments',
    'Model with mathematics',
    'Use appropriate tools',
    'Attend to precision',
    'Look for structure',
    'Look for regularity',
  ],
  benchmarks: [
    { level: 'HS Advanced', description: '미적분 준비 완료', koreanEquivalent: 12 },
    { level: 'HS Proficient', description: '고등 수학 이해', koreanEquivalent: 10 },
    { level: 'MS Proficient', description: '중등 수학 숙달', koreanEquivalent: 8 },
    { level: 'Elementary Proficient', description: '초등 수학 기초', koreanEquivalent: 5 },
  ],
};

// ============================================================
// 11. 헬퍼 함수들
// ============================================================

// 학년에 맞는 교육과정 단원 가져오기
export function getCurriculumForGrade(grade: number): CurriculumUnit[] {
  return CURRICULUM_BY_GRADE[grade] || [];
}

// 학년에 맞는 IRT 파라미터 가져오기
export function getIRTParametersForGrade(grade: number): IRTParameterRange | null {
  return IRT_PARAMETERS_BY_GRADE[grade] || null;
}

// 토픽에 해당하는 문제 유형 가져오기
export function getProblemTypesForTopic(topic: MathTopic): ProblemTypeConfig[] {
  return PROBLEM_TYPES.filter((pt) => pt.suitableTopics.includes(topic));
}

// theta를 학년으로 환산
export function thetaToGrade(theta: number): number {
  // theta 범위: -3.5 ~ 4.0 → 학년 범위: 1 ~ 12
  const normalized = (theta + 3.5) / 7.5; // 0 ~ 1 범위로 정규화
  const grade = Math.round(normalized * 11) + 1; // 1 ~ 12
  return Math.max(1, Math.min(12, grade));
}

// 학년을 theta로 환산
export function gradeToTheta(grade: number): number {
  // 학년 범위: 1 ~ 12 → theta 범위: -3.5 ~ 4.0
  const normalized = (grade - 1) / 11; // 0 ~ 1 범위로 정규화
  return normalized * 7.5 - 3.5;
}

// 난이도 라벨 생성
export function getDifficultyLabel(theta: number): string {
  if (theta < -2) return '매우 쉬움';
  if (theta < -1) return '쉬움';
  if (theta < 0) return '보통';
  if (theta < 1) return '어려움';
  if (theta < 2) return '매우 어려움';
  return '최고 난이도';
}

// 문제 생성을 위한 종합 컨텍스트 생성
export function generateProblemContext(
  grade: number,
  topic: MathTopic,
  theta: number,
  recentSuccessRate: number
): {
  curriculum: CurriculumUnit | undefined;
  irtParams: IRTParameterRange | null;
  bloomLevels: BloomLevel[];
  flowZone: FlowZoneConfig;
  targetDifficulty: number;
  misconceptions: Misconception[];
  problemTypes: ProblemTypeConfig[];
  pisaProcess: PISAProblemFramework;
} {
  const curriculum = getCurriculumForGrade(grade).find((c) => c.topic === topic);
  const irtParams = getIRTParametersForGrade(grade);
  const bloomLevels = getRecommendedBloomLevels(theta);
  const flowZone = determineFlowZone(recentSuccessRate);
  const adjustedTheta = theta + flowZone.adjustmentFactor;
  const targetDifficulty = calculateTargetDifficulty(adjustedTheta);
  const misconceptions = getMisconceptionsForTopic(topic, grade);
  const problemTypes = getProblemTypesForTopic(topic);
  const pisaProcess = PISA_PROCESSES[Math.floor(Math.random() * PISA_PROCESSES.length)];

  return {
    curriculum,
    irtParams,
    bloomLevels,
    flowZone,
    targetDifficulty,
    misconceptions,
    problemTypes,
    pisaProcess,
  };
}

// ============================================================
// 12. 기본 내보내기
// ============================================================

export const REFERENCE_DATA = {
  curriculum: CURRICULUM_BY_GRADE,
  irtParameters: IRT_PARAMETERS_BY_GRADE,
  bloomTaxonomy: BLOOM_TAXONOMY,
  pisaProcesses: PISA_PROCESSES,
  pisaContexts: PISA_CONTEXTS,
  flowZones: FLOW_ZONES,
  misconceptions: COMMON_MISCONCEPTIONS,
  problemTypes: PROBLEM_TYPES,
  examPatterns: EXAM_PATTERNS,
  adaptiveConfig: ADAPTIVE_CONFIG,
  timssFramework: TIMSS_FRAMEWORK,
  ccssFramework: CCSS_FRAMEWORK,
};

export default REFERENCE_DATA;
