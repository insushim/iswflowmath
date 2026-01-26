import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';

const notoSansKR = Noto_Sans_KR({
  variable: '--font-noto-sans-kr',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'MathFlow - 몰입으로 수학을 정복하다',
  description: 'AI 기반 적응형 수학 학습 플랫폼. Flow 이론과 IRT를 활용한 개인 맞춤형 학습 경험.',
  keywords: ['수학', '학습', 'AI', '몰입', '교육', '적응형 학습', 'IRT'],
  authors: [{ name: 'MathFlow Team' }],
  openGraph: {
    title: 'MathFlow - 몰입으로 수학을 정복하다',
    description: 'AI 기반 적응형 수학 학습 플랫폼',
    type: 'website',
    locale: 'ko_KR',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark" suppressHydrationWarning>
      <body className={`${notoSansKR.variable} font-sans antialiased bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
