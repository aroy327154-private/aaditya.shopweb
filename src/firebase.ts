import { getApp, getApps, initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, signInWithPopup, signOut, type User } from 'firebase/auth';
import { doc, getDoc, getDocFromServer, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();

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

export async function signInWithGooglePopup(): Promise<{ idToken: string }> {
  try {
    const credential = await signInWithPopup(auth, googleProvider);
    const idToken = await credential.user.getIdToken();
    void syncGoogleUserProfile(credential.user).catch(() => {
      // Structured error already logged inside handleFirestoreError; do not block storefront session issuance
    });
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
          ? `Domain "${host}" is not authorized. Add it in Firebase Console → Authentication → Settings → Authorized domains.`
          : 'This domain is not authorized for Google Sign-In in Firebase Console.',
      );
    }
    throw new Error(err instanceof Error ? err.message : 'Google sign-in failed');
  }
}

export async function firebaseSignOut(): Promise<void> {
  await signOut(auth);
}
