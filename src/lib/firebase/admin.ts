// Firebase Admin SDK (서버 사이드용)
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App | null = null;
let adminDbInstance: Firestore | null = null;
let adminAuthInstance: Auth | null = null;

function getAdminApp(): App {
  if (!adminApp && getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Firebase Admin SDK 환경 변수가 설정되지 않았습니다.');
    }

    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  } else if (getApps().length > 0) {
    adminApp = getApps()[0];
  }

  return adminApp!;
}

export function getAdminDb(): Firestore {
  if (!adminDbInstance) {
    adminDbInstance = getFirestore(getAdminApp());
  }
  return adminDbInstance;
}

export function getAdminAuth(): Auth {
  if (!adminAuthInstance) {
    adminAuthInstance = getAuth(getAdminApp());
  }
  return adminAuthInstance;
}

// 레거시 호환성을 위한 getter (lazy initialization)
export const adminDb = {
  collection: (path: string) => getAdminDb().collection(path),
};

export const adminAuth = {
  getUser: (uid: string) => getAdminAuth().getUser(uid),
  getUserByEmail: (email: string) => getAdminAuth().getUserByEmail(email),
};
