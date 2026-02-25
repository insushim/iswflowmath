"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share, X, Plus } from "lucide-react";

const DISMISS_KEY = "semmaru-ios-install-dismissed";
const DISMISS_DAYS = 7;

function isIOSSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) &&
    !(window as unknown as { MSStream?: unknown }).MSStream;
  // Safari만 감지 (Chrome on iOS 등 제외하지 않음 - iOS에서는 모두 WebKit)
  return isIOS;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (!dismissed) return false;
    const dismissedAt = parseInt(dismissed, 10);
    const now = Date.now();
    const diffDays = (now - dismissedAt) / (1000 * 60 * 60 * 24);
    return diffDays < DISMISS_DAYS;
  } catch {
    return false;
  }
}

function setDismissed(): void {
  try {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  } catch {
    // localStorage 접근 불가 시 무시
  }
}

export default function IOSInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isIOSSafari() && !isStandalone() && !isDismissed()) {
      // 약간의 딜레이 후 표시 (페이지 로드 직후 바로 뜨면 UX 안 좋음)
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = useCallback(() => {
    setShow(false);
    setDismissed();
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9998] w-[calc(100%-2rem)] max-w-md"
        >
          <div className="bg-slate-800 border border-indigo-500/30 rounded-xl shadow-2xl shadow-indigo-500/10 p-4">
            {/* 헤더 */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">
                  홈 화면에 추가
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1 text-slate-400 hover:text-white transition-colors"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 설명 */}
            <p className="text-xs text-slate-300 mb-3">
              셈마루를 앱처럼 사용할 수 있습니다.
            </p>

            {/* 단계 안내 */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                  1
                </span>
                <span className="flex items-center gap-1">
                  하단의
                  <Share className="w-3.5 h-3.5 text-indigo-400 inline" />
                  <span className="text-white font-medium">공유</span> 버튼 탭
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                  2
                </span>
                <span className="flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5 text-indigo-400 inline" />
                  <span className="text-white font-medium">
                    홈 화면에 추가
                  </span>{" "}
                  선택
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
