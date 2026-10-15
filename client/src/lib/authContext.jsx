import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
        setAuthError(null);
      },
      (error) => {
        console.error('[Auth State Error]:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    if (!auth) {
      const msg = 'Firebase is not configured. Please supply Firebase credentials in client/.env';
      setAuthError(msg);
      throw new Error(msg);
    }
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err) {
      const friendlyMessage = formatAuthError(err.code || err.message);
      setAuthError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  };

  const register = async (email, password, displayName) => {
    setAuthError(null);
    if (!auth) {
      const msg = 'Firebase is not configured. Please supply Firebase credentials in client/.env';
      setAuthError(msg);
      throw new Error(msg);
    }
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName });
        setUser({ ...result.user, displayName });
      }
      return result.user;
    } catch (err) {
      const friendlyMessage = formatAuthError(err.code || err.message);
      setAuthError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  };

  const logout = async () => {
    setAuthError(null);
    if (!auth) {
      setUser(null);
      return;
    }
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error('[Sign Out Error]:', err);
      throw err;
    }
  };

  const clearError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        isConfigured: isFirebaseConfigured,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function formatAuthError(errorCode) {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'The email address is invalid.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    default:
      return typeof errorCode === 'string' && errorCode.startsWith('auth/')
        ? errorCode.replace('auth/', '').replace(/-/g, ' ')
        : errorCode;
  }
}
