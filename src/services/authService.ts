/**
 * Authentication Service - Giezra Farms Limited
 * Firebase Authentication integration with Firestore RBAC role resolution
 */

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  sendPasswordResetEmail as fbSendPasswordReset,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { signInWithGoogle, getGoogleAccessToken, setGoogleAccessToken } from './googleAuth';
import { logActivity } from './activityLogService';
import { User, UserRole } from '../types/erp';

const USERS_COLLECTION = 'users';

export interface FirestoreUserProfile {
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  office_position?: string;
  department?: string;
  created_at: string;
  last_login?: string;
}

export function roleToPermissions(role: UserRole): string[] {
  switch (role) {
    case 'CEO':
    case 'SYSTEM_ADMINISTRATOR':
      return ['all', 'read_all', 'write_all', 'manage_users', 'manage_settings', 'view_reports', 'manage_stock', 'manage_sales', 'manage_orders', 'manage_customers', 'manage_finances', 'delete_records'];
    case 'ASSISTANT_CEO':
      return ['read_all', 'write_all', 'view_reports', 'manage_stock', 'manage_sales', 'manage_orders', 'manage_customers', 'manage_finances'];
    case 'OPERATIONS_MANAGER':
      return ['manage_production', 'manage_slaughter', 'manage_stock', 'manage_warehouse', 'view_reports', 'record_expenses'];
    case 'SALES_MANAGER':
      return ['manage_customers', 'manage_orders', 'manage_payments', 'generate_invoices', 'generate_quotations', 'view_sales_reports'];
    case 'STOCK_MANAGER':
      return ['manage_stock', 'record_stock_movements', 'adjust_stock', 'view_stock_reports'];
    default:
      return ['view_assigned'];
  }
}

/**
 * Fetch user RBAC document from Firestore /users/{uid}
 */
export async function getUserProfile(uid: string): Promise<User | null> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) return null;

    const data = snap.data();
    return {
      id: uid,
      name: data.full_name || data.name || 'Giezra Team Member',
      email: data.email || '',
      role: data.role || 'SALES_MANAGER',
      phone: data.phone || '',
      isActive: data.status === 'ACTIVE' || data.isActive === true,
      createdAt: data.created_at || new Date().toISOString(),
      lastLogin: data.last_login || new Date().toISOString(),
      officePosition: data.office_position || data.officePosition,
      department: data.department
    };
  } catch (err) {
    console.warn('[AuthService] Could not fetch user document:', err);
    return null;
  }
}

/**
 * Login with email and password via Firebase Auth
 */
export async function loginWithEmail(email: string, password?: string): Promise<{
  user: User;
  firebaseUser: FirebaseUser;
}> {
  // If password is provided, authenticate with Firebase Auth
  let fbUser: FirebaseUser;
  if (password && password.trim().length >= 6) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    fbUser = cred.user;
  } else {
    // If running in development/fallback without passwords enabled, check existing user
    if (!auth.currentUser || auth.currentUser.email !== email) {
      throw new Error('Password must be at least 6 characters for cloud authentication.');
    }
    fbUser = auth.currentUser;
  }

  // Fetch or bootstrap profile in Firestore
  let profile = await getUserProfile(fbUser.uid);
  if (!profile) {
    const isRoot = email === 'giezrafarmslimited@gmail.com' || email === 'ceo@giezrafarms.co.tz';
    const role: UserRole = isRoot ? 'CEO' : 'SALES_MANAGER';

    profile = {
      id: fbUser.uid,
      name: fbUser.displayName || email.split('@')[0],
      email,
      role,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, USERS_COLLECTION, fbUser.uid), {
        user_id: fbUser.uid,
        full_name: profile.name,
        email,
        role,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        _timestamp: serverTimestamp()
      });
    } catch (e) {
      console.warn('Could not bootstrap user doc:', e);
    }
  } else {
    // Update last login
    try {
      await updateDoc(doc(db, USERS_COLLECTION, fbUser.uid), {
        last_login: new Date().toISOString(),
        _timestamp: serverTimestamp()
      });
    } catch (e) {}
  }

  await logActivity({
    user_id: fbUser.uid,
    user_name: profile.name,
    action: 'USER_LOGIN',
    module: 'Auth',
    description: `User ${profile.name} (${profile.email}) logged in with role ${profile.role}`
  });

  return { user: profile, firebaseUser: fbUser };
}

/**
 * Google Sign In via Firebase Auth with Google Drive & Gmail scopes
 */
export async function loginWithGoogleAuth(): Promise<{
  user: User;
  accessToken: string;
}> {
  const result = await signInWithGoogle();
  const fbUser = result.user;

  let profile = await getUserProfile(fbUser.uid);
  if (!profile) {
    const isRoot = fbUser.email === 'giezrafarmslimited@gmail.com' || fbUser.email?.includes('ceo');
    const role: UserRole = isRoot ? 'CEO' : 'SALES_MANAGER';

    profile = {
      id: fbUser.uid,
      name: fbUser.displayName || 'Giezra Team Member',
      email: fbUser.email || '',
      role,
      avatarUrl: fbUser.photoURL || undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, USERS_COLLECTION, fbUser.uid), {
        user_id: fbUser.uid,
        full_name: profile.name,
        email: profile.email,
        role,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        _timestamp: serverTimestamp()
      });
    } catch (e) {
      console.warn('Could not write user profile on Google login:', e);
    }
  } else {
    try {
      await updateDoc(doc(db, USERS_COLLECTION, fbUser.uid), {
        last_login: new Date().toISOString(),
        _timestamp: serverTimestamp()
      });
    } catch (e) {}
  }

  await logActivity({
    user_id: fbUser.uid,
    user_name: profile.name,
    action: 'GOOGLE_SIGNIN',
    module: 'Auth',
    description: `Signed in via Google OAuth with Drive & Gmail scopes: ${profile.email}`
  });

  return {
    user: profile,
    accessToken: result.accessToken
  };
}

/**
 * Register a new employee with Firebase Auth & Firestore
 */
export async function registerEmployee(userData: {
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  phone?: string;
}): Promise<User> {
  const pwd = userData.password && userData.password.length >= 6 ? userData.password : 'Giezra@2026';
  const cred = await createUserWithEmailAndPassword(auth, userData.email, pwd);
  const fbUser = cred.user;

  await updateProfile(fbUser, { displayName: userData.name });

  const newUser: User = {
    id: fbUser.uid,
    name: userData.name,
    email: userData.email,
    role: userData.role,
    phone: userData.phone,
    isActive: true,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, USERS_COLLECTION, fbUser.uid), {
      user_id: fbUser.uid,
      full_name: userData.name,
      email: userData.email,
      role: userData.role,
      phone: userData.phone || '',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      _timestamp: serverTimestamp()
    });

    await logActivity({
      user_id: auth.currentUser?.uid || fbUser.uid,
      user_name: userData.name,
      action: 'USER_REGISTERED',
      module: 'Auth',
      record_id: fbUser.uid,
      description: `Staff account registered for ${userData.name} (${userData.role})`
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${USERS_COLLECTION}/${fbUser.uid}`);
  }

  return newUser;
}

/**
 * Send password reset email
 */
export async function requestPasswordReset(email: string): Promise<boolean> {
  try {
    await fbSendPasswordReset(auth, email);
    await logActivity({
      user_id: 'guest',
      user_name: email,
      action: 'PASSWORD_RESET_REQUEST',
      module: 'Auth',
      description: `Password reset email requested for ${email}`
    });
    return true;
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
}

/**
 * Sign out of Firebase and Google
 */
export async function logoutUser(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (e) {
    console.warn('Sign out error:', e);
  }
}
