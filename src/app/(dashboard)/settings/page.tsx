'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface UserSettings {
  name: string;
  email: string;
  grade: number;
  dailyGoal: number;
  notifications: {
    email: boolean;
    push: boolean;
    reminder: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  sound: boolean;
  language: 'ko' | 'en';
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    name: '심인수',
    email: 'user@example.com',
    grade: 7,
    dailyGoal: 20,
    notifications: {
      email: true,
      push: true,
      reminder: true,
    },
    theme: 'light',
    sound: true,
    language: 'ko',
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // 실제로는 API 호출
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">설정</h1>
      <p className="text-gray-600 mb-8">계정 및 학습 설정을 관리하세요</p>

      {/* 프로필 설정 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">프로필</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {settings.name.charAt(0)}
            </div>
            <div>
              <Button variant="outline" size="sm">
                프로필 사진 변경
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름
              </label>
              <Input
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <Input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              학년
            </label>
            <select
              value={settings.grade}
              onChange={(e) => setSettings({ ...settings, grade: Number(e.target.value) })}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {[1, 2, 3, 4, 5, 6].map((g) => (
                <option key={g} value={g}>
                  초등학교 {g}학년
                </option>
              ))}
              {[7, 8, 9].map((g) => (
                <option key={g} value={g}>
                  중학교 {g - 6}학년
                </option>
              ))}
              {[10, 11, 12].map((g) => (
                <option key={g} value={g}>
                  고등학교 {g - 9}학년
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* 학습 설정 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">학습 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              일일 목표 문제 수
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={settings.dailyGoal}
                onChange={(e) =>
                  setSettings({ ...settings, dailyGoal: Number(e.target.value) })
                }
                className="flex-1"
              />
              <span className="w-16 text-center font-bold text-blue-600">
                {settings.dailyGoal}문제
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5문제</span>
              <span>100문제</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-t">
            <div>
              <div className="font-medium">효과음</div>
              <div className="text-sm text-gray-500">정답/오답 효과음 재생</div>
            </div>
            <button
              onClick={() => setSettings({ ...settings, sound: !settings.sound })}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.sound ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.sound ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 알림 설정 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">알림</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {[
            {
              key: 'email' as const,
              label: '이메일 알림',
              desc: '학습 리포트 및 업데이트 소식',
            },
            {
              key: 'push' as const,
              label: '푸시 알림',
              desc: '브라우저 푸시 알림',
            },
            {
              key: 'reminder' as const,
              label: '학습 리마인더',
              desc: '매일 학습 알림 받기',
            },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-3 border-b last:border-0">
              <div>
                <div className="font-medium">{item.label}</div>
                <div className="text-sm text-gray-500">{item.desc}</div>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      [item.key]: !settings.notifications[item.key],
                    },
                  })
                }
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.notifications[item.key] ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.notifications[item.key] ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 테마 설정 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">테마</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'light', label: '라이트', icon: '☀️' },
              { value: 'dark', label: '다크', icon: '🌙' },
              { value: 'system', label: '시스템', icon: '💻' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  setSettings({ ...settings, theme: option.value as UserSettings['theme'] })
                }
                className={`p-4 rounded-lg border-2 transition-all ${
                  settings.theme === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">{option.icon}</div>
                <div className="text-sm font-medium">{option.label}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 구독 정보 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">구독 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">무료 플랜</span>
                <Badge>현재 플랜</Badge>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                하루 10문제, 기본 통계, 힌트 1개/문제
              </p>
            </div>
            <Button variant="gradient">업그레이드</Button>
          </div>

          <div className="mt-4 p-4 border-2 border-blue-200 rounded-lg bg-blue-50/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-bold text-blue-700">프로 플랜</span>
              <Badge className="bg-blue-600">추천</Badge>
            </div>
            <ul className="text-sm text-gray-600 space-y-1 mb-4">
              <li>✓ 하루 50문제</li>
              <li>✓ 30일 상세 통계</li>
              <li>✓ AI 풀이 설명</li>
              <li>✓ 힌트 3개/문제</li>
            </ul>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-700">₩9,900</span>
              <span className="text-gray-500">/월</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 저장 버튼 */}
      <div className="flex items-center justify-between">
        <div>
          {saved && (
            <span className="text-green-600 text-sm">✓ 설정이 저장되었습니다</span>
          )}
        </div>
        <Button variant="gradient" size="lg" onClick={handleSave} loading={saving}>
          설정 저장
        </Button>
      </div>

      {/* 계정 관리 */}
      <Card className="mt-8 border-red-200">
        <CardHeader>
          <CardTitle className="text-lg text-red-600">계정 관리</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">비밀번호 변경</div>
              <div className="text-sm text-gray-500">계정 비밀번호를 변경합니다</div>
            </div>
            <Button variant="outline">변경</Button>
          </div>
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <div className="font-medium text-red-600">계정 삭제</div>
              <div className="text-sm text-gray-500">
                모든 데이터가 영구적으로 삭제됩니다
              </div>
            </div>
            <Button variant="destructive">삭제</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
