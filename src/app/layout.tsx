import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import PWAProvider from "@/components/pwa/PWAProvider";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "셈마루 - 몰입으로 수학의 정상에 오르다",
  description:
    "AI 기반 적응형 수학 학습 플랫폼. Flow 이론과 IRT를 활용한 개인 맞춤형 학습 경험. 초등~고등 전 학년 심화 수학.",
  keywords: [
    "수학",
    "학습",
    "AI",
    "몰입",
    "교육",
    "적응형 학습",
    "IRT",
    "셈마루",
    "심화수학",
  ],
  authors: [{ name: "셈마루 팀" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icon-512.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "셈마루",
  },
  openGraph: {
    title: "셈마루 - 몰입으로 수학의 정상에 오르다",
    description:
      "AI 기반 적응형 수학 학습 플랫폼. 초등~고등 전 학년 심화 수학.",
    type: "website",
    locale: "ko_KR",
    siteName: "셈마루",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${notoSansKR.variable} font-sans antialiased min-h-screen`}
      >
        {children}
        <PWAProvider />
      </body>
    </html>
  );
}
