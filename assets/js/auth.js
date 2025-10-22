// auth.js - Simple Google Authentication System
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "../config/config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Google Auth Provider
const provider = new GoogleAuthProvider();
provider.addScope('email');
provider.addScope('profile');

class SimpleAuth {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        
        // Listen for auth state changes
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.currentUser = await this.createOrUpdateUser(user);
                this.isAuthenticated = true;
                console.log('User logged in:', this.currentUser);
            } else {
                this.currentUser = null;
                this.isAuthenticated = false;
                console.log('User logged out');
            }
        });
    }

    // Google Sign In
    async signInWithGoogle() {
        try {
            console.log('Starting Google Sign In...');
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            console.log('Google Sign In successful:', user);
            return { success: true, user: user };
            
        } catch (error) {
            console.error('Google Sign In error:', error);
            
            // Handle specific errors
            if (error.code === 'auth/popup-blocked') {
                throw new Error('Popup diblokir oleh browser. Silakan izinkan popup untuk situs ini.');
            } else if (error.code === 'auth/popup-closed-by-user') {
                throw new Error('Login dibatalkan oleh pengguna.');
            } else if (error.code === 'auth/operation-not-allowed') {
                throw new Error('Google Sign-in tidak diaktifkan. Hubungi administrator.');
            } else if (error.code === 'auth/unauthorized-domain') {
                throw new Error('Domain tidak diizinkan. Hubungi administrator.');
            } else {
                throw new Error(`Login gagal: ${error.message}`);
            }
        }
    }

    // Sign Out
    async signOut() {
        try {
            await signOut(auth);
            console.log('User signed out successfully');
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            throw new Error('Gagal logout');
        }
    }

    // Create or update user in Firestore
    async createOrUpdateUser(user) {
        try {
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);
            
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                lastLogin: serverTimestamp(),
                role: 'user' // Default role
            };

            if (!userDoc.exists()) {
                // New user - create document
                await setDoc(userRef, {
                    ...userData,
                    createdAt: serverTimestamp(),
                    stats: {
                        forumPosts: 0,
                        quizCompleted: 0,
                        activeDays: 1
                    }
                });
                console.log('New user created:', userData);
            } else {
                // Existing user - update last login
                await setDoc(userRef, {
                    ...userData,
                    stats: userDoc.data().stats || {
                        forumPosts: 0,
                        quizCompleted: 0,
                        activeDays: 1
                    }
                }, { merge: true });
                console.log('Existing user updated:', userData);
            }

            return userData;
            
        } catch (error) {
            console.error('Error creating/updating user:', error);
            // Return basic user data even if Firestore fails
            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                role: 'user'
            };
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    // Wait for auth initialization
    waitForAuth() {
        return new Promise((resolve) => {
            if (auth.currentUser !== null) {
                resolve(auth.currentUser);
            } else {
                const unsubscribe = onAuthStateChanged(auth, (user) => {
                    unsubscribe();
                    resolve(user);
                });
            }
        });
    }
}

// Create global auth instance
const authInstance = new SimpleAuth();

// Export for use in other files
export { authInstance, auth, db };
export default authInstance;
