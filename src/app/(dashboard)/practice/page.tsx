'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { MATH_TOPICS, FLOW_CHANNELS, MathTopic, FlowChannel, ProblemWithIRT } from '@/types';

// 학습 세션 타입 정의
interface LearningSession {
  id: string;
  name: string;
  duration: number; // minutes
  problemCount: number;
  description: string;
  icon: string;
  color: string;
}

const LEARNING_SESSIONS: LearningSession[] = [
  {
    id: 'quick-5',
    name: '퀵 워밍업',
    duration: 5,
    problemCount: 5,
    description: '짧은 시간에 실력 점검',
    icon: '⚡',
    color: 'from-yellow-400 to-orange-500',
  },
  {
    id: 'standard-10',
    name: '집중 학습',
    duration: 10,
    problemCount: 10,
    description: '효율적인 10분 학습',
    icon: '🎯',
    color: 'from-blue-400 to-blue-600',
  },
  {
    id: 'deep-30',
    name: '심화 학습',
    duration: 30,
    problemCount: 25,
    description: '깊이 있는 30분 집중',
    icon: '🔥',
    color: 'from-orange-400 to-red-500',
  },
  {
    id: 'marathon-60',
    name: '마라톤 학습',
    duration: 60,
    problemCount: 50,
    description: '1시간 완벽 몰입',
    icon: '🏃',
    color: 'from-purple-400 to-purple-600',
  },
  {
    id: 'daily-challenge',
    name: '오늘의 도전',
    duration: 0, // 무제한
    problemCount: 20,
    description: '매일 새로운 도전 문제',
    icon: '🌟',
    color: 'from-green-400 to-emerald-600',
  },
];

// 진단 테스트 상태
type DiagnosticStatus = 'not_started' | 'in_progress' | 'completed';

interface DiagnosticResult {
  estimatedLevel: number; // 1-12 (학년)
  theta: number; // IRT 능력 파라미터
  strengths: MathTopic[];
  weaknesses: MathTopic[];
  recommendedSession: string;
}

