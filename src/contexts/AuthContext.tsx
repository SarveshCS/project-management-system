'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  getAuthToken: () => Promise<string | null>;
  completeProfile: (fullName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  signInWithEmail: async () => {},
  resetPassword: async () => {},
  logout: async () => {},
  getAuthToken: async () => null,
  completeProfile: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const normalizeAllowedDomain = (value?: string) => {
  const v = (value || '').trim();
  if (!v) return '';
  const lower = v.toLowerCase();
  return lower === 'false' || lower === '0' || lower === 'no' ? '' : v;
};

const allowedDomain = normalizeAllowedDomain(process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || process.env.ALLOWED_EMAIL_DOMAIN);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [justSignedIn, setJustSignedIn] = useState(false);

  const loadUserProfile = useCallback(async (fbUser: FirebaseUser) => {
    try {
      // Optional email domain restriction
      if (allowedDomain && fbUser.email && !fbUser.email.toLowerCase().endsWith(`@${allowedDomain.toLowerCase()}`)) {
        await signOut(auth);
        setUser(null);
        setFirebaseUser(null);
        toast.error('Email domain not allowed');
        return;
      }

      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Do NOT auto-create. Only admin can register users.
        await signOut(auth);
        setUser(null);
        setFirebaseUser(null);
        toast.error('Account not registered. Contact admin.');
        return;
      }

      const userData = userDoc.data() as User;
      setUser(userData);
      if (justSignedIn) {
        toast.success(`Signed in as ${userData.role}`, { duration: 1500 });
        setJustSignedIn(false);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast.error('Failed to load user profile');
    }
  }, [justSignedIn]);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);

      // Optional domain restriction at login attempt
      if (allowedDomain && !email.toLowerCase().endsWith(`@${allowedDomain.toLowerCase()}`)) {
        const err: Error & { code?: string } = new Error('Email domain not allowed');
        err.code = 'auth/domain-restricted';
        throw err;
      }

  setJustSignedIn(true);
  await signInWithEmailAndPassword(auth, email, password);
      // user/profile loads in onAuthStateChanged
    } catch (error) {
      console.error('Error signing in with email:', error);
      let errorMessage = 'Failed to sign in';
      const code = (error as { code?: string }).code;
      switch (code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Try again later';
          break;
        case 'auth/domain-restricted':
          errorMessage = 'Email domain not allowed';
          break;
        default:
          errorMessage = (error as Error).message || 'Failed to sign in';
      }
      toast.error(errorMessage);
      setLoading(false);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent');
    } catch (error) {
      console.error('Error sending reset email:', error);
      let errorMessage = 'Failed to send reset email';
      const code = (error as { code?: string }).code;
      switch (code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        default:
          errorMessage = (error as Error).message || 'Failed to send reset email';
      }
      toast.error(errorMessage);
      throw error;
    }
  };

  const completeProfile = async (fullName: string) => {
    if (!firebaseUser) return;
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, { fullName: fullName.trim(), profileCompleted: true });
      setUser((prev) => prev ? { ...prev, fullName: fullName.trim(), profileCompleted: true } : prev);
      toast.success('Profile completed');
    } catch (error) {
      console.error('Error completing profile:', error);
      toast.error('Failed to complete profile');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fb) => {
      setFirebaseUser(fb);
      if (fb) {
        await loadUserProfile(fb);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [loadUserProfile]);

  const getAuthToken = async (): Promise<string | null> => {
    try {
      if (firebaseUser) {
        return await firebaseUser.getIdToken();
      }
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    signInWithEmail,
    resetPassword,
    logout,
    getAuthToken,
    completeProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
