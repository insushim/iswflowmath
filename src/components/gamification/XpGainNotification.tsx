'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { XpGainResult, XpBonus } from '@/lib/gamification/xp-system';

interface XpGainNotificationProps {
  result: XpGainResult | null;
  onClose: () => void;
}

export function XpGainNotification({ result, onClose }: XpGainNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (result && result.xpGained > 0) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [result, onClose]);

  if (!result) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-4 right-4 z-50"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 shadow-2xl text-white min-w-[280px]">
            {/* XP 획득 */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-2xl">
                ⭐
              </div>
              <div>
                <div className="text-yellow-300 text-sm font-medium">XP 획득!</div>
                <div className="text-2xl font-bold">+{result.xpGained} XP</div>
              </div>
            </div>

            {/* 보너스 상세 */}
            {result.bonuses.length > 0 && (
              <div className="space-y-1 mb-3 text-sm">
                {result.bonuses.map((bonus, i) => (
                  <div key={i} className="flex justify-between items-center text-blue-100">
                    <span>{bonus.description}</span>
                    <span className="text-yellow-300">+{bonus.amount}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 레벨업 */}
            {result.leveledUp && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-yellow-400 text-yellow-900 rounded-lg p-3 text-center mt-2"
              >
                <div className="text-lg font-bold">🎉 레벨 업!</div>
                <div className="text-sm">
                  Level {result.previousLevel} → Level {result.newLevel}
                </div>
                <div className="text-xs mt-1">{result.levelTitle}</div>
              </motion.div>
            )}

            {/* 업적 해제 */}
            {result.achievementsUnlocked.length > 0 && (
              <div className="mt-2 bg-white/10 rounded-lg p-2">
                <div className="text-xs text-blue-200 mb-1">업적 달성!</div>
                {result.achievementsUnlocked.map((id) => (
                  <div key={id} className="text-sm font-medium">
                    🏆 {id}
                  </div>
                ))}
              </div>
            )}

            {/* 진행 바 */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-blue-200 mb-1">
                <span>Level {result.newLevel}</span>
                <span>{result.totalXp} XP</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '60%' }}
                  className="h-full bg-yellow-400 rounded-full"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 간단한 XP 토스트 (작은 알림)
export function XpToast({ amount, onClose }: { amount: number; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
        <span className="text-xl">⭐</span>
        <span className="text-white font-bold">+{amount} XP</span>
      </div>
    </motion.div>
  );
}
