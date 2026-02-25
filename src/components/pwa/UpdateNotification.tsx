"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X } from "lucide-react";
import { registerSW } from "@/lib/pwa/register-sw";

export default function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    registerSW(() => {
      setShowUpdate(true);
    });
  }, []);

  const handleUpdate = useCallback(() => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
    }
    window.location.reload();
  }, []);

  const handleClose = useCallback(() => {
    setShowUpdate(false);
  }, []);

  return (
    <AnimatePresence>
      {showUpdate && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md"
        >
          <div className="bg-slate-800 border border-indigo-500/30 rounded-xl shadow-2xl shadow-indigo-500/10 px-4 py-3 flex items-center gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">
                새 버전이 있습니다
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                업데이트하시겠습니까?
              </p>
            </div>
            <button
              onClick={handleUpdate}
              className="flex-shrink-0 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              업데이트
            </button>
            <button
              onClick={handleClose}
              className="flex-shrink-0 p-1 text-slate-400 hover:text-white transition-colors"
              aria-label="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
