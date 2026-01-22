'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function FindEmailPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState('');

  const maskEmail = (email: string): string => {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 3) {
      return `${localPart[0]}**@${domain}`;
    }
    const visiblePart = localPart.slice(0, 3);
    const maskedPart = '*'.repeat(localPart.length - 3);
    return `${visiblePart}${maskedPart}@${domain}`;
  };

  const handleFindEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Firestore에서 이름으로 사용자 검색 (limit 1 필수)
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('name', '==', name.trim()), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('입력하신 정보와 일치하는 계정을 찾을 수 없습니다.');
      } else {
        // 찾은 이메일을 마스킹하여 표시
        const foundUser = querySnapshot.docs[0].data();
        const maskedEmail = maskEmail(foundUser.email);
        setResult(maskedEmail);
      }
    } catch (err) {
      console.error('Find email error:', err);
      setError('아이디 찾기 중 오류가 발생했습니다. 다시 시도해주세요.');
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
          <CardTitle className="text-2xl">아이디 찾기</CardTitle>
          <CardDescription>가입 시 등록한 이름을 입력해주세요</CardDescription>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-2">회원님의 아이디(이메일)는</p>
                <p className="text-lg font-semibold text-green-700">{result}</p>
                <p className="text-sm text-gray-600 mt-2">입니다.</p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/find-password">비밀번호 찾기</Link>
                </Button>
                <Button asChild variant="gradient" className="flex-1">
                  <Link href="/login">로그인</Link>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleFindEmail} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">이름</label>
                <Input
                  type="text"
                  placeholder="가입 시 등록한 이름"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">휴대폰 번호 (선택)</label>
                <Input
                  type="tel"
                  placeholder="010-0000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  * 휴대폰 번호는 추가 확인용이며, 현재는 이름만으로 검색됩니다.
                </p>
              </div>
              <Button type="submit" className="w-full" variant="gradient" loading={loading}>
                아이디 찾기
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-600">
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              로그인으로 돌아가기
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
