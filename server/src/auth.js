import admin from 'firebase-admin';

/**
 * ============================================================================
 * AUTHENTICATION MODULE
 * ============================================================================
 * Pluggable Authentication Architecture:
 * - Current Provider: Firebase Authentication
 * - Any provider must implement:
 *     1. register({ email, password, name }) -> { user, token? }
 *     2. login({ email, password })          -> { user, token }
 *     3. logout(uid)                         -> { success: true }
 *     4. getUser(uid)                        -> { user }
 *     5. verifyToken(token)                  -> { uid, email, name, ... }
 *
 * To change the provider in the future (e.g. Supabase, Auth0, custom DB/JWT),
 * simply create a new provider object implementing these 5 methods and update
 * `currentAuthProvider`.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. Firebase Admin Initialization
// ----------------------------------------------------------------------------
function initFirebaseApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Option A: Service account JSON string or file path from environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      return admin.initializeApp({
        credential: admin.credential.cert(credentials),
      });
    } catch {
      return admin.initializeApp({
        credential: admin.credential.cert(process.env.FIREBASE_SERVICE_ACCOUNT),
      });
    }
  }

  // Option B: Project ID or Google Application Default Credentials
  return admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

// ----------------------------------------------------------------------------
// 2. Firebase Provider Implementation
// ----------------------------------------------------------------------------
const firebaseAuthProvider = {
  name: 'firebase',

  /**
   * Registers a new user.
   */
  async register({ email, password, name }) {
    if (!email || !password) {
      throw new Error('Email and password are required for registration.');
    }

    const app = initFirebaseApp();
    const userRecord = await app.auth().createUser({
      email,
      password,
      displayName: name || undefined,
    });

    // Optionally create a custom token so client can immediately authenticate
    const customToken = await app.auth().createCustomToken(userRecord.uid);

    return {
      user: {
        uid: userRecord.uid,
        email: userRecord.email || null,
        name: userRecord.displayName || null,
      },
      token: customToken,
    };
  },

  /**
   * Logs in a user using email and password.
   * Utilizes Firebase Auth REST API (standard approach on server-side).
   */
  async login({ email, password }) {
    if (!email || !password) {
      throw new Error('Email and password are required for login.');
    }

    const apiKey = process.env.FIREBASE_API_KEY;
    if (!apiKey) {
      throw new Error(
        'FIREBASE_API_KEY environment variable is required for server-side email/password login.'
      );
    }

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error?.message || 'Login failed';
      throw new Error(errorMsg);
    }

    return {
      token: data.idToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
      user: {
        uid: data.localId,
        email: data.email,
        name: data.displayName || null,
      },
    };
  },

  /**
   * Logs out a user by invalidating all active refresh tokens for the given UID.
   */
  async logout(uid) {
    if (!uid) {
      throw new Error('User ID (uid) is required for logout.');
    }

    const app = initFirebaseApp();
    await app.auth().revokeRefreshTokens(uid);

    return {
      success: true,
      message: 'Tokens revoked successfully.',
    };
  },

  /**
   * Retrieves user details by UID.
   */
  async getUser(uid) {
    if (!uid) {
      throw new Error('User ID (uid) is required.');
    }

    const app = initFirebaseApp();
    const userRecord = await app.auth().getUser(uid);

    return {
      uid: userRecord.uid,
      email: userRecord.email || null,
      name: userRecord.displayName || null,
      picture: userRecord.photoURL || null,
    };
  },

  /**
   * Verifies an ID token and returns standardized user profile.
   */
  async verifyToken(token) {
    const app = initFirebaseApp();
    const decodedToken = await app.auth().verifyIdToken(token);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      name: decodedToken.name || null,
      picture: decodedToken.picture || null,
      raw: decodedToken,
    };
  },
};

// ----------------------------------------------------------------------------
// 3. Active Provider Selection
// ----------------------------------------------------------------------------
// To change providers in the future, set this to your custom provider implementation
export const currentAuthProvider = firebaseAuthProvider;

// ----------------------------------------------------------------------------
// 4. Unified Auth Functions (Call these from your routes/controllers)
// ----------------------------------------------------------------------------
export async function register(userData) {
  return currentAuthProvider.register(userData);
}

export async function login(credentials) {
  return currentAuthProvider.login(credentials);
}

export async function logout(uid) {
  return currentAuthProvider.logout(uid);
}

export async function getUser(uid) {
  return currentAuthProvider.getUser(uid);
}

export async function verifyToken(token) {
  return currentAuthProvider.verifyToken(token);
}

// ----------------------------------------------------------------------------
// 5. Express Middlewares
// ----------------------------------------------------------------------------

/**
 * Middleware to require authentication on protected routes.
 * Populates `req.user` with the verified user profile.
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header. Expected format: Bearer <token>',
    });
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Bearer token not provided.',
    });
  }

  try {
    const user = await verifyToken(token);
    req.user = user;
    return next();
  } catch (error) {
    console.error(`[Auth] Token verification failed (${currentAuthProvider.name}):`, error.message);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired authentication token.',
    });
  }
}

/**
 * Optional authentication middleware.
 * Attaches `req.user` if valid token exists; otherwise allows request as guest.
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    req.user = await verifyToken(token);
  } catch {
    req.user = null;
  }

  return next();
}
