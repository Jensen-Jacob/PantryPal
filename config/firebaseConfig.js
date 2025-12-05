import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCEwBLvPKS1APcwRY90Y-8ClXzaUO_BBO4",
  authDomain: "pantrypal-2db8d.firebaseapp.com",
  projectId: "pantrypal-2db8d",
  storageBucket: "pantrypal-2db8d.firebasestorage.app",
  messagingSenderId: "148635990572",
  appId: "1:148635990572:web:24b193a9648f8877132f89"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };