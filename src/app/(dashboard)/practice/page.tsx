'use client';

import { useState, useEffect, useCallback } from 'react';
import { MathText } from '@/components/ui/math';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  getDiagnosticResult,
  saveDiagnosticResult,
  resetDiagnostic,
} from '@/lib/firebase/firestore';
import {
  Zap,
  Target,
  Flame,
  Brain,
  BookOpen,
  Building2,
  FlaskConical,
  Crown,
  Clock,
  Lightbulb,
  CheckCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
  Play,
  Pause,
  SkipForward,
  Eye,
  ChevronRight,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

// 게이미피케이션 임포트
import { processProblemResult, processSessionComplete, type XpGainResult } from '@/lib/gamification/xp-system';
import { recordActivity, isFirstActivityToday, getStreakData, type StreakData } from '@/lib/gamification/streak';
import { XpGainNotification, XpToast } from '@/components/gamification/XpGainNotification';
import { AchievementUnlock } from '@/components/gamification/AchievementUnlock';

// 몰입 문제 난이도 타입
type ImmersionDifficulty = '5min' | '10min' | '30min' | '1hour' | '1day' | '3days' | '7days' | '1month';

// 몰입 세션 정의
interface ImmersionSession {
  id: ImmersionDifficulty;
  name: string;
  duration: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  xpReward: number;
}

const IMMERSION_SESSIONS: ImmersionSession[] = [
  {
    id: '5min',
    name: '5분 집중',
    duration: '5분',
    description: '짧고 빠른 워밍업 문제',
    icon: Zap,
    gradient: 'from-amber-500 to-orange-600',
    xpReward: 50,
  },
  {
    id: '10min',
    name: '10분 도전',
    duration: '10분',
    description: '사고력이 필요한 응용 문제',
    icon: Target,
    gradient: 'from-blue-500 to-indigo-600',
    xpReward: 100,
  },
  {
    id: '30min',
    name: '30분 심화',
    duration: '30분',
    description: '깊은 분석이 필요한 심화 문제',
    icon: Flame,
    gradient: 'from-orange-500 to-red-600',
    xpReward: 200,
  },
  {
    id: '1hour',
    name: '1시간 몰입',
    duration: '1시간',
    description: '고도의 논리적 사고력 문제',
    icon: Brain,
    gradient: 'from-violet-500 to-purple-600',
    xpReward: 400,
  },
  {
    id: '1day',
    name: '하루 탐구',
    duration: '하루',
    description: '장시간 몰두하는 탐구형 문제',
    icon: BookOpen,
    gradient: 'from-emerald-500 to-teal-600',
    xpReward: 800,
  },
  {
    id: '3days',
    name: '3일 프로젝트',
    duration: '3일',
    description: '여러 개념을 통합하는 프로젝트',
    icon: Building2,
    gradient: 'from-cyan-500 to-blue-600',
    xpReward: 1500,
  },
  {
    id: '7days',
    name: '일주일 연구',
    duration: '7일',
    description: '수학적 증명과 일반화 연구',
    icon: FlaskConical,
    gradient: 'from-indigo-500 to-violet-600',
    xpReward: 3000,
  },
  {
    id: '1month',
    name: '한달 마스터',
    duration: '한 달',
    description: '올림피아드 수준의 극한 도전',
    icon: Crown,
    gradient: 'from-amber-400 to-yellow-500',
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
  const [previousProblems, setPreviousProblems] = useState<string[]>([]);

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

  // 게이미피케이션 상태
  const [xpResult, setXpResult] = useState<XpGainResult | null>(null);
  const [unlockedAchievement, setUnlockedAchievement] = useState<string | null>(null);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [dailyFirst, setDailyFirst] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    totalProblems: 0,
    correctProblems: 0,
    startTime: 0,
    correctStreak: 0,
  });
  const [showXpToast, setShowXpToast] = useState<number | null>(null);

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
    setPreviousProblems([]);
    await generateDiagnosticProblem(grade, 0, []);
  };

  // 진단 문제 생성
  const generateDiagnosticProblem = async (
    grade: number,
    currentProgress: number,
    prevProblems: string[]
  ) => {
    setProblemLoading(true);

    try {
      const diagnosticTopics = [
        'arithmetic', 'fractions', 'geometry', 'decimals', 'statistics',
        'algebra', 'fractions', 'geometry', 'arithmetic', 'probability',
      ];

      let topic = diagnosticTopics[currentProgress];
      if (grade <= 6 && (topic === 'algebra' || topic === 'functions')) {
        topic = 'arithmetic';
      }

      const currentTheta = prevProblems.length > 0
        ? (diagnosticAnswers.filter(Boolean).length * 0.4 - 1)
        : 0;

      const response = await fetch('/api/problems/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          theta: currentTheta,
          grade,
          previous_problems: prevProblems,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate');

      const data = await response.json();
      const newProblemContent = data.problem.content;
      const updatedPrevProblems = [...prevProblems, newProblemContent];
      setPreviousProblems(updatedPrevProblems);

      setDiagnosticProblem({
        content: newProblemContent,
        options: data.problem.options,
        correct_answer: data.problem.correct_answer,
        topic: data.problem.topic,
      });
    } catch (error) {
      console.error('Error:', error);
      const fallbackProblem = generateFallbackDiagnosticProblem(grade, currentProgress, prevProblems);
      setPreviousProblems([...prevProblems, fallbackProblem.content]);
      setDiagnosticProblem(fallbackProblem);
    } finally {
      setProblemLoading(false);
    }
  };

  // 폴백 진단 문제 생성
  const generateFallbackDiagnosticProblem = (
    grade: number,
    index: number,
    prevProblems: string[]
  ): { content: string; options: string[]; correct_answer: string; topic: string } => {
    const grade6Problems = [
      { content: '어떤 물건의 정가가 10,000원입니다. 20% 할인하면 판매 가격은?', options: ['8,000원', '7,000원', '9,000원', '6,000원'], correct_answer: '8,000원', topic: 'fractions' },
      { content: '3:5 = 9:□ 에서 □에 들어갈 수는?', options: ['15', '12', '18', '10'], correct_answer: '15', topic: 'algebra' },
      { content: '반지름이 7cm인 원의 넓이는? (원주율 = 3)', options: ['147cm²', '154cm²', '140cm²', '163cm²'], correct_answer: '147cm²', topic: 'geometry' },
      { content: '$\\frac{2}{3} ÷ \\frac{1}{4}$의 값은?', options: ['$\\frac{8}{3}$', '$\\frac{2}{12}$', '$\\frac{1}{6}$', '$\\frac{3}{8}$'], correct_answer: '$\\frac{8}{3}$', topic: 'fractions' },
      { content: '4.8 ÷ 1.2의 값은?', options: ['4', '3', '5', '6'], correct_answer: '4', topic: 'decimals' },
      { content: '시속 60km로 2시간 30분 동안 이동한 거리는?', options: ['150km', '120km', '180km', '140km'], correct_answer: '150km', topic: 'arithmetic' },
      { content: '전체의 25%가 50일 때, 전체는?', options: ['200', '150', '250', '100'], correct_answer: '200', topic: 'fractions' },
      { content: '윗변 6cm, 아랫변 10cm, 높이 4cm인 사다리꼴의 넓이는?', options: ['32cm²', '28cm²', '36cm²', '24cm²'], correct_answer: '32cm²', topic: 'geometry' },
      { content: '12, 15, 18, 21, □ 에서 □에 들어갈 수는?', options: ['24', '23', '25', '22'], correct_answer: '24', topic: 'arithmetic' },
      { content: '삼각형의 세 각이 50°, 60°, □°일 때 □는?', options: ['70', '80', '65', '75'], correct_answer: '70', topic: 'geometry' },
    ];

    const grade7Problems = [
      { content: '방정식 $2x + 5 = 13$의 해는?', options: ['4', '3', '5', '6'], correct_answer: '4', topic: 'algebra' },
      { content: '(-3) × (-4) + (-2)의 값은?', options: ['10', '14', '8', '12'], correct_answer: '10', topic: 'arithmetic' },
      { content: '점 A(-2, 3)은 몇 사분면에 있는가?', options: ['제2사분면', '제1사분면', '제3사분면', '제4사분면'], correct_answer: '제2사분면', topic: 'geometry' },
      { content: '|-7| + |3|의 값은?', options: ['10', '4', '-4', '-10'], correct_answer: '10', topic: 'arithmetic' },
      { content: '일차방정식 $3x - 2 = x + 6$의 해는?', options: ['4', '2', '3', '5'], correct_answer: '4', topic: 'algebra' },
      { content: '두 점 (1, 2), (4, 6) 사이의 거리는?', options: ['5', '4', '6', '7'], correct_answer: '5', topic: 'geometry' },
      { content: '$\\frac{2}{3} + \\frac{1}{6}$의 값은?', options: ['$\\frac{5}{6}$', '$\\frac{1}{2}$', '$\\frac{3}{6}$', '$\\frac{4}{6}$'], correct_answer: '$\\frac{5}{6}$', topic: 'fractions' },
      { content: '정비례 $y = 3x$에서 $x = 4$일 때 $y$의 값은?', options: ['12', '7', '9', '15'], correct_answer: '12', topic: 'functions' },
      { content: '다항식 $3a + 2b - a + 5b$를 간단히 하면?', options: ['$2a + 7b$', '$4a + 7b$', '$2a + 3b$', '$4a + 3b$'], correct_answer: '$2a + 7b$', topic: 'algebra' },
      { content: '자료 2, 4, 6, 8, 10의 평균은?', options: ['6', '5', '7', '8'], correct_answer: '6', topic: 'statistics' },
    ];

    let problems = grade6Problems;
    if (grade >= 7) problems = grade7Problems;

    return problems[index % problems.length];
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
      await completeDiagnostic(newAnswers);
    } else {
      await generateDiagnosticProblem(selectedGrade, newProgress, previousProblems);
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
    if (!diagnosticResult || !user) return;

    setSelectedSession(session);
    setTimer(0);
    setShowHints(0);
    setShowSolution(false);
    setUserAnswer('');
    setStep('solving');

    try {
      const isFirst = await isFirstActivityToday(user.uid);
      setDailyFirst(isFirst);

      if (isFirst) {
        const streakResult = await recordActivity(user.uid);
        setStreakData(streakResult.streakData);

        if (streakResult.achievementsUnlocked.length > 0) {
          setUnlockedAchievement(streakResult.achievementsUnlocked[0]);
        }
      } else {
        const currentStreak = await getStreakData(user.uid);
        setStreakData(currentStreak);
      }
    } catch (error) {
      console.error('Error recording activity:', error);
    }

    setSessionStats({
      totalProblems: 0,
      correctProblems: 0,
      startTime: Date.now(),
      correctStreak: 0,
    });

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
  const endSession = async () => {
    if (!user || !selectedSession) {
      setStep('session_select');
      setSelectedSession(null);
      setCurrentProblem(null);
      return;
    }

    try {
      const timeSpentMinutes = Math.floor((Date.now() - sessionStats.startTime) / 60000);

      const accuracy = sessionStats.totalProblems > 0
        ? (sessionStats.correctProblems / sessionStats.totalProblems) * 100
        : 0;
      const inFlowState = accuracy >= 80 && timeSpentMinutes >= 10;

      const result = await processSessionComplete(user.uid, {
        totalProblems: sessionStats.totalProblems,
        correctProblems: sessionStats.correctProblems,
        timeSpentMinutes,
        inFlowState,
        dailyFirst,
        currentStreak: streakData?.currentStreak || 0,
      });

      setXpResult(result);

      if (result.achievementsUnlocked.length > 0) {
        setTimeout(() => {
          setUnlockedAchievement(result.achievementsUnlocked[0]);
        }, 2000);
      }
    } catch (error) {
      console.error('Error processing session complete:', error);
    }

    setStep('session_select');
    setSelectedSession(null);
    setCurrentProblem(null);
  };

  // 새 문제 요청
  const requestNewProblem = async (wasCorrect: boolean = true) => {
    if (!selectedSession || !user) return;

    try {
      setSessionStats(prev => ({
        ...prev,
        totalProblems: prev.totalProblems + 1,
        correctProblems: wasCorrect ? prev.correctProblems + 1 : prev.correctProblems,
        correctStreak: wasCorrect ? prev.correctStreak + 1 : 0,
      }));

      if (wasCorrect) {
        const result = await processProblemResult(user.uid, {
          correct: true,
          timeSpent: timer,
          firstTry: showHints === 0,
          difficulty: selectedSession.id,
          streakCount: sessionStats.correctStreak + 1,
        });

        if (result) {
          setShowXpToast(result.xpGained);

          if (result.leveledUp) {
            setTimeout(() => setXpResult(result), 500);
          }

          if (result.achievementsUnlocked.length > 0) {
            setTimeout(() => {
              setUnlockedAchievement(result.achievementsUnlocked[0]);
            }, result.leveledUp ? 3000 : 1000);
          }
        }
      }
    } catch (error) {
      console.error('Error awarding XP:', error);
    }

    setShowHints(0);
    setShowSolution(false);
    setUserAnswer('');
    setTimer(0);
    await generateImmersionProblem(selectedSession.id);
  };

  // 로딩 화면
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 animate-pulse" />
          <div className="absolute inset-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 animate-ping opacity-20" />
        </div>
        <p className="text-slate-400 text-sm animate-pulse">로딩 중...</p>
      </div>
    );
  }

  // ==========================================
  // 1단계: 학년 선택
  // ==========================================
  if (step === 'grade_select') {
    return (
      <div className="min-h-screen p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl mb-6 shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">몰입수학에 오신 것을 환영합니다!</h1>
            <p className="text-lg text-slate-400">
              맞춤형 학습을 위해 먼저 학년을 선택해주세요.
            </p>
          </div>

          <div className="space-y-8">
            {/* 초등학교 */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">초등학교</h2>
              </div>
              <div className="grid grid-cols-6 gap-3">
                {[1, 2, 3, 4, 5, 6].map((grade) => (
                  <button
                    key={grade}
                    onClick={() => handleGradeSelect(grade)}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all text-center group"
                  >
                    <div className="text-2xl font-bold text-blue-400 group-hover:scale-110 transition-transform">{grade}</div>
                    <div className="text-xs text-slate-500">학년</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 중학교 */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">중학교</h2>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[7, 8, 9].map((grade) => (
                  <button
                    key={grade}
                    onClick={() => handleGradeSelect(grade)}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all text-center group"
                  >
                    <div className="text-2xl font-bold text-emerald-400 group-hover:scale-110 transition-transform">{grade - 6}</div>
                    <div className="text-xs text-slate-500">학년</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 고등학교 */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-violet-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">고등학교</h2>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[10, 11, 12].map((grade) => (
                  <button
                    key={grade}
                    onClick={() => handleGradeSelect(grade)}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/50 hover:bg-violet-500/10 transition-all text-center group"
                  >
                    <div className="text-2xl font-bold text-violet-400 group-hover:scale-110 transition-transform">{grade - 9}</div>
                    <div className="text-xs text-slate-500">학년</div>
                  </button>
                ))}
              </div>
            </div>
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
      <div className="min-h-screen p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-300">
                진단 테스트 ({selectedGrade}학년)
              </span>
              <span className="text-sm text-slate-400">{diagnosticProgress + 1} / 10</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-500"
                style={{ width: `${(diagnosticProgress / 10) * 100}%` }}
              />
            </div>
          </div>

          {problemLoading ? (
            <div className="glass-card p-12 text-center">
              <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400">문제를 준비하고 있습니다...</p>
            </div>
          ) : diagnosticProblem ? (
            <div className="glass-card p-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm text-indigo-400 mb-6">
                <Target className="w-4 h-4" />
                {diagnosticProblem.topic}
              </div>

              <MathText className="text-xl font-medium text-white mb-8">
                {diagnosticProblem.content}
              </MathText>

              <div className="grid grid-cols-2 gap-4">
                {diagnosticProblem.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => submitDiagnosticAnswer(option)}
                    className="p-4 text-left rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all flex items-center group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm font-medium text-slate-400 mr-3 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <MathText className="text-white">{option}</MathText>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // ==========================================
  // 3단계: 세션 선택
  // ==========================================
  if (step === 'session_select') {
    return (
      <div className="min-h-screen p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* 진단 결과 */}
          {diagnosticResult && (
            <div className="glass-card p-6 mb-8 border-indigo-500/20">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/25">
                  {diagnosticResult.estimatedLevel}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">
                    추정 실력: {diagnosticResult.estimatedLevel}학년 수준
                  </h3>
                  <p className="text-slate-400 text-sm">
                    선택 학년: {diagnosticResult.grade}학년 | 능력 지수: {diagnosticResult.theta.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={handleResetDiagnostic}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  다시 진단하기
                </button>
              </div>
            </div>
          )}

          {/* 몰입 문제 선택 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">몰입 학습</h1>
            <p className="text-slate-400">
              한 문제에 집중하여 깊이 있는 학습을 경험하세요.
              <br />
              <span className="text-sm">각 난이도는 문제를 푸는 데 걸리는 예상 시간입니다.</span>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {IMMERSION_SESSIONS.map((session) => {
              const SessionIcon = session.icon;
              return (
                <button
                  key={session.id}
                  onClick={() => startSession(session)}
                  className="glass-card p-6 text-left transition-all hover:scale-[1.02] hover:shadow-lg group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${session.gradient} flex items-center justify-center shadow-lg`}>
                      <SessionIcon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">{session.name}</h3>
                      <p className="text-slate-400 text-sm">{session.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock className="w-4 h-4" />
                          {session.duration}
                        </span>
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 rounded-full text-amber-400 text-xs font-medium">
                          <Zap className="w-3 h-3" />
                          +{session.xpReward} XP
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 4단계: 문제 풀이
  // ==========================================
  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 glass border-b border-white/5 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {selectedSession && (
              <div className={`flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r ${selectedSession.gradient} rounded-full text-white text-sm font-medium`}>
                <selectedSession.icon className="w-4 h-4" />
                {selectedSession.name}
              </div>
            )}
            <span className="text-sm text-slate-400">
              {currentProblem?.topic}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-lg font-mono font-bold text-white">{formatTime(timer)}</span>
            </div>
            <button
              onClick={endSession}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all"
            >
              종료
            </button>
          </div>
        </div>
      </div>

      {/* 문제 */}
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        {problemLoading ? (
          <div className="glass-card p-12 text-center">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-300">문제를 생성하고 있습니다...</p>
            <p className="text-sm text-slate-500 mt-2">AI가 당신의 수준에 맞는 문제를 만들고 있어요</p>
          </div>
        ) : currentProblem ? (
          <>
            <div className="glass-card p-8 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm text-indigo-400">
                  <Target className="w-4 h-4" />
                  {currentProblem.topic}
                </span>
                <span className="flex items-center gap-1 text-sm text-slate-500">
                  <Clock className="w-4 h-4" />
                  예상 시간: {currentProblem.estimatedTime}
                </span>
              </div>

              <MathText className="text-lg leading-relaxed text-white mb-8 whitespace-pre-wrap">
                {currentProblem.content}
              </MathText>

              {/* 힌트 섹션 */}
              <div className="border-t border-white/10 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="flex items-center gap-2 font-medium text-white">
                    <Lightbulb className="w-5 h-5 text-amber-400" />
                    힌트
                  </h3>
                  <span className="text-sm text-slate-500">
                    {showHints}/{currentProblem.hints.length} 사용
                  </span>
                </div>

                {currentProblem.hints.slice(0, showHints).map((hint, index) => (
                  <div
                    key={index}
                    className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-3"
                  >
                    <MathText className="text-sm text-amber-200">
                      {`힌트 ${index + 1}: ${hint}`}
                    </MathText>
                  </div>
                ))}

                {showHints < currentProblem.hints.length && (
                  <button
                    onClick={() => setShowHints(showHints + 1)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-400 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    다음 힌트 보기
                  </button>
                )}
              </div>

              {/* 답안 작성 */}
              <div className="border-t border-white/10 pt-6 mt-6">
                <h3 className="flex items-center gap-2 font-medium text-white mb-4">
                  <span className="text-lg">✏️</span>
                  내 풀이
                </h3>
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="여기에 풀이 과정과 답을 작성하세요..."
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 min-h-[150px] resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                />
              </div>

              {/* 정답 확인 */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowSolution(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl text-white font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
                >
                  <CheckCircle className="w-5 h-5" />
                  정답 확인하기
                </button>
                <button
                  onClick={() => requestNewProblem(false)}
                  className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:bg-white/10 transition-all"
                >
                  <SkipForward className="w-5 h-5" />
                  건너뛰기
                </button>
              </div>
            </div>

            {/* 풀이 */}
            {showSolution && (
              <div className="glass-card p-8 border-emerald-500/20">
                <h3 className="flex items-center gap-2 text-lg font-bold text-emerald-400 mb-4">
                  <CheckCircle className="w-6 h-6" />
                  풀이
                </h3>
                <MathText className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {currentProblem.solution}
                </MathText>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => requestNewProblem(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
                  >
                    <Zap className="w-5 h-5" />
                    다음 문제 도전 (+XP)
                  </button>
                  <button
                    onClick={endSession}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:bg-white/10 transition-all"
                  >
                    세션 종료
                  </button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* 게이미피케이션 알림 컴포넌트 */}
      {xpResult && (
        <XpGainNotification
          result={xpResult}
          onClose={() => setXpResult(null)}
        />
      )}

      {showXpToast !== null && (
        <XpToast
          amount={showXpToast}
          onClose={() => setShowXpToast(null)}
        />
      )}

      <AchievementUnlock
        achievementId={unlockedAchievement}
        onClose={() => setUnlockedAchievement(null)}
      />
    </div>
  );
}
