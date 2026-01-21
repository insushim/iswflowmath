'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { MathText } from '@/components/ui/math';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  getDiagnosticResult,
  saveDiagnosticResult,
  resetDiagnostic,
} from '@/lib/firebase/firestore';

// 몰입 문제 난이도 타입
type ImmersionDifficulty = '5min' | '10min' | '30min' | '1hour' | '1day' | '3days' | '7days' | '1month';

// 몰입 세션 정의
interface ImmersionSession {
  id: ImmersionDifficulty;
  name: string;
  duration: string;
  description: string;
  icon: string;
  color: string;
  xpReward: number;
}

const IMMERSION_SESSIONS: ImmersionSession[] = [
  {
    id: '5min',
    name: '5분 집중',
    duration: '5분',
    description: '짧고 빠른 워밍업 문제',
    icon: '⚡',
    color: 'from-yellow-400 to-orange-500',
    xpReward: 50,
  },
  {
    id: '10min',
    name: '10분 도전',
    duration: '10분',
    description: '사고력이 필요한 응용 문제',
    icon: '🎯',
    color: 'from-blue-400 to-blue-600',
    xpReward: 100,
  },
  {
    id: '30min',
    name: '30분 심화',
    duration: '30분',
    description: '깊은 분석이 필요한 심화 문제',
    icon: '🔥',
    color: 'from-orange-400 to-red-500',
    xpReward: 200,
  },
  {
    id: '1hour',
    name: '1시간 몰입',
    duration: '1시간',
    description: '고도의 논리적 사고력 문제',
    icon: '🧠',
    color: 'from-purple-400 to-purple-600',
    xpReward: 400,
  },
  {
    id: '1day',
    name: '하루 탐구',
    duration: '하루',
    description: '장시간 몰두하는 탐구형 문제',
    icon: '📚',
    color: 'from-green-400 to-emerald-600',
    xpReward: 800,
  },
  {
    id: '3days',
    name: '3일 프로젝트',
    duration: '3일',
    description: '여러 개념을 통합하는 프로젝트',
    icon: '🏗️',
    color: 'from-cyan-400 to-teal-600',
    xpReward: 1500,
  },
  {
    id: '7days',
    name: '일주일 연구',
    duration: '7일',
    description: '수학적 증명과 일반화 연구',
    icon: '🔬',
    color: 'from-indigo-400 to-violet-600',
    xpReward: 3000,
  },
  {
    id: '1month',
    name: '한달 마스터',
    duration: '한 달',
    description: '올림피아드 수준의 극한 도전',
    icon: '👑',
    color: 'from-amber-400 to-yellow-600',
    xpReward: 10000,
  },
];

// 단계 정의
type Step = 'grade_select' | 'diagnostic' | 'session_select' | 'solving';

