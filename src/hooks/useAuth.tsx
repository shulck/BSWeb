import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { UserModel, UserRole, ValidationService } from '../types/models';

interface AuthContextType {
  currentUser: UserModel | null;
  signup: (email: string, password: string, userData: Omit<UserModel, 'id' | 'email'>) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserModel | null>(null);
  const [loading, setLoading] = useState(true);

  const signup = async (email: string, password: string, userData: Omit<UserModel, 'id' | 'email'>) => {
    if (!ValidationService.validateEmail(email)) {
      throw new Error('Некорректный email');
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const newUserData: UserModel = {
      id: user.uid,
      email: user.email!,
      ...userData,
      isOnline: true,
      lastSeen: new Date()
    };

    await setDoc(doc(db, 'users', user.uid), {
      ...newUserData,
      lastSeen: new Date()
    });

    setCurrentUser(newUserData);
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    if (currentUser) {
      await setDoc(doc(db, 'users', currentUser.id), {
        ...currentUser,
        isOnline: false,
        lastSeen: new Date()
      }, { merge: true });
    }
    await signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserModel;
            setCurrentUser({
              ...userData,
              id: firebaseUser.uid,
              lastSeen: userData.lastSeen || new Date()
            });

            // Update online status
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              ...userData,
              isOnline: true,
              lastSeen: new Date()
            }, { merge: true });
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
