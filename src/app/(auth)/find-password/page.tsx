'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { resetPassword } from '@/lib/firebase/auth';

export default function FindPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: unknown) {
      console.error('Reset password error:', err);
      const errorMessage = err instanceof Error ? err.message : '';

      if (errorMessage.includes('user-not-found')) {
        setError('등록되지 않은 이메일입니다.');
      } else if (errorMessage.includes('invalid-email')) {
        setError('올바른 이메일 형식이 아닙니다.');
      } else {
        setError('비밀번호 재설정 메일 발송에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              MathFlow
            </span>
          </Link>
          <CardTitle className="text-2xl">비밀번호 찾기</CardTitle>
          <CardDescription>
            {sent
              ? '이메일을 확인해주세요'
              : '가입한 이메일로 비밀번호 재설정 링크를 보내드립니다'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium text-green-700">메일 발송 완료</span>
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{email}</span>로 비밀번호 재설정 링크를 발송했습니다.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  * 메일이 도착하지 않으면 스팸 폴더를 확인해주세요.
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSent(false);
                    setEmail('');
                  }}
                >
                  다른 이메일로 다시 시도
                </Button>
                <Button asChild variant="gradient" className="w-full">
                  <Link href="/login">로그인으로 돌아가기</Link>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">이메일</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">
                  가입할 때 사용한 이메일 주소를 입력해주세요.
                </p>
              </div>
              <Button type="submit" className="w-full" variant="gradient" loading={loading}>
                비밀번호 재설정 메일 받기
              </Button>
            </form>
          )}

          <div className="mt-6 flex justify-center gap-4 text-sm text-gray-600">
            <Link href="/find-email" className="text-blue-600 hover:underline font-medium">
              아이디 찾기
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              로그인
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
