import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types/erp';
import { 
  signInWithGoogle, 
  googleSignOut, 
  getGoogleAccessToken, 
  setGoogleAccessToken 
} from '../services/googleAuth';
import { 
  sendEmailViaGmailApi, 
  buildOtpEmailHtml, 
  buildLoginAlertEmailHtml 
} from '../services/emailService';

export interface EmailLogItem {
  id: string;
  timestamp: string;
  to: string;
  subject: string;
  type: string;
  otpCode?: string;
  status: string;
  sender: string;
  messageId?: string;
}

interface AuthContextType {
  currentUser: User | null;
  userPermissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  googleAccessToken: string | null;
  login: (email: string, password?: string, remember?: boolean) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  requestOtp: (email: string, name?: string, type?: 'login' | 'signup' | 'verification' | 'reset') => Promise<{ success: boolean; otp?: string; expiresAt?: number; error?: string; message?: string }>;
  verifyOtp: (email: string, otp: string, type?: string, userData?: any) => Promise<{ success: boolean; error?: string; user?: User }>;
  registerWithEmail: (userData: { name: string; email: string; role?: UserRole; phone?: string; password?: string }) => Promise<{ success: boolean; otp?: string; expiresAt?: number; error?: string; message?: string }>;
  logout: () => void;
  createUser: (userData: { name: string; email: string; role: UserRole; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  toggleUserStatus: (userId: string) => Promise<{ success: boolean; error?: string }>;
  unlockUserAccount: (userId: string) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (userId: string, profileData: Partial<User>) => Promise<{ success: boolean; error?: string; user?: User }>;
  changeUserPassword: (userId: string, newPassword: string, currentPassword?: string) => Promise<{ success: boolean; error?: string }>;
  sendPasswordResetEmail: (userId: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  toggleUser2FA: (userId: string, enabled?: boolean) => Promise<{ success: boolean; error?: string; twoFactorEnabled?: boolean }>;
  verifyUserEmail: (userId: string) => Promise<{ success: boolean; error?: string }>;
  hasPermission: (permission: string) => boolean;
  usersList: User[];
  refreshUsers: () => Promise<void>;
  emailLogs: EmailLogItem[];
  refreshEmailLogs: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLogItem[]>([]);
  const [googleTokenState, setGoogleTokenState] = useState<string | null>(null);

  const fetchEmailLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/email-logs');
      if (res.ok) {
        const data = await res.json();
        setEmailLogs(data);
      }
    } catch (e) {
      console.error('Failed to load email logs:', e);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsersList(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  useEffect(() => {
    // Check saved session
    const savedUser = localStorage.getItem('giezra_erp_user');
    const savedPermissions = localStorage.getItem('giezra_erp_permissions');

    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
        setUserPermissions(savedPermissions ? JSON.parse(savedPermissions) : []);
      } catch (e) {
        console.error('Failed to parse saved user session', e);
      }
    }
    setIsLoading(false);
    fetchUsers();
    fetchEmailLogs();
  }, [fetchUsers, fetchEmailLogs]);

  const login = async (email: string, password = 'password', remember = true) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Authentication failed' };
      }

      setCurrentUser(data.user);
      setUserPermissions(data.permissions);

      if (remember) {
        localStorage.setItem('giezra_erp_user', JSON.stringify(data.user));
        localStorage.setItem('giezra_erp_permissions', JSON.stringify(data.permissions));
      }

      await fetchUsers();
      fetchEmailLogs();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Server error connecting to GIEZRA ERP' };
    }
  };

  /**
   * Google Sign-In with popup + Gmail API scope authorization
   */
  const loginWithGoogle = async () => {
    try {
      const googleData = await signInWithGoogle();
      setGoogleTokenState(googleData.accessToken);

      // Authenticate or register with GIEZRA ERP backend
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: googleData.email,
          name: googleData.displayName,
          avatarUrl: googleData.photoURL
        })
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Google login failed on ERP backend' };
      }

      setCurrentUser(data.user);
      setUserPermissions(data.permissions);
      localStorage.setItem('giezra_erp_user', JSON.stringify(data.user));
      localStorage.setItem('giezra_erp_permissions', JSON.stringify(data.permissions));

      // Attempt sending confirmation login alert via Gmail API
      if (googleData.accessToken && googleData.email) {
        try {
          const alertHtml = buildLoginAlertEmailHtml({
            recipientName: googleData.displayName,
            device: 'Google Single Sign-On (Gmail Scope Authorized)',
            location: 'Dar es Salaam / Coast Region, Tanzania',
            timestamp: new Date().toLocaleString()
          });

          await sendEmailViaGmailApi({
            to: googleData.email,
            subject: '[GIEZRA ERP] Google Single Sign-On Security Alert',
            htmlBody: alertHtml,
            token: googleData.accessToken
          });
        } catch (e) {
          console.warn('Google security alert email dispatch optional notice:', e);
        }
      }

      await fetchUsers();
      fetchEmailLogs();
      return { success: true };
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      return { success: false, error: err.message || 'Google Sign-In was cancelled or failed.' };
    }
  };

  /**
   * Request OTP code to be sent to user email
   */
  const requestOtp = async (
    email: string, 
    name?: string, 
    type: 'login' | 'signup' | 'verification' | 'reset' = 'verification'
  ) => {
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, type })
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to send OTP code' };
      }

      // If we have a cached Google OAuth access token, dispatch real email directly via Gmail API
      const token = getGoogleAccessToken() || googleTokenState;
      if (token && data.otp) {
        try {
          const emailHtml = buildOtpEmailHtml({
            recipientName: name || email.split('@')[0],
            otpCode: data.otp,
            purpose: type === 'signup' ? 'New Account Registration' : type === 'login' ? 'Secure Login Verification' : 'Email Authentication',
            expiresInMinutes: 10
          });

          await sendEmailViaGmailApi({
            to: email,
            subject: `[GIEZRA ERP] Your Verification Passcode (OTP): ${data.otp}`,
            htmlBody: emailHtml,
            token
          });
        } catch (mailErr) {
          console.warn('Could not dispatch via direct Gmail API, server logged instead:', mailErr);
        }
      }

      fetchEmailLogs();
      return { 
        success: true, 
        otp: data.otp, 
        expiresAt: data.expiresAt,
        message: data.message 
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error requesting OTP' };
    }
  };

  /**
   * Verify entered OTP code
   */
  const verifyOtp = async (email: string, otp: string, type?: string, userData?: any) => {
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, type, userData })
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Invalid verification passcode' };
      }

      if (data.user) {
        setCurrentUser(data.user);
        setUserPermissions(data.permissions || []);
        localStorage.setItem('giezra_erp_user', JSON.stringify(data.user));
        localStorage.setItem('giezra_erp_permissions', JSON.stringify(data.permissions || []));
      }

      await fetchUsers();
      fetchEmailLogs();
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error verifying passcode' };
    }
  };

  /**
   * User Self-Registration
   */
  const registerWithEmail = async (userData: { 
    name: string; 
    email: string; 
    role?: UserRole; 
    phone?: string; 
    password?: string 
  }) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      // If we have cached Google OAuth token, send real email via Gmail API
      const token = getGoogleAccessToken() || googleTokenState;
      if (token && data.otp) {
        try {
          const emailHtml = buildOtpEmailHtml({
            recipientName: userData.name,
            otpCode: data.otp,
            purpose: 'Account Registration Verification',
            expiresInMinutes: 10
          });

          await sendEmailViaGmailApi({
            to: userData.email,
            subject: `[GIEZRA ERP] Welcome! Registration Passcode (OTP): ${data.otp}`,
            htmlBody: emailHtml,
            token
          });
        } catch (mailErr) {
          console.warn('Gmail API dispatch fallback:', mailErr);
        }
      }

      fetchEmailLogs();
      return { 
        success: true, 
        otp: data.otp, 
        expiresAt: data.expiresAt,
        message: data.message 
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during registration' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setUserPermissions([]);
    setGoogleTokenState(null);
    setGoogleAccessToken(null);
    googleSignOut().catch(() => {});
    localStorage.removeItem('giezra_erp_user');
    localStorage.removeItem('giezra_erp_permissions');
  };

  const createUser = async (userData: { name: string; email: string; role: UserRole; phone?: string }) => {
    if (!currentUser || (currentUser.role !== 'CEO' && currentUser.role !== 'SYSTEM_ADMINISTRATOR')) {
      return { success: false, error: 'Access Denied: Only the CEO and System Administrator are authorized to create user accounts.' };
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-id': currentUser.id,
          'x-user-name': currentUser.name
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to create user' };
      }

      await fetchUsers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error creating user' };
    }
  };

  const toggleUserStatus = async (userId: string) => {
    if (!currentUser || (currentUser.role !== 'CEO' && currentUser.role !== 'SYSTEM_ADMINISTRATOR')) {
      return { success: false, error: 'Access Denied: Only the CEO and System Administrator can alter user status.' };
    }

    try {
      const response = await fetch(`/api/users/${userId}/toggle`, {
        method: 'PATCH',
        headers: {
          'x-user-role': currentUser.role,
          'x-user-id': currentUser.id,
          'x-user-name': currentUser.name
        }
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to toggle status' };
      }

      await fetchUsers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error updating user status' };
    }
  };

  const unlockUserAccount = async (userId: string) => {
    if (!currentUser || (currentUser.role !== 'CEO' && currentUser.role !== 'SYSTEM_ADMINISTRATOR')) {
      return { success: false, error: 'Access Denied: Only CEO and System Administrator can unlock user accounts.' };
    }

    try {
      const response = await fetch(`/api/users/${userId}/unlock`, {
        method: 'POST',
        headers: {
          'x-user-role': currentUser.role,
          'x-user-id': currentUser.id,
          'x-user-name': currentUser.name
        }
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to unlock account' };
      }

      await fetchUsers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error unlocking user account' };
    }
  };

  const updateUserProfile = async (userId: string, profileData: Partial<User>) => {
    if (!currentUser) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await fetch(`/api/users/${userId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-id': currentUser.id,
          'x-user-name': currentUser.name
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to update profile' };
      }

      // If user updated their own profile, sync local session
      if (currentUser.id === userId) {
        setCurrentUser(data);
        localStorage.setItem('giezra_erp_user', JSON.stringify(data));
      }

      await fetchUsers();
      return { success: true, user: data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error updating profile' };
    }
  };

  const changeUserPassword = async (userId: string, newPassword: string, currentPassword?: string) => {
    if (!currentUser) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await fetch(`/api/users/${userId}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-id': currentUser.id,
          'x-user-name': currentUser.name
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to change password' };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error changing password' };
    }
  };

  const sendPasswordResetEmail = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/reset-password-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to send password reset email' };
      }

      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error triggering reset email' };
    }
  };

  const toggleUser2FA = async (userId: string, enabled?: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}/toggle-2fa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled })
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to toggle 2FA' };
      }

      if (currentUser && currentUser.id === userId) {
        const updated = { ...currentUser, twoFactorEnabled: data.twoFactorEnabled };
        setCurrentUser(updated);
        localStorage.setItem('giezra_erp_user', JSON.stringify(updated));
      }

      await fetchUsers();
      return { success: true, twoFactorEnabled: data.twoFactorEnabled };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error updating 2FA settings' };
    }
  };

  const verifyUserEmail = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/verify-email`, {
        method: 'POST'
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to verify email' };
      }

      if (currentUser && currentUser.id === userId) {
        const updated = { ...currentUser, emailVerified: true };
        setCurrentUser(updated);
        localStorage.setItem('giezra_erp_user', JSON.stringify(updated));
      }

      await fetchUsers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error verifying email' };
    }
  };

  const hasPermission = (permission: string) => {
    if (!currentUser) return false;
    if (currentUser.role === 'CEO') return true; // CEO has complete access
    return userPermissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userPermissions,
        isAuthenticated: !!currentUser,
        isLoading,
        googleAccessToken: googleTokenState,
        login,
        loginWithGoogle,
        requestOtp,
        verifyOtp,
        registerWithEmail,
        logout,
        createUser,
        toggleUserStatus,
        unlockUserAccount,
        updateUserProfile,
        changeUserPassword,
        sendPasswordResetEmail,
        toggleUser2FA,
        verifyUserEmail,
        hasPermission,
        usersList,
        refreshUsers: fetchUsers,
        emailLogs,
        refreshEmailLogs: fetchEmailLogs
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
