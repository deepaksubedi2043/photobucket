import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Read active configuration with environment variable override support
const effectiveConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || firebaseConfig.apiKey,
  authDomain:
    (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) ||
    (import.meta.env.VITE_FIREBASE_PROJECT_ID
      ? `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`
      : firebaseConfig.authDomain),
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || firebaseConfig.projectId,
  storageBucket:
    (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) ||
    (import.meta.env.VITE_FIREBASE_PROJECT_ID
      ? `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`
      : firebaseConfig.storageBucket),
  messagingSenderId:
    (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || firebaseConfig.messagingSenderId,
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || firebaseConfig.appId,
  measurementId:
    (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string) || firebaseConfig.measurementId,
};

// Initialize Firebase App
const app = initializeApp(effectiveConfig);

// Use default database for custom user projects or provisioned DB ID
const databaseId =
  (import.meta.env.VITE_FIREBASE_DATABASE_ID as string) ||
  (effectiveConfig.projectId === firebaseConfig.projectId
    ? firebaseConfig.firestoreDatabaseId
    : "(default)");

export const db = getFirestore(app, databaseId);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on app bootstrap as required by Firebase skill
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firestore client is offline or initializing.");
    }
    // Document not existing or other benign bootstrap state is safe to ignore
  }
}

// Helper for Google Sign-In with popup
export async function signInWithGooglePopup() {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    return result.user;
  } catch (error: any) {
    if (
      error?.code === "auth/popup-closed-by-user" ||
      error?.code === "auth/cancelled-popup-request" ||
      error?.message?.includes("auth/popup-closed-by-user")
    ) {
      // User closed the popup or cancelled the request - benign user cancellation
      return null;
    }
    console.error("Firebase Google Sign-In Error:", error);
    throw error;
  }
}

// Helper for Firebase Sign-Out
export async function firebaseSignOut() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Firebase Sign-Out Error:", error);
    throw error;
  }
}
