import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: '이름을 입력해주세요.' },
        { status: 400 }
      );
    }

    // Firestore에서 이름으로 사용자 검색
    const usersRef = adminDb.collection('users');
    const querySnapshot = await usersRef.where('name', '==', name.trim()).get();

    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: '입력하신 정보와 일치하는 계정을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이메일 마스킹
    const userData = querySnapshot.docs[0].data();
    const email = userData.email as string;
    const maskedEmail = maskEmail(email);

    return NextResponse.json({ email: maskedEmail });
  } catch (error) {
    console.error('Find email error:', error);
    return NextResponse.json(
      { error: '아이디 찾기 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 3) {
    return `${localPart[0]}**@${domain}`;
  }
  const visiblePart = localPart.slice(0, 3);
  const maskedPart = '*'.repeat(localPart.length - 3);
  return `${visiblePart}${maskedPart}@${domain}`;
}