export default function PracticePage() {
  // 인증 상태
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 진행 단계
  const [step, setStep] = useState<Step>('grade_select');

  // 학년 및 진단 결과
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [diagnosticCompleted, setDiagnosticCompleted] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<{
    estimatedLevel: number;
    theta: number;
    grade: number;
  } | null>(null);

  // 진단 테스트 상태
  const [diagnosticProgress, setDiagnosticProgress] = useState(0);
  const [diagnosticProblem, setDiagnosticProblem] = useState<{
    content: string;
    options: string[];
    correct_answer: string;
    topic: string;
  } | null>(null);
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<boolean[]>([]);

  // 몰입 문제 상태
  const [selectedSession, setSelectedSession] = useState<ImmersionSession | null>(null);
  const [currentProblem, setCurrentProblem] = useState<{
    content: string;
    hints: string[];
    solution: string;
    topic: string;
    estimatedTime: string;
  } | null>(null);
  const [showHints, setShowHints] = useState<number>(0);
  const [showSolution, setShowSolution] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [timer, setTimer] = useState(0);
  const [problemLoading, setProblemLoading] = useState(false);

  // 인증 확인 및 기존 진단 결과 로드
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const result = await getDiagnosticResult(firebaseUser.uid);
          if (result.completed && result.result) {
            setDiagnosticCompleted(true);
            setDiagnosticResult({
              estimatedLevel: result.estimatedLevel,
              theta: result.theta,
              grade: result.grade,
            });
            setSelectedGrade(result.grade);
            setStep('session_select');
          }
        } catch (error) {
          console.error('Error loading diagnostic result:', error);
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 타이머
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'solving' && currentProblem) {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, currentProblem]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 학년 선택 완료
  const handleGradeSelect = (grade: number) => {
    setSelectedGrade(grade);
    setStep('diagnostic');
    startDiagnostic(grade);
  };

  // 진단 테스트 시작
  const startDiagnostic = async (grade: number) => {
    setDiagnosticProgress(0);
    setDiagnosticAnswers([]);
    await generateDiagnosticProblem(grade, 0);
  };

  // 진단 문제 생성
  const generateDiagnosticProblem = async (grade: number, currentProgress: number) => {
    setProblemLoading(true);

    try {
      const topics = ['arithmetic', 'fractions', 'algebra', 'geometry', 'functions'];
      const topic = topics[currentProgress % topics.length];
      const currentTheta = diagnosticAnswers.filter(Boolean).length * 0.4 - 1;

      const response = await fetch('/api/problems/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          theta: currentTheta,
          grade,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate');

      const data = await response.json();
      setDiagnosticProblem({
        content: data.problem.content,
        options: data.problem.options,
        correct_answer: data.problem.correct_answer,
        topic: data.problem.topic,
      });
    } catch (error) {
      console.error('Error:', error);
      // 폴백
      setDiagnosticProblem({
        content: `${grade}학년 수준 진단 문제 ${currentProgress + 1}: 다음을 계산하시오. $${Math.floor(Math.random() * 50) + 10} + ${Math.floor(Math.random() * 50) + 10}$`,
        options: ['75', '82', '68', '91'],
        correct_answer: '75',
        topic: 'arithmetic',
      });
    } finally {
      setProblemLoading(false);
    }
  };

  // 진단 답안 제출
  const submitDiagnosticAnswer = async (answer: string) => {
    if (!diagnosticProblem || !selectedGrade) return;

    const isCorrect = answer === diagnosticProblem.correct_answer;
    const newAnswers = [...diagnosticAnswers, isCorrect];
    setDiagnosticAnswers(newAnswers);

    const newProgress = diagnosticProgress + 1;
    setDiagnosticProgress(newProgress);

    if (newProgress >= 10) {
      // 진단 완료
      await completeDiagnostic(newAnswers);
    } else {
      await generateDiagnosticProblem(selectedGrade, newProgress);
    }
  };

  // 진단 완료
  const completeDiagnostic = async (answers: boolean[]) => {
    if (!user || !selectedGrade) return;

    const correctCount = answers.filter(Boolean).length;
    const accuracy = correctCount / answers.length;

    const estimatedLevel = Math.round(selectedGrade - 2 + accuracy * 4);
    const theta = (accuracy - 0.5) * 4;

    const result = {
      estimatedLevel: Math.max(1, Math.min(12, estimatedLevel)),
      theta,
      grade: selectedGrade,
      strengths: accuracy > 0.7 ? ['arithmetic', 'algebra'] : ['arithmetic'],
      weaknesses: accuracy < 0.5 ? ['functions', 'geometry'] : [],
      answers: answers.map((correct, i) => ({
        problemId: `diag-${i}`,
        correct,
        topic: ['arithmetic', 'fractions', 'algebra', 'geometry', 'functions'][i % 5],
      })),
    };

    try {
      await saveDiagnosticResult(user.uid, result);
    } catch (error) {
      console.error('Error saving diagnostic:', error);
    }

    setDiagnosticResult({
      estimatedLevel: result.estimatedLevel,
      theta: result.theta,
      grade: selectedGrade,
    });
    setDiagnosticCompleted(true);
    setStep('session_select');
  };

  // 진단 다시 하기
  const handleResetDiagnostic = async () => {
    if (!user) return;

    try {
      await resetDiagnostic(user.uid);
    } catch (error) {
      console.error('Error resetting diagnostic:', error);
    }

    setDiagnosticCompleted(false);
    setDiagnosticResult(null);
    setSelectedGrade(null);
    setStep('grade_select');
  };

  // 세션 시작
  const startSession = async (session: ImmersionSession) => {
    if (!diagnosticResult) return;

    setSelectedSession(session);
    setTimer(0);
    setShowHints(0);
    setShowSolution(false);
    setUserAnswer('');
    setStep('solving');

    await generateImmersionProblem(session.id);
  };

  // 몰입 문제 생성
  const generateImmersionProblem = async (difficulty: ImmersionDifficulty) => {
    if (!diagnosticResult) return;

    setProblemLoading(true);

    try {
      const response = await fetch('/api/problems/immersion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: diagnosticResult.grade,
          theta: diagnosticResult.theta,
          difficulty,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate');

      const data = await response.json();
      setCurrentProblem(data.problem);
    } catch (error) {
      console.error('Error:', error);
      setCurrentProblem({
        content: '문제를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.',
        hints: ['새로고침 해보세요'],
        solution: '다시 시도해주세요.',
        topic: '일반',
        estimatedTime: '5분',
      });
    } finally {
      setProblemLoading(false);
    }
  };

  // 세션 종료
  const endSession = () => {
    setStep('session_select');
    setSelectedSession(null);
    setCurrentProblem(null);
  };

  // 새 문제 요청
  const requestNewProblem = async () => {
    if (!selectedSession) return;
    setShowHints(0);
    setShowSolution(false);
    setUserAnswer('');
    setTimer(0);
    await generateImmersionProblem(selectedSession.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // ==========================================
  // 1단계: 학년 선택
  // ==========================================
  if (step === 'grade_select') {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">몰입수학에 오신 것을 환영합니다!</h1>
          <p className="text-gray-600 text-lg">
            맞춤형 학습을 위해 먼저 학년을 선택해주세요.
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">초등학교</h2>
          <div className="grid grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((grade) => (
              <button
                key={grade}
                onClick={() => handleGradeSelect(grade)}
                className="p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
              >
                <div className="text-2xl font-bold text-blue-600">{grade}</div>
                <div className="text-xs text-gray-500">학년</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">중학교</h2>
          <div className="grid grid-cols-3 gap-3">
            {[7, 8, 9].map((grade) => (
              <button
                key={grade}
                onClick={() => handleGradeSelect(grade)}
                className="p-4 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all text-center"
              >
                <div className="text-2xl font-bold text-green-600">{grade - 6}</div>
                <div className="text-xs text-gray-500">학년</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">고등학교</h2>
          <div className="grid grid-cols-3 gap-3">
            {[10, 11, 12].map((grade) => (
              <button
                key={grade}
                onClick={() => handleGradeSelect(grade)}
                className="p-4 rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all text-center"
              >
                <div className="text-2xl font-bold text-purple-600">{grade - 9}</div>
                <div className="text-xs text-gray-500">학년</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2단계: 진단 테스트
  // ==========================================
  if (step === 'diagnostic') {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              진단 테스트 ({selectedGrade}학년)
            </span>
            <span className="text-sm text-gray-600">{diagnosticProgress + 1} / 10</span>
          </div>
          <Progress value={(diagnosticProgress / 10) * 100} className="h-2" />
        </div>

        {problemLoading ? (
          <Card className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">문제를 준비하고 있습니다...</p>
          </Card>
        ) : diagnosticProblem ? (
          <Card>
            <CardContent className="p-8">
              <Badge variant="outline" className="mb-4">
                {diagnosticProblem.topic}
              </Badge>

              <MathText className="text-xl font-medium mb-6">
                {diagnosticProblem.content}
              </MathText>

              <div className="grid grid-cols-2 gap-4">
                {diagnosticProblem.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => submitDiagnosticAnswer(option)}
                    className="p-4 text-left rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center"
                  >
                    <span className="font-medium mr-3">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <MathText>{option}</MathText>
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
  // 3단계: 세션 선택
  // ==========================================
  if (step === 'session_select') {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        {/* 진단 결과 */}
        {diagnosticResult && (
          <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {diagnosticResult.estimatedLevel}
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    추정 실력: {diagnosticResult.estimatedLevel}학년 수준
                  </h3>
                  <p className="text-gray-600">
                    선택 학년: {diagnosticResult.grade}학년 | 능력 지수: {diagnosticResult.theta.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={handleResetDiagnostic}
                  className="ml-auto text-sm text-gray-500 hover:text-blue-600 underline"
                >
                  다시 진단하기
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 몰입 문제 선택 */}
        <h1 className="text-2xl font-bold mb-2">몰입 학습</h1>
        <p className="text-gray-600 mb-8">
          한 문제에 집중하여 깊이 있는 학습을 경험하세요.
          <br />
          <span className="text-sm">각 난이도는 문제를 푸는 데 걸리는 예상 시간입니다.</span>
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {IMMERSION_SESSIONS.map((session) => (
            <Card
              key={session.id}
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
              onClick={() => startSession(session)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${session.color} flex items-center justify-center text-2xl`}>
                    {session.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{session.name}</h3>
                    <p className="text-gray-600 text-sm">{session.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span>⏱️ {session.duration}</span>
                      <Badge variant="xp" className="text-xs">+{session.xpReward} XP</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ==========================================
  // 4단계: 문제 풀이
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {selectedSession && (
              <Badge className={`bg-gradient-to-r ${selectedSession.color} text-white`}>
                {selectedSession.icon} {selectedSession.name}
              </Badge>
            )}
            <span className="text-sm text-gray-600">
              {currentProblem?.topic}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-lg font-mono font-bold">{formatTime(timer)}</span>
            <Button variant="outline" size="sm" onClick={endSession}>
              종료
            </Button>
          </div>
        </div>
      </div>

      {/* 문제 */}
      <div className="p-6 max-w-4xl mx-auto">
        {problemLoading ? (
          <Card className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">문제를 생성하고 있습니다...</p>
            <p className="text-sm text-gray-400 mt-2">AI가 당신의 수준에 맞는 문제를 만들고 있어요</p>
          </Card>
        ) : currentProblem ? (
          <>
            <Card className="mb-6">
              <CardContent className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline">{currentProblem.topic}</Badge>
                  <span className="text-sm text-gray-500">
                    예상 시간: {currentProblem.estimatedTime}
                  </span>
                </div>

                <MathText className="text-lg leading-relaxed mb-6 whitespace-pre-wrap">
                  {currentProblem.content}
                </MathText>

                {/* 힌트 섹션 */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">💡 힌트</h3>
                    <span className="text-sm text-gray-500">
                      {showHints}/{currentProblem.hints.length} 사용
                    </span>
                  </div>

                  {currentProblem.hints.slice(0, showHints).map((hint, index) => (
                    <div
                      key={index}
                      className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-2"
                    >
                      <MathText className="text-sm">
                        {`힌트 ${index + 1}: ${hint}`}
                      </MathText>
                    </div>
                  ))}

                  {showHints < currentProblem.hints.length && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowHints(showHints + 1)}
                    >
                      다음 힌트 보기
                    </Button>
                  )}
                </div>

                {/* 답안 작성 */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="font-medium mb-3">✏️ 내 풀이</h3>
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="여기에 풀이 과정과 답을 작성하세요..."
                    className="w-full p-4 border rounded-lg min-h-[150px] resize-y"
                  />
                </div>

                {/* 정답 확인 */}
                <div className="flex gap-4 mt-6">
                  <Button
                    variant="gradient"
                    size="lg"
                    className="flex-1"
                    onClick={() => setShowSolution(true)}
                  >
                    정답 확인하기
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={requestNewProblem}
                  >
                    새 문제
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 풀이 */}
            {showSolution && (
              <Card className="border-green-200 bg-green-50/50">
                <CardContent className="p-8">
                  <h3 className="text-lg font-bold mb-4 text-green-700">📝 풀이</h3>
                  <MathText className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {currentProblem.solution}
                  </MathText>

                  <div className="flex gap-4 mt-6">
                    <Button
                      variant="success"
                      size="lg"
                      className="flex-1"
                      onClick={requestNewProblem}
                    >
                      다음 문제 도전 (+{selectedSession?.xpReward} XP)
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={endSession}
                    >
                      세션 종료
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
