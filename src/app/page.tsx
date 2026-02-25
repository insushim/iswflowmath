"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                  <path
                    d="M16 4L6 14L16 12L26 14L16 4Z"
                    fill="white"
                    opacity="0.9"
                  />
                  <path
                    d="M16 12L6 14L10 26H22L26 14L16 12Z"
                    fill="white"
                    opacity="0.7"
                  />
                  <text
                    x="16"
                    y="22"
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="serif"
                  >
                    ∑
                  </text>
                </svg>
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                셈마루
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-gray-700 hover:text-indigo-600"
                >
                  로그인
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="gradient">무료로 시작하기</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="info" className="mb-6">
            AI 기반 적응형 학습
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              몰입으로
            </span>
            <br />
            <span className="text-gray-900">수학의 정상에 오르다</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Flow 이론과 IRT 알고리즘이 결합된 개인 맞춤형 수학 학습. AI가 당신의
            실력에 맞는 최적의 문제를 제시합니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="xl" variant="gradient">
                무료로 시작하기
              </Button>
            </Link>
            <Link href="#features">
              <Button
                size="xl"
                variant="outline"
                className="text-gray-700 border-gray-300 hover:border-indigo-400"
              >
                더 알아보기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              왜 셈마루인가요?
            </h2>
            <p className="text-gray-500 text-lg">
              최고의 수학 학습 경험을 위한 3가지 핵심 기술
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="pt-8">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                  <span className="text-3xl">🎯</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Flow 이론 기반
                </h3>
                <p className="text-gray-600">
                  칙센트미하이의 몰입 이론을 적용하여 최적의 도전-능력 균형을
                  유지합니다.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="pt-8">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                  <span className="text-3xl">📊</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  IRT 적응형 난이도
                </h3>
                <p className="text-gray-600">
                  문항반응이론(IRT) 3PL 모델로 실시간 실력 측정 및 최적 문제
                  추천.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="pt-8">
                <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mb-6">
                  <span className="text-3xl">🤖</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Gemini AI 문제 생성
                </h3>
                <p className="text-gray-600">
                  Google Gemini AI가 교육과정 기반 무한 맞춤형 문제를
                  생성합니다.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-r from-indigo-600 to-violet-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            지금 바로 몰입 학습을 시작하세요
          </h2>
          <p className="text-indigo-100 mb-8 text-lg">
            초등 1학년부터 고등 3학년까지, 모든 학년의 심화 수학
          </p>
          <Link href="/signup">
            <Button
              size="xl"
              className="bg-white text-indigo-600 hover:bg-indigo-50 font-semibold"
            >
              무료로 시작하기
            </Button>
          </Link>
        </div>
      </section>

      <footer className="py-12 px-4 bg-gray-900 text-gray-400 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">∑</span>
          </div>
          <span className="font-bold text-white">셈마루</span>
        </div>
        <p className="text-sm">© 2025 셈마루(SemMaru). All rights reserved.</p>
      </footer>
    </div>
  );
}
