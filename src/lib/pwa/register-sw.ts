/**
 * Service Worker 등록 및 업데이트 감지
 */
export function registerSW(onUpdate: () => void): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          // 새 SW가 설치 완료되었고, 기존 SW가 이미 있는 경우 = 업데이트
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            onUpdate();
          }
        });
      });
    } catch (err) {
      console.warn("[SW] Registration failed:", err);
    }
  });
}