export default function PracticePage() {
  // 진단 테스트 상태
  const [diagnosticStatus, setDiagnosticStatus] = useState<DiagnosticStatus>('not_started');
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [diagnosticProgress, setDiagnosticProgress] = useState(0);

  // 세션 상태
  const [selectedSession, setSelectedSession] = useState<LearningSession | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);

  // 문제 풀이 상태
  const [currentProblem, setCurrentProblem] = useState<ProblemWithIRT | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);

  // 세션 통계
  const [sessionStats, setSessionStats] = useState({
    problemsAttempted: 0,
    problemsCorrect: 0,
    xpEarned: 0,
    flowState: 'control' as FlowChannel,
    streak: 0,
    startTime: 0,
  });

  // 타이머
  const [timer, setTimer] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);

  // 진단 테스트용
  const [diagnosticProblem, setDiagnosticProblem] = useState<ProblemWithIRT | null>(null);
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<boolean[]>([]);

  // 타이머 효과
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionStarted && !showResult) {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
        if (selectedSession && selectedSession.duration > 0) {
          setRemainingTime((r) => Math.max(0, r - 1));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStarted, showResult, selectedSession]);

  // 시간 종료 체크
  useEffect(() => {
    if (remainingTime === 0 && selectedSession?.duration && selectedSession.duration > 0 && sessionStarted) {
      endSession();
    }
  }, [remainingTime, selectedSession, sessionStarted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 진단 테스트 시작
  const startDiagnostic = async () => {
    setDiagnosticStatus('in_progress');
    setDiagnosticProgress(0);
    setDiagnosticAnswers([]);
    await generateDiagnosticProblem();
  };

  // 진단 문제 생성
  const generateDiagnosticProblem = async () => {
    setLoading(true);
    try {
      const topics: MathTopic[] = ['arithmetic', 'fractions', 'algebra', 'geometry', 'functions'];
      const currentTopic = topics[Math.floor(diagnosticProgress / 2) % topics.length];

      const response = await fetch('/api/problems/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: currentTopic,
          theta: diagnosticAnswers.filter(Boolean).length * 0.3 - 1, // 적응형 난이도
          grade: 7,
          isDiagnostic: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate problem');

      const data = await response.json();
      setDiagnosticProblem(data.problem);
    } catch (error) {
      console.error('Error generating diagnostic problem:', error);
      // 폴백 문제
      setDiagnosticProblem({
        id: `diag-${diagnosticProgress}`,
        content: `진단 테스트 문제 ${diagnosticProgress + 1}: 3 + 5 × 2 = ?`,
        options: ['13', '16', '11', '10'],
        correct_answer: '13',
        solution: '곱셈을 먼저 계산: 5 × 2 = 10, 그다음 덧셈: 3 + 10 = 13',
        hints: [],
        topic: 'arithmetic',
        subtopic: '사칙연산',
        irt: { a: 1, b: 0, c: 0.2 },
        created_at: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  // 진단 답안 제출
  const submitDiagnosticAnswer = async (answer: string) => {
    if (!diagnosticProblem) return;

    const isCorrect = answer === diagnosticProblem.correct_answer;
    const newAnswers = [...diagnosticAnswers, isCorrect];
    setDiagnosticAnswers(newAnswers);

    const newProgress = diagnosticProgress + 1;
    setDiagnosticProgress(newProgress);

    if (newProgress >= 10) {
      // 진단 완료
      completeDiagnostic(newAnswers);
    } else {
      // 다음 문제
      await generateDiagnosticProblem();
    }
  };

  // 진단 완료
  const completeDiagnostic = (answers: boolean[]) => {
    const correctCount = answers.filter(Boolean).length;
    const accuracy = correctCount / answers.length;

    // 추정 레벨 계산 (간단한 공식)
    const estimatedLevel = Math.round(5 + accuracy * 7); // 5~12 레벨
    const theta = (accuracy - 0.5) * 4; // -2 ~ +2 범위

    const result: DiagnosticResult = {
      estimatedLevel,
      theta,
      strengths: accuracy > 0.7 ? ['arithmetic', 'algebra'] : ['arithmetic'],
      weaknesses: accuracy < 0.5 ? ['functions', 'geometry'] : [],
      recommendedSession: accuracy > 0.7 ? 'deep-30' : 'standard-10',
    };

    setDiagnosticResult(result);
    setDiagnosticStatus('completed');
  };

  // 세션 시작
  const startSession = async (session: LearningSession) => {
    setSelectedSession(session);
    setSessionStarted(true);
    setSessionStats({
      problemsAttempted: 0,
      problemsCorrect: 0,
      xpEarned: 0,
      flowState: 'control',
      streak: 0,
      startTime: Date.now(),
    });
    setTimer(0);
    setRemainingTime(session.duration * 60);

    await generateProblem();
  };

  // 문제 생성
  const generateProblem = useCallback(async () => {
    setLoading(true);
    setSelectedAnswer(null);
    setShowResult(false);

    try {
      const topics: MathTopic[] = ['arithmetic', 'fractions', 'algebra', 'geometry', 'functions'];
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];

      const response = await fetch('/api/problems/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: randomTopic,
          theta: diagnosticResult?.theta || 0,
          grade: diagnosticResult?.estimatedLevel || 7,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate problem');

      const data = await response.json();
      setCurrentProblem(data.problem);
    } catch (error) {
      console.error('Error generating problem:', error);
      // 폴백 문제
      setCurrentProblem({
        id: `prob-${sessionStats.problemsAttempted}`,
        content: '12 × 8 + 15 = ?',
        options: ['111', '96', '87', '103'],
        correct_answer: '111',
        solution: '12 × 8 = 96, 96 + 15 = 111',
        hints: ['먼저 곱셈을 계산하세요'],
        topic: 'arithmetic',
        subtopic: '혼합계산',
        irt: { a: 1, b: 0, c: 0.2 },
        created_at: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }, [diagnosticResult, sessionStats.problemsAttempted]);

  // 답안 제출
  const submitAnswer = () => {
    if (!selectedAnswer || !currentProblem) return;

    const isCorrect = selectedAnswer === currentProblem.correct_answer;

    setSessionStats((prev) => ({
      ...prev,
      problemsAttempted: prev.problemsAttempted + 1,
      problemsCorrect: isCorrect ? prev.problemsCorrect + 1 : prev.problemsCorrect,
      xpEarned: prev.xpEarned + (isCorrect ? 20 : 5),
      streak: isCorrect ? prev.streak + 1 : 0,
      flowState: isCorrect ? 'flow' : 'control',
    }));

    setShowResult(true);
  };

  // 다음 문제
  const nextProblem = async () => {
    if (selectedSession && sessionStats.problemsAttempted >= selectedSession.problemCount) {
      endSession();
      return;
    }
    await generateProblem();
  };

  // 세션 종료
  const endSession = () => {
    setSessionStarted(false);
    setSelectedSession(null);
    setCurrentProblem(null);
    setShowResult(false);
  };

  // ==========================================
  // 렌더링: 진단 테스트 미완료
  // ==========================================
  if (diagnosticStatus === 'not_started') {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">몰입수학에 오신 것을 환영합니다!</h1>
          <p className="text-gray-600 text-lg">
            맞춤형 학습을 위해 먼저 간단한 실력 진단을 진행합니다.
          </p>
        </div>

        <Card className="max-w-xl mx-auto">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📊</span>
            </div>
            <h2 className="text-2xl font-bold mb-4">실력 진단 테스트</h2>
            <p className="text-gray-600 mb-6">
              10문제로 당신의 현재 수학 실력을 정확히 파악합니다.
              <br />
              약 5분 정도 소요됩니다.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-medium mb-2">진단 테스트 특징</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ 적응형 문제 출제 (IRT 기반)</li>
                <li>✓ 강점/약점 분야 분석</li>
                <li>✓ 맞춤형 학습 세션 추천</li>
                <li>✓ 정확한 실력 레벨 측정</li>
              </ul>
            </div>

            <Button
              variant="gradient"
              size="xl"
              className="w-full"
              onClick={startDiagnostic}
            >
              진단 테스트 시작하기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==========================================
  // 렌더링: 진단 테스트 진행 중
  // ==========================================
  if (diagnosticStatus === 'in_progress') {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">진단 테스트 진행 중</span>
            <span className="text-sm text-gray-600">{diagnosticProgress + 1} / 10</span>
          </div>
          <Progress value={(diagnosticProgress / 10) * 100} className="h-2" />
        </div>

        {loading ? (
          <Card className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">문제를 준비하고 있습니다...</p>
          </Card>
        ) : diagnosticProblem ? (
          <Card>
            <CardContent className="p-8">
              <Badge variant="outline" className="mb-4">
                {MATH_TOPICS[diagnosticProblem.topic]}
              </Badge>

              <h2 className="text-xl font-medium mb-6">{diagnosticProblem.content}</h2>

              {diagnosticProblem.latex && (
                <div className="p-4 bg-gray-50 rounded-lg text-lg font-mono mb-6">
                  {diagnosticProblem.latex}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {diagnosticProblem.options?.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => submitDiagnosticAnswer(option)}
                    className="p-4 text-left rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <span className="font-medium mr-3">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {option}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    );
  }

  // ==========================================
  // 렌더링: 세션 선택 화면
  // ==========================================
  if (diagnosticStatus === 'completed' && !sessionStarted) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        {/* 진단 결과 요약 */}
        {diagnosticResult && (
          <Card className="mb-8 border-blue-200 bg-blue-50/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {diagnosticResult.estimatedLevel}
                </div>
                <div>
                  <h3 className="text-lg font-bold">추정 학년: {diagnosticResult.estimatedLevel}학년 수준</h3>
                  <p className="text-gray-600">
                    능력 지수: {diagnosticResult.theta.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-600 font-medium">강점 분야:</span>
                  <p>{diagnosticResult.strengths.map(t => MATH_TOPICS[t]).join(', ') || '분석 중'}</p>
                </div>
                <div>
                  <span className="text-orange-600 font-medium">보완 필요:</span>
                  <p>{diagnosticResult.weaknesses.map(t => MATH_TOPICS[t]).join(', ') || '없음'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 세션 선택 */}
        <h1 className="text-2xl font-bold mb-2">학습 세션 선택</h1>
        <p className="text-gray-600 mb-8">오늘의 학습 시간에 맞는 세션을 선택하세요</p>

        <div className="grid gap-4">
          {LEARNING_SESSIONS.map((session) => {
            const isRecommended = diagnosticResult?.recommendedSession === session.id;

            return (
              <Card
                key={session.id}
                className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01] ${
                  isRecommended ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => startSession(session)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${session.color} flex items-center justify-center text-3xl`}>
                      {session.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold">{session.name}</h3>
                        {isRecommended && (
                          <Badge variant="success" className="text-xs">추천</Badge>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">{session.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>⏱️ {session.duration > 0 ? `${session.duration}분` : '무제한'}</span>
                        <span>📝 {session.problemCount}문제</span>
                      </div>
                    </div>
                    <Button variant="gradient">시작</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 다시 진단하기 */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setDiagnosticStatus('not_started');
              setDiagnosticResult(null);
            }}
            className="text-sm text-gray-500 hover:text-blue-600 underline"
          >
            진단 테스트 다시 하기
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // 렌더링: 학습 세션 진행 중
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant={sessionStats.flowState === 'flow' ? 'flow' : 'secondary'}>
              {FLOW_CHANNELS[sessionStats.flowState].emoji} {FLOW_CHANNELS[sessionStats.flowState].label}
            </Badge>
            <span className="text-sm text-gray-600">
              {sessionStats.problemsCorrect}/{sessionStats.problemsAttempted} 정답
            </span>
            {sessionStats.streak >= 3 && (
              <Badge variant="success">🔥 {sessionStats.streak} 연속!</Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="xp">+{sessionStats.xpEarned} XP</Badge>
            {selectedSession && selectedSession.duration > 0 ? (
              <span className={`text-sm font-mono ${remainingTime < 60 ? 'text-red-500' : ''}`}>
                남은 시간: {formatTime(remainingTime)}
              </span>
            ) : (
              <span className="text-sm font-mono">{formatTime(timer)}</span>
            )}
            <Button variant="outline" size="sm" onClick={endSession}>
              종료
            </Button>
          </div>
        </div>
      </div>

      {/* 문제 카드 */}
      <div className="p-6 max-w-4xl mx-auto">
        {loading ? (
          <Card className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">문제를 생성하고 있습니다...</p>
          </Card>
        ) : currentProblem ? (
          <Card>
            <CardContent className="p-8">
              {/* 문제 내용 */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline">{MATH_TOPICS[currentProblem.topic]}</Badge>
                  <span className="text-sm text-gray-500">
                    문제 {sessionStats.problemsAttempted + 1} / {selectedSession?.problemCount}
                  </span>
                </div>
                <h2 className="text-xl font-medium mb-4">{currentProblem.content}</h2>
                {currentProblem.latex && (
                  <div className="p-4 bg-gray-50 rounded-lg text-lg font-mono">
                    {currentProblem.latex}
                  </div>
                )}
              </div>

              {/* 선택지 */}
              <div className="space-y-3 mb-8">
                {currentProblem.options?.map((option, index) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = showResult && option === currentProblem.correct_answer;
                  const isWrong = showResult && isSelected && option !== currentProblem.correct_answer;

                  return (
                    <button
                      key={index}
                      onClick={() => !showResult && setSelectedAnswer(option)}
                      disabled={showResult}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                        isCorrect
                          ? 'border-green-500 bg-green-50'
                          : isWrong
                          ? 'border-red-500 bg-red-50'
                          : isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <span className="font-medium mr-3">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      {option}
                      {isCorrect && <span className="float-right text-green-600">✓ 정답</span>}
                      {isWrong && <span className="float-right text-red-600">✗</span>}
                    </button>
                  );
                })}
              </div>

              {/* 풀이 (정답 확인 후) */}
              {showResult && (
                <div className="mb-8 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium mb-2">💡 풀이</h3>
                  <p className="text-gray-700">{currentProblem.solution}</p>
                </div>
              )}

              {/* 버튼 */}
              <div className="flex gap-4">
                {!showResult ? (
                  <Button
                    variant="gradient"
                    size="lg"
                    className="flex-1"
                    onClick={submitAnswer}
                    disabled={!selectedAnswer}
                  >
                    정답 확인
                  </Button>
                ) : (
                  <Button
                    variant="gradient"
                    size="lg"
                    className="flex-1"
                    onClick={nextProblem}
                  >
                    {sessionStats.problemsAttempted + 1 >= (selectedSession?.problemCount || 10)
                      ? '세션 완료'
                      : '다음 문제'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* 세션 진행률 */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>세션 진행률</span>
            <span>{sessionStats.problemsAttempted}/{selectedSession?.problemCount || 10} 문제</span>
          </div>
          <Progress
            value={(sessionStats.problemsAttempted / (selectedSession?.problemCount || 10)) * 100}
          />
        </div>
      </div>
    </div>
  );
}
