// ============================================================
// 셈마루(SemMaru) - Firebase Authentication
// Firestore 직접 접근을 API 호출로 교체
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
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "./config";
import { api } from "@/lib/api/client";

// Sign up with email and password
export async function signUp(
  email: string,
  password: string,
  name: string,
  grade: number,
): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const user = userCredential.user;

  // Update display name
  await updateProfile(user, { displayName: name });

  // Create user profile in D1 via API
  await api.createUser({ name, email, grade });

  return user;
}

// Sign in with email and password
export async function signIn(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );
  return userCredential.user;
}

// Sign in with Google
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  const user = userCredential.user;

  // Check if user profile exists via API, create if not
  try {
    await api.getUser();
  } catch {
    // User doesn't exist → create new profile
    await api.createUser({
      name: user.displayName || "User",
      email: user.email || "",
      grade: 7,
    });
  }

  return user;
}

// Sign out
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// Reset password
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// Get current user
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// Subscribe to auth state changes
export function onAuthChange(
  callback: (user: User | null) => void,
): () => void {
  return onAuthStateChanged(auth, callback);
}

// Get user profile from D1 via API
export async function getUserProfile(uid: string) {
  try {
    const result = await api.getUser();
    if (result && result.user) {
      return { id: result.user.id, ...result.user };
    }
    return null;
  } catch {
    return null;
  }
}

// Update user profile via API
export async function updateUserProfile(
  uid: string,
  data: Record<string, unknown>,
) {
  await api.updateUser(data);
}
