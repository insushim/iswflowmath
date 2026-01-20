'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { MATH_TOPICS, FLOW_CHANNELS, MathTopic, FlowChannel, ProblemWithIRT } from '@/types';

export default function PracticePage() {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<MathTopic | null>(null);
  const [currentProblem, setCurrentProblem] = useState<ProblemWithIRT | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    problemsAttempted: 0,
    problemsCorrect: 0,
    xpEarned: 0,
    flowState: 'control' as FlowChannel,
    streak: 0,
  });
  const [timer, setTimer] = useState(0);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionStarted && !showResult) {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStarted, showResult]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startSession = async (topic: MathTopic) => {
    setSelectedTopic(topic);
    setSessionStarted(true);
    setLoading(true);

    // Generate first problem
    await generateProblem(topic);
  };

  const generateProblem = async (topic: MathTopic) => {
    setLoading(true);
    setTimer(0);
    setSelectedAnswer(null);
    setShowResult(false);

    try {
      const response = await fetch('/api/problems/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          theta: 0, // Will be replaced with real user theta
          grade: 7, // Will be replaced with real user grade
        }),
      });

      if (!response.ok) throw new Error('Failed to generate problem');

      const data = await response.json();
      setCurrentProblem(data.problem);
    } catch (error) {
      console.error('Error generating problem:', error);
      // Fallback problem
      setCurrentProblem({
        id: '1',
        content: '문제를 불러오는 중 오류가 발생했습니다.',
        options: ['다시 시도'],
        correct_answer: '다시 시도',
        solution: '',
        hints: [],
        topic,
        subtopic: '',
        irt: { a: 1, b: 0, c: 0.2 },
        created_at: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

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

  const nextProblem = () => {
    if (selectedTopic) {
      generateProblem(selectedTopic);
    }
  };

  const endSession = () => {
    setSessionStarted(false);
    setSelectedTopic(null);
    setCurrentProblem(null);
    setShowResult(false);
  };

  // Topic selection screen
  if (!sessionStarted) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">학습 주제 선택</h1>
        <p className="text-gray-600 mb-8">학습하고 싶은 주제를 선택하세요</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {(Object.entries(MATH_TOPICS) as [MathTopic, string][]).map(([key, label]) => (
            <Card
              key={key}
              className="cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
              onClick={() => startSession(key)}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📐</span>
                </div>
                <h3 className="font-medium">{label}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Practice screen
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant={sessionStats.flowState === 'flow' ? 'flow' : 'secondary'}>
              {FLOW_CHANNELS[sessionStats.flowState].emoji} {FLOW_CHANNELS[sessionStats.flowState].label}
            </Badge>
            <span className="text-sm text-gray-600">
              {sessionStats.problemsCorrect}/{sessionStats.problemsAttempted} 정답
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="xp">+{sessionStats.xpEarned} XP</Badge>
            <span className="text-sm font-mono">{formatTime(timer)}</span>
            <Button variant="outline" size="sm" onClick={endSession}>
              종료
            </Button>
          </div>
        </div>
      </div>

      {/* Problem Card */}
      <div className="p-6 max-w-4xl mx-auto">
        {loading ? (
          <Card className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">문제를 생성하고 있습니다...</p>
          </Card>
        ) : currentProblem ? (
          <Card>
            <CardContent className="p-8">
              {/* Problem Content */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline">{selectedTopic && MATH_TOPICS[selectedTopic]}</Badge>
                  {sessionStats.streak >= 3 && (
                    <Badge variant="success">🔥 {sessionStats.streak} 연속</Badge>
                  )}
                </div>
                <h2 className="text-xl font-medium mb-4">{currentProblem.content}</h2>
                {currentProblem.latex && (
                  <div className="p-4 bg-gray-50 rounded-lg text-lg font-mono">
                    {currentProblem.latex}
                  </div>
                )}
              </div>

              {/* Options */}
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
                      {isCorrect && <span className="float-right">✓</span>}
                      {isWrong && <span className="float-right">✗</span>}
                    </button>
                  );
                })}
              </div>

              {/* Solution (shown after answer) */}
              {showResult && (
                <div className="mb-8 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium mb-2">풀이</h3>
                  <p className="text-gray-700">{currentProblem.solution}</p>
                </div>
              )}

              {/* Actions */}
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
                    다음 문제
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Session Progress */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>세션 진행률</span>
            <span>{sessionStats.problemsAttempted}/10 문제</span>
          </div>
          <Progress value={(sessionStats.problemsAttempted / 10) * 100} />
        </div>
      </div>
    </div>
  );
}
