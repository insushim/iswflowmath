// ============================================================
// MathFlow - Firebase Authentication
// ============================================================

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

// Sign up with email and password
export async function signUp(
  email: string,
  password: string,
  name: string,
  grade: number
): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update display name
  await updateProfile(user, { displayName: name });

  // Create user profile in Firestore
  await setDoc(doc(db, 'users', user.uid), {
    name,
    email,
    grade,
    subscriptionTier: 'free',
    totalXp: 0,
    currentLevel: 1,
    theta: 0,
    streakDays: 0,
    lastPracticeDate: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return user;
}

// Sign in with email and password
export async function signIn(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

// Sign in with Google
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  const user = userCredential.user;

  // Check if user profile exists
  const userDoc = await getDoc(doc(db, 'users', user.uid));

  if (!userDoc.exists()) {
    // Create new profile for Google sign-in users
    await setDoc(doc(db, 'users', user.uid), {
      name: user.displayName || 'User',
      email: user.email,
      grade: 7, // Default grade
      subscriptionTier: 'free',
      totalXp: 0,
      currentLevel: 1,
      theta: 0,
      streakDays: 0,
      lastPracticeDate: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return user;
}

// Sign out
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// Get current user
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// Subscribe to auth state changes
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// Get user profile from Firestore
export async function getUserProfile(uid: string) {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (userDoc.exists()) {
    return { id: userDoc.id, ...userDoc.data() };
  }
  return null;
}

// Update user profile
export async function updateUserProfile(uid: string, data: Record<string, unknown>) {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
