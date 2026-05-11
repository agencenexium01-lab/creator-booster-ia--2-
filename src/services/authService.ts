
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from '../types';

const googleProvider = new GoogleAuthProvider();

export const authService = {
  loginWithGoogle: async (): Promise<UserProfile> => {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;
    
    const userDoc = await getDoc(doc(db, 'profiles', firebaseUser.uid));
    
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    } else {
      const newUser: UserProfile = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'Créateur',
        email: firebaseUser.email || '',
        platform: 'both',
        onboarding_completed: false,
        created_at: new Date().toISOString(),
      };
      await setDoc(doc(db, 'profiles', firebaseUser.uid), newUser);
      return newUser;
    }
  },
  
  logout: async () => {
    await signOut(auth);
  },
  
  updateProfile: async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    if (!auth.currentUser) throw new Error("Non authentifié");
    const userRef = doc(db, 'profiles', auth.currentUser.uid);
    await updateDoc(userRef, updates);
    const updatedDoc = await getDoc(userRef);
    return updatedDoc.data() as UserProfile;
  },

  onAuthChange: (callback: (user: UserProfile | null) => void) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'profiles', firebaseUser.uid));
        if (userDoc.exists()) {
          callback(userDoc.data() as UserProfile);
        } else {
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }
};
