'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAchievementById, type Achievement } from '@/lib/gamification/achievements';

interface AchievementUnlockProps {
  achievementId: string | null;
  onClose: () => void;
}

const tierColors = {
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-gray-400 to-gray-600',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-cyan-400 to-cyan-600',
  diamond: 'from-purple-400 to-pink-600',
};

const tierGlow = {
  bronze: 'shadow-amber-500/50',
  silver: 'shadow-gray-400/50',
  gold: 'shadow-yellow-400/50',
  platinum: 'shadow-cyan-400/50',
  diamond: 'shadow-purple-500/50',
};

export function AchievementUnlock({ achievementId, onClose }: AchievementUnlockProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [achievement, setAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    if (achievementId) {
      const ach = getAchievementById(achievementId);
      if (ach) {
        setAchievement(ach);
        setIsVisible(true);
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onClose, 500);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [achievementId, onClose]);

  if (!achievement) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 배경 광채 */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 0.5 }}
              transition={{ delay: 0.2, duration: 1, repeat: Infinity, repeatType: 'reverse' }}
              className={`absolute inset-0 bg-gradient-to-r ${tierColors[achievement.tier]} rounded-full blur-3xl`}
            />

            {/* 메인 카드 */}
            <div className={`relative bg-gradient-to-br ${tierColors[achievement.tier]} p-1 rounded-2xl shadow-2xl ${tierGlow[achievement.tier]}`}>
              <div className="bg-gray-900 rounded-xl p-8 text-center min-w-[320px]">
                {/* 아이콘 */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-6xl mb-4"
                >
                  {achievement.icon}
                </motion.div>

                {/* 타이틀 */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="text-yellow-400 text-sm font-medium tracking-wider mb-1">
                    업적 달성!
                  </div>
                  <h2 className="text-white text-2xl font-bold mb-2">
                    {achievement.name}
                  </h2>
                  <p className="text-gray-400 text-sm mb-4">
                    {achievement.description}
                  </p>
                </motion.div>

                {/* 보상 */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="inline-flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full"
                >
                  <span className="text-yellow-400">⭐</span>
                  <span className="text-yellow-400 font-bold">+{achievement.xpReward} XP</span>
                </motion.div>

                {/* 티어 뱃지 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mt-4"
                >
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${tierColors[achievement.tier]} text-white uppercase tracking-wider`}>
                    {achievement.tier}
                  </span>
                </motion.div>
              </div>
            </div>

            {/* 파티클 효과 */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, scale: 0 }}
                animate={{
                  opacity: 0,
                  scale: 1,
                  x: Math.cos((i * 30 * Math.PI) / 180) * 100,
                  y: Math.sin((i * 30 * Math.PI) / 180) * 100,
                }}
                transition={{ delay: 0.3, duration: 1 }}
                className="absolute top-1/2 left-1/2 w-3 h-3 bg-yellow-400 rounded-full"
                style={{ transform: 'translate(-50%, -50%)' }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 업적 카드 (목록용)
export function AchievementCard({
  achievement,
  isUnlocked,
  progress,
}: {
  achievement: Achievement;
  isUnlocked: boolean;
  progress?: { current: number; required: number; percentage: number };
}) {
  return (
    <div
      className={`relative p-4 rounded-xl border-2 transition-all ${
        isUnlocked
          ? `bg-gradient-to-br ${tierColors[achievement.tier]} border-transparent text-white`
          : 'bg-gray-100 border-gray-200 text-gray-500'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`text-3xl ${isUnlocked ? '' : 'grayscale opacity-50'}`}
        >
          {achievement.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold ${isUnlocked ? 'text-white' : 'text-gray-700'}`}>
            {achievement.name}
          </h3>
          <p className={`text-sm ${isUnlocked ? 'text-white/80' : 'text-gray-500'}`}>
            {achievement.description}
          </p>

          {!isUnlocked && progress && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span>{progress.current} / {progress.required}</span>
                <span>{progress.percentage}%</span>
              </div>
              <div className="h-1.5 bg-gray-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-2 flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isUnlocked ? 'bg-white/20' : 'bg-gray-200'
            }`}>
              {achievement.tier}
            </span>
            <span className="text-xs">⭐ {achievement.xpReward} XP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
