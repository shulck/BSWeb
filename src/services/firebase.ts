import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBidrftrFjbGJJhlKl21eqiu_gFhe_mEZA",
  authDomain: "bandsync-9dfd3.firebaseapp.com",
  databaseURL: "https://bandsync-9dfd3-default-rtdb.firebaseio.com",
  projectId: "bandsync-9dfd3",
  storageBucket: "bandsync-9dfd3.firebasestorage.app",
  messagingSenderId: "1080161308008",
  appId: "1:1080161308008:web:e14e23da36ea7717cc1add",
  measurementId: "G-ENHNTLVM9E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app;
