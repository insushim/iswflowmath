"use client";

import dynamic from "next/dynamic";

const UpdateNotification = dynamic(
  () => import("@/components/pwa/UpdateNotification"),
  { ssr: false },
);
const IOSInstallPrompt = dynamic(
  () => import("@/components/pwa/IOSInstallPrompt"),
  { ssr: false },
);

export default function PWAProvider() {
  return (
    <>
      <UpdateNotification />
      <IOSInstallPrompt />
    </>
  );
}
