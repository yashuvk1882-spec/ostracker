/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, Firestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let isRealFirebaseEnabled = false;

// Interface for unified User session
export interface TrackerUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerId: string; // 'google' | 'email' | 'phone' | 'microsoft' | 'guest'
  phoneNumber?: string | null;
}

/**
 * Safe runtime fetch initializer avoiding compile-time Rollup static resolution issues.
 * This guarantees the production site compiles correctly under Vercel/Vite.
 */
export async function tryInitFirebase(): Promise<boolean> {
  if (isRealFirebaseEnabled) return true;
  try {
    const res = await fetch('/firebase-applet-config.json');
    if (res.ok) {
      const firebaseConfig = await res.json();
      if (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
        if (getApps().length === 0) {
          app = initializeApp(firebaseConfig);
        } else {
          app = getApp();
        }
        auth = getAuth(app);
        db = getFirestore(app);
        isRealFirebaseEnabled = true;
        console.info("⚡ Real Firebase initialized successfully over runtime fetch.");
        return true;
      }
    }
  } catch (e) {
    // Normal when running inside a guest environment or Vercel before linking config
  }
  return false;
}

// Trigger initial asynchronous handshake
tryInitFirebase();

export function isFirebaseReady(): boolean {
  return isRealFirebaseEnabled && auth !== null && db !== null;
}

export function getFirebaseAuth(): Auth | null {
  return auth;
}

export function getFirebaseFirestore(): Firestore | null {
  return db;
}

/**
 * Sync logged-in state and return helper functions for authentication
 */
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut };
