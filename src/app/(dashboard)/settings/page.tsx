'use client';

import { useState } from 'react';
import {
  User,
  Mail,
  GraduationCap,
  Target,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Sun,
  Moon,
  Monitor,
  CreditCard,
  Shield,
  Trash2,
  Save,
  Check,
  Crown,
  Zap,
  Sparkles,
} from 'lucide-react';

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
    theme: 'dark',
    sound: true,
    language: 'ko',
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const getGradeLabel = (grade: number): string => {
    if (grade <= 6) return `초등학교 ${grade}학년`;
    if (grade <= 9) return `중학교 ${grade - 6}학년`;
    return `고등학교 ${grade - 9}학년`;
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">설정</h1>
          <p className="text-slate-400">계정 및 학습 설정을 관리하세요</p>
        </div>

        <div className="space-y-6">
          {/* 프로필 설정 */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                <User className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">프로필</h2>
            </div>

            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/25">
                {settings.name.charAt(0)}
              </div>
              <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 transition-colors">
                프로필 사진 변경
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    이름
                  </div>
                </label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    이메일
                  </div>
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-400 mb-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  학년
                </div>
              </label>
              <select
                value={settings.grade}
                onChange={(e) => setSettings({ ...settings, grade: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5rem' }}
              >
                {[1, 2, 3, 4, 5, 6].map((g) => (
                  <option key={g} value={g} className="bg-slate-800">
                    초등학교 {g}학년
                  </option>
                ))}
                {[7, 8, 9].map((g) => (
                  <option key={g} value={g} className="bg-slate-800">
                    중학교 {g - 6}학년
                  </option>
                ))}
                {[10, 11, 12].map((g) => (
                  <option key={g} value={g} className="bg-slate-800">
                    고등학교 {g - 9}학년
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 학습 설정 */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">학습 설정</h2>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-400 mb-3">
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
                  className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-indigo-500 [&::-webkit-slider-thumb]:to-violet-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
                />
                <div className="min-w-[80px] px-4 py-2 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 rounded-xl text-center">
                  <span className="text-lg font-bold text-white">{settings.dailyGoal}</span>
                  <span className="text-sm text-slate-400 ml-1">문제</span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>5문제</span>
                <span>100문제</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                {settings.sound ? (
                  <Volume2 className="w-5 h-5 text-indigo-400" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-500" />
                )}
                <div>
                  <div className="font-medium text-white">효과음</div>
                  <div className="text-sm text-slate-500">정답/오답 효과음 재생</div>
                </div>
              </div>
              <button
                onClick={() => setSettings({ ...settings, sound: !settings.sound })}
                className={`w-14 h-7 rounded-full transition-all duration-300 ${
                  settings.sound
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600'
                    : 'bg-white/10'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                    settings.sound ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 알림 설정 */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">알림</h2>
            </div>

            <div className="space-y-1">
              {[
                {
                  key: 'email' as const,
                  label: '이메일 알림',
                  desc: '학습 리포트 및 업데이트 소식',
                  icon: Mail,
                },
                {
                  key: 'push' as const,
                  label: '푸시 알림',
                  desc: '브라우저 푸시 알림',
                  icon: Bell,
                },
                {
                  key: 'reminder' as const,
                  label: '학습 리마인더',
                  desc: '매일 학습 알림 받기',
                  icon: Zap,
                },
              ].map((item, index) => (
                <div
                  key={item.key}
                  className={`flex items-center justify-between py-4 ${
                    index < 2 ? 'border-b border-white/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={`w-5 h-5 ${
                        settings.notifications[item.key] ? 'text-indigo-400' : 'text-slate-500'
                      }`}
                    />
                    <div>
                      <div className="font-medium text-white">{item.label}</div>
                      <div className="text-sm text-slate-500">{item.desc}</div>
                    </div>
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
                    className={`w-14 h-7 rounded-full transition-all duration-300 ${
                      settings.notifications[item.key]
                        ? 'bg-gradient-to-r from-indigo-500 to-violet-600'
                        : 'bg-white/10'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                        settings.notifications[item.key] ? 'translate-x-8' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 테마 설정 */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                <Moon className="w-5 h-5 text-violet-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">테마</h2>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { value: 'light', label: '라이트', icon: Sun },
                { value: 'dark', label: '다크', icon: Moon },
                { value: 'system', label: '시스템', icon: Monitor },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setSettings({ ...settings, theme: option.value as UserSettings['theme'] })
                  }
                  className={`p-4 rounded-xl border-2 transition-all ${
                    settings.theme === option.value
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <option.icon
                    className={`w-6 h-6 mx-auto mb-2 ${
                      settings.theme === option.value ? 'text-indigo-400' : 'text-slate-400'
                    }`}
                  />
                  <div
                    className={`text-sm font-medium ${
                      settings.theme === option.value ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {option.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 구독 정보 */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">구독 정보</h2>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-xl mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg text-white">무료 플랜</span>
                    <span className="px-2 py-0.5 bg-slate-700 rounded-full text-xs text-slate-300">
                      현재 플랜
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    하루 10문제, 기본 통계, 힌트 1개/문제
                  </p>
                </div>
                <button className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl text-white font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all">
                  업그레이드
                </button>
              </div>
            </div>

            <div className="p-4 border-2 border-indigo-500/30 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-5 h-5 text-amber-400" />
                <span className="text-lg font-bold text-white">프로 플랜</span>
                <span className="px-2 py-0.5 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full text-xs text-white">
                  추천
                </span>
              </div>
              <ul className="text-sm text-slate-300 space-y-2 mb-4">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  하루 50문제
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  30일 상세 통계
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  AI 풀이 설명
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  힌트 3개/문제
                </li>
              </ul>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">₩9,900</span>
                <span className="text-slate-400">/월</span>
              </div>
            </div>
          </div>

          {/* 저장 버튼 */}
          <div className="flex items-center justify-between py-4">
            <div>
              {saved && (
                <span className="flex items-center gap-2 text-emerald-400 text-sm">
                  <Check className="w-4 h-4" />
                  설정이 저장되었습니다
                </span>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl text-white font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  설정 저장
                </>
              )}
            </button>
          </div>

          {/* 계정 관리 */}
          <div className="glass-card p-6 border-red-500/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-red-400">계정 관리</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium text-white">비밀번호 변경</div>
                  <div className="text-sm text-slate-500">계정 비밀번호를 변경합니다</div>
                </div>
                <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 transition-colors">
                  변경
                </button>
              </div>
              <div className="flex items-center justify-between py-3 border-t border-white/10">
                <div>
                  <div className="font-medium text-red-400">계정 삭제</div>
                  <div className="text-sm text-slate-500">
                    모든 데이터가 영구적으로 삭제됩니다
                  </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 hover:bg-red-500/20 transition-colors">
                  <Trash2 className="w-4 h-4" />
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
