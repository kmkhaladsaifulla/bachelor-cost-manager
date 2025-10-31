import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';



const firebaseConfig = {
  apiKey: "AIzaSyDCKrPR--uMu7mIDIDW35O21IFvSzQdiWg",
  authDomain: "bachelor-cost-manager.firebaseapp.com",
  projectId: "bachelor-cost-manager",
  storageBucket: "bachelor-cost-manager.firebasestorage.app",
  messagingSenderId: "61387391609",
  appId: "1:61387391609:web:55a322e004986fcc464aa8"
};



const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
