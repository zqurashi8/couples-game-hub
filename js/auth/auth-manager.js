/**
 * Authentication Manager - Couples Game Hub
 * Handles all Firebase Authentication operations
 */

import { database, ref, set, get, serverTimestamp, update } from '../firebase-config.js';

// Import Firebase Auth (v10 modular SDK)
import {
    getAuth,
    signInAnonymously as firebaseSignInAnonymously,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    updateProfile,
    linkWithCredential,
    EmailAuthProvider
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

class AuthManager {
    constructor() {
        this.auth = getAuth();
        this.currentUser = null;
        this.authListeners = [];
        this.unsubscribe = null;
    }

    /**
     * Initialize auth state listener
     * Automatically called when auth state changes
     */
    onAuthStateChanged(callback) {
        this.unsubscribe = firebaseOnAuthStateChanged(this.auth, async (user) => {
            this.currentUser = user;

            if (user) {
                console.log('Auth state changed: User signed in', {
                    uid: user.uid,
                    isAnonymous: user.isAnonymous,
                    displayName: user.displayName,
                    email: user.email
                });
            } else {
                console.log('Auth state changed: No user signed in');
            }

            callback(user);
        });

        return this.unsubscribe;
    }

    /**
     * Get current authenticated user
     */
    getCurrentUser() {
        return this.auth.currentUser || this.currentUser;
    }

    /**
     * Sign in anonymously (guest mode)
     * This happens automatically for new visitors
     */
    async signInAnonymously() {
        try {
            console.log('Signing in anonymously...');
            const userCredential = await firebaseSignInAnonymously(this.auth);
            const user = userCredential.user;

            console.log('Anonymous sign-in successful', user.uid);

            // Create anonymous user profile
            await this.createUserProfile(user, {
                accountType: 'anonymous',
                displayName: 'Guest Player'
            });

            return user;
        } catch (error) {
            console.error('Anonymous sign-in error:', error);
            throw new Error(`Failed to sign in as guest: ${error.message}`);
        }
    }

    /**
     * Sign up with email and password
     */
    async signUpWithEmail(email, password, displayName) {
        try {
            console.log('Creating account with email:', email);

            // Create user with email and password
            const userCredential = await createUserWithEmailAndPassword(
                this.auth,
                email,
                password
            );
            const user = userCredential.user;

            // Update display name
            await updateProfile(user, { displayName });

            console.log('Email signup successful', user.uid);

            // Create user profile in database
            await this.createUserProfile(user, {
                accountType: 'email',
                displayName: displayName,
                email: email
            });

            // Check if we need to migrate localStorage data
            await this.migrateLocalStorageData(user.uid);

            return user;
        } catch (error) {
            console.error('Email signup error:', error);

            // User-friendly error messages
            if (error.code === 'auth/email-already-in-use') {
                throw new Error('This email is already registered. Please sign in instead.');
            } else if (error.code === 'auth/weak-password') {
                throw new Error('Password is too weak. Please use at least 6 characters.');
            } else if (error.code === 'auth/invalid-email') {
                throw new Error('Invalid email address.');
            }

            throw new Error(`Failed to create account: ${error.message}`);
        }
    }

    /**
     * Sign in with email and password
     */
    async signInWithEmail(email, password) {
        try {
            console.log('Signing in with email:', email);

            const userCredential = await signInWithEmailAndPassword(
                this.auth,
                email,
                password
            );
            const user = userCredential.user;

            console.log('Email sign-in successful', user.uid);

            // Check if we need to migrate localStorage data
            await this.migrateLocalStorageData(user.uid);

            return user;
        } catch (error) {
            console.error('Email sign-in error:', error);

            // User-friendly error messages
            if (error.code === 'auth/user-not-found') {
                throw new Error('No account found with this email. Please sign up first.');
            } else if (error.code === 'auth/wrong-password') {
                throw new Error('Incorrect password. Please try again.');
            } else if (error.code === 'auth/invalid-email') {
                throw new Error('Invalid email address.');
            }

            throw new Error(`Failed to sign in: ${error.message}`);
        }
    }

    /**
     * Upgrade anonymous account to permanent email account
     * Preserves all anonymous user data
     */
    async upgradeAnonymousAccount(email, password) {
        try {
            const user = this.getCurrentUser();

            if (!user || !user.isAnonymous) {
                throw new Error('Not currently signed in as anonymous user');
            }

            console.log('Upgrading anonymous account to email:', email);

            // Create email credential
            const credential = EmailAuthProvider.credential(email, password);

            // Link anonymous account with email credential
            const userCredential = await linkWithCredential(user, credential);
            const upgradedUser = userCredential.user;

            console.log('Account upgrade successful', upgradedUser.uid);

            // Update user profile to reflect permanent account
            await update(ref(database, `users/${upgradedUser.uid}/profile`), {
                accountType: 'email',
                email: email,
                upgradedAt: serverTimestamp()
            });

            return upgradedUser;
        } catch (error) {
            console.error('Account upgrade error:', error);

            // User-friendly error messages
            if (error.code === 'auth/email-already-in-use') {
                throw new Error('This email is already registered. Please sign in with that account instead.');
            } else if (error.code === 'auth/weak-password') {
                throw new Error('Password is too weak. Please use at least 6 characters.');
            } else if (error.code === 'auth/invalid-email') {
                throw new Error('Invalid email address.');
            }

            throw new Error(`Failed to upgrade account: ${error.message}`);
        }
    }

    /**
     * Sign out current user
     */
    async signOut() {
        try {
            console.log('Signing out...');
            await firebaseSignOut(this.auth);
            this.currentUser = null;
            console.log('Sign out successful');
        } catch (error) {
            console.error('Sign out error:', error);
            throw new Error(`Failed to sign out: ${error.message}`);
        }
    }

    /**
     * Create user profile in Firebase database
     */
    async createUserProfile(user, additionalData = {}) {
        try {
            const userRef = ref(database, `users/${user.uid}`);

            // Check if profile already exists
            const snapshot = await get(userRef);
            if (snapshot.exists()) {
                console.log('User profile already exists');
                return;
            }

            console.log('Creating user profile...');

            const profileData = {
                profile: {
                    displayName: additionalData.displayName || user.displayName || 'Player',
                    email: additionalData.email || user.email || null,
                    photoURL: user.photoURL || null,
                    bio: '',
                    accountType: additionalData.accountType || (user.isAnonymous ? 'anonymous' : 'email'),
                    createdAt: serverTimestamp(),
                    lastActive: serverTimestamp()
                },
                stats: {
                    totalGames: 0,
                    totalWins: 0,
                    currentStreak: 0,
                    longestStreak: 0,
                    lastPlayedDate: null,
                    firstPlayDate: serverTimestamp()
                },
                gameStats: {},
                gameHistory: {}
            };

            await set(userRef, profileData);
            console.log('User profile created successfully');
        } catch (error) {
            console.error('Error creating user profile:', error);
            throw error;
        }
    }

    /**
     * Get user profile from Firebase
     */
    async getUserProfile(userId) {
        try {
            const userRef = ref(database, `users/${userId}`);
            const snapshot = await get(userRef);

            if (snapshot.exists()) {
                return snapshot.val();
            }

            return null;
        } catch (error) {
            console.error('Error getting user profile:', error);
            throw error;
        }
    }

    /**
     * Migrate localStorage data to Firebase user profile
     * This preserves game progress when users create accounts
     */
    async migrateLocalStorageData(userId) {
        try {
            const localData = localStorage.getItem('couplesGameHub');
            if (!localData) {
                console.log('No localStorage data to migrate');
                return null;
            }

            const parsed = JSON.parse(localData);

            // Check if already migrated
            if (parsed.migratedToUserId === userId) {
                console.log('LocalStorage data already migrated for this user');
                return null;
            }

            // Check if user has any existing data
            const existingProfile = await this.getUserProfile(userId);
            if (existingProfile && existingProfile.stats && existingProfile.stats.totalGames > 0) {
                console.log('User already has game data, skipping migration');
                return null;
            }

            console.log('Migrating localStorage data to user profile...');

            // Build migration data structure
            const migrationData = {
                profile: {
                    displayName: parsed.coupleName || existingProfile?.profile?.displayName || "Player"
                },
                stats: {
                    totalGames: parsed.totalGames || 0,
                    totalWins: parsed.totalWins || 0,
                    currentStreak: parsed.streak || 0,
                    longestStreak: parsed.streak || 0,
                    lastPlayedDate: parsed.lastPlayedDate || null,
                    firstPlayDate: parsed.firstPlayDate || serverTimestamp()
                },
                gameStats: {}
            };

            // Migrate individual game stats
            if (parsed.gamesPlayed) {
                for (const [gameName, stats] of Object.entries(parsed.gamesPlayed)) {
                    migrationData.gameStats[gameName] = {
                        played: stats.count || 0,
                        won: stats.wins || 0,
                        bestScore: stats.bestScore || 0
                    };
                }
            }

            // Update Firebase with merged data
            const userRef = ref(database, `users/${userId}`);
            await update(userRef, migrationData);

            // Mark as migrated in localStorage (keep backup for 30 days)
            parsed.migratedToUserId = userId;
            parsed.migrationDate = new Date().toISOString();
            localStorage.setItem('couplesGameHub', JSON.stringify(parsed));

            console.log('Migration successful!', migrationData);
            return migrationData;
        } catch (error) {
            console.error('Migration error:', error);
            // Don't throw error - migration is not critical
            return null;
        }
    }

    /**
     * Check if localStorage data needs migration
     */
    checkIfMigrationNeeded() {
        try {
            const localData = localStorage.getItem('couplesGameHub');
            if (!localData) return false;

            const parsed = JSON.parse(localData);
            const user = this.getCurrentUser();

            // Migration needed if:
            // 1. User is authenticated
            // 2. LocalStorage has data
            // 3. Data hasn't been migrated for this user
            return user && !parsed.migratedToUserId && (parsed.totalGames > 0 || parsed.coupleName);
        } catch (error) {
            console.error('Error checking migration:', error);
            return false;
        }
    }

    /**
     * Clean up auth listeners
     */
    cleanup() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}

// Export singleton instance
const authManager = new AuthManager();
export default authManager;
