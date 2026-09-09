import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  User as FirebaseUser 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App lazily and cleanly
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure Google Auth Provider with Google Drive, Gmail, and Email scopes
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Flag to track ongoing sign in flow
let isSigningIn = false;

// Cached access token in memory (NEVER in localStorage/sessionStorage per security rules)
let cachedAccessToken: string | null = null;
let currentGoogleUser: FirebaseUser | null = null;

/**
 * Initialize Auth State Listener
 */
export const initGoogleAuth = (
  onSuccess?: (user: FirebaseUser, token: string) => void,
  onSignedOut?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    currentGoogleUser = user;
    if (user && cachedAccessToken) {
      if (onSuccess) onSuccess(user, cachedAccessToken);
    } else if (!user) {
      cachedAccessToken = null;
      if (onSignedOut) onSignedOut();
    }
  });
};

/**
 * Google Sign In via Firebase Popup with Gmail Scopes
 */
export const signInWithGoogle = async (): Promise<{
  user: FirebaseUser;
  accessToken: string;
  email: string;
  displayName: string;
  photoURL: string | null;
}> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Could not retrieve Google OAuth access token. Please verify permissions.');
    }

    cachedAccessToken = credential.accessToken;
    currentGoogleUser = result.user;

    return {
      user: result.user,
      accessToken: cachedAccessToken,
      email: result.user.email || '',
      displayName: result.user.displayName || 'Giezra Team Member',
      photoURL: result.user.photoURL || null
    };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get the currently cached in-memory access token
 */
export const getGoogleAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Set or update the cached token (in-memory only)
 */
export const setGoogleAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

/**
 * Get current Firebase Google User
 */
export const getCurrentGoogleUser = (): FirebaseUser | null => {
  return currentGoogleUser;
};

/**
 * Sign out of Google Auth
 */
export const googleSignOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (e) {
    console.warn('Firebase sign out error:', e);
  } finally {
    cachedAccessToken = null;
    currentGoogleUser = null;
  }
};
