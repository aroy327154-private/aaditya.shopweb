import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, signInWithPopup, signOut, type Auth, type User } from 'firebase/auth';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import type { PublicGoogleAuthConfig } from './types';

const defaultApp = getApps().find((a) => a.name === '[DEFAULT]') || initializeApp(firebaseConfig);

export const db = getFirestore(defaultApp, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(defaultApp);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

let activeAuthInstance: Auth = auth;

function resolveAuthForConfig(override?: Partial<PublicGoogleAuthConfig> | null): {
  authInstance: Auth;
  usesDefaultProject: boolean;
} {
  const apiKey = (override?.apiKey || '').trim();
  const authDomain = (override?.authDomain || '').trim();
  const projectId = (override?.projectId || '').trim();
  const appId = (override?.appId || '').trim();

  if (!apiKey || !authDomain || !projectId) {
    return { authInstance: auth, usesDefaultProject: true };
  }

  const isSameAsDefault =
    apiKey === firebaseConfig.apiKey &&
    authDomain === firebaseConfig.authDomain &&
    projectId === firebaseConfig.projectId &&
    (!appId || appId === firebaseConfig.appId);

  if (isSameAsDefault) {
    return { authInstance: auth, usesDefaultProject: true };
  }

  const appName = `gauth-${projectId}-${apiKey.slice(-6)}`;
  let customApp: FirebaseApp | undefined = getApps().find((a) => a.name === appName);
  if (!customApp) {
    customApp = initializeApp(
      {
        apiKey,
        authDomain,
        projectId,
        ...(appId ? { appId } : {}),
      },
      appName,
    );
  }
  return { authInstance: getAuth(customApp), usesDefaultProject: false };
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: activeAuthInstance.currentUser?.uid,
      email: activeAuthInstance.currentUser?.email,
      emailVerified: activeAuthInstance.currentUser?.emailVerified,
      isAnonymous: activeAuthInstance.currentUser?.isAnonymous,
      tenantId: activeAuthInstance.currentUser?.tenantId,
      providerInfo:
        activeAuthInstance.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function syncGoogleUserProfile(user: User): Promise<void> {
  if (!user.uid || !user.email || !user.emailVerified) return;
  const userPath = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  const cleanName = (user.displayName || user.email.split('@')[0] || 'User').trim().slice(0, 100);
  const cleanEmail = user.email.trim().toLowerCase().slice(0, 254);

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await setDoc(
        ref,
        {
          name: cleanName,
          email: cleanEmail,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } else {
      await setDoc(ref, {
        uid: user.uid,
        email: cleanEmail,
        name: cleanName,
        authProvider: 'google',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export async function signInWithGooglePopup(
  override?: Partial<PublicGoogleAuthConfig> | null,
): Promise<{ idToken: string }> {
  try {
    const { authInstance, usesDefaultProject } = resolveAuthForConfig(override);
    activeAuthInstance = authInstance;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const credential = await signInWithPopup(authInstance, provider);
    const idToken = await credential.user.getIdToken();
    if (usesDefaultProject) {
      void syncGoogleUserProfile(credential.user).catch(() => {
        // Non-blocking profile sync
      });
    }
    return { idToken };
  } catch (err) {
    const code = (err as { code?: string })?.code || '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      throw new Error('Google sign-in popup was closed before completing');
    }
    if (code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked by browser. Please allow popups and try again.');
    }
    if (code === 'auth/unauthorized-domain') {
      const host = typeof window !== 'undefined' ? window.location.hostname : '';
      throw new Error(
        host
          ? `Domain "${host}" is not authorized for Google Sign-In.`
          : 'This domain is not authorized for Google Sign-In.',
      );
    }
    throw new Error('Google sign-in failed. Please try again or sign in with email.');
  }
}

export async function firebaseSignOut(): Promise<void> {
  try {
    await signOut(activeAuthInstance);
  } catch {
    await signOut(auth).catch(() => {});
  }
}
