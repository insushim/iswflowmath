'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                MathFlow
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login"><Button variant="ghost">로그인</Button></Link>
              <Link href="/signup"><Button variant="gradient">무료로 시작하기</Button></Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="info" className="mb-6">AI 기반 적응형 학습</Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">몰입으로</span>
            <br />
            <span className="text-gray-900">수학을 정복하다</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Flow 이론과 IRT 알고리즘이 결합된 개인 맞춤형 수학 학습.
            AI가 당신의 실력에 맞는 최적의 문제를 제시합니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup"><Button size="xl" variant="gradient">무료로 시작하기</Button></Link>
            <Link href="#features"><Button size="xl" variant="outline">더 알아보기</Button></Link>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">왜 MathFlow인가요?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg"><CardContent className="pt-8">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6"><span className="text-3xl">🎯</span></div>
              <h3 className="text-xl font-semibold mb-3">Flow 이론 기반</h3>
              <p className="text-gray-600">칙센트미하이의 몰입 이론을 적용하여 최적의 도전-능력 균형을 유지합니다.</p>
            </CardContent></Card>
            <Card className="border-0 shadow-lg"><CardContent className="pt-8">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6"><span className="text-3xl">📊</span></div>
              <h3 className="text-xl font-semibold mb-3">IRT 적응형 난이도</h3>
              <p className="text-gray-600">문항반응이론(IRT)을 활용하여 실시간으로 실력을 측정합니다.</p>
            </CardContent></Card>
            <Card className="border-0 shadow-lg"><CardContent className="pt-8">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6"><span className="text-3xl">🤖</span></div>
              <h3 className="text-xl font-semibold mb-3">Gemini AI 문제 생성</h3>
              <p className="text-gray-600">Google Gemini AI가 무한한 맞춤형 문제를 생성합니다.</p>
            </CardContent></Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">지금 바로 몰입 학습을 시작하세요</h2>
          <Link href="/signup"><Button size="xl" className="bg-white text-blue-600 hover:bg-blue-50">무료로 시작하기</Button></Link>
        </div>
      </section>

      <footer className="py-12 px-4 bg-gray-900 text-gray-400 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">M</span>
          </div>
          <span className="font-bold text-white">MathFlow</span>
        </div>
        <p className="text-sm">© 2024 MathFlow. All rights reserved.</p>
      </footer>
    </div>
  );
}
