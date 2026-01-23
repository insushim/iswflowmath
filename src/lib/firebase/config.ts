// ============================================================
// MathFlow - Firebase Configuration
// ============================================================

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

// 환경변수 값 정리 (공백/개행 제거)
const cleanEnvVar = (value: string | undefined): string => {
  return value?.trim() || '';
};

const firebaseConfig = {
  apiKey: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  measurementId: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID)
};

// Firebase 설정 유효성 검사
const validateConfig = () => {
  const required = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missing = required.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

  if (missing.length > 0) {
    console.error('[Firebase] Missing required config:', missing.join(', '));
    return false;
  }
  return true;
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let analytics: Analytics | null = null;

try {
  if (!validateConfig()) {
    throw new Error('Firebase configuration is incomplete');
  }

  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  // Initialize Analytics (client-side only)
  if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
      if (supported) {
        try {
          analytics = getAnalytics(app);
        } catch (e) {
          console.warn('[Firebase] Analytics initialization failed:', e);
        }
      }
    }).catch(e => {
      console.warn('[Firebase] Analytics support check failed:', e);
    });
  }
} catch (error) {
  console.error('[Firebase] Initialization failed:', error);
  // 기본 초기화 시도 (앱 크래시 방지)
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db, analytics };
