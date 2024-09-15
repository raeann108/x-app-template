/// /Users/sanjana/Desktop/x-app-template/apps/frontend/src/firebase/firebaseConfig.ts

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDKUFEzppea-HS-wup6HYxYvU8n3v7neVM",
  authDomain: "b3trbites.firebaseapp.com",
  projectId: "b3trbites",
  storageBucket: "b3trbites.appspot.com",
  messagingSenderId: "726840523173",
  appId: "1:726840523173:web:dcf91169d512d7c776104c",
  measurementId: "G-RM8PHG5NQ6",
  //databaseURL: "https://b3trbites-default-rtdb.asia-southeast1.firebasedatabase.app/" // Replace with your actual database URL
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase Auth and Database instances
const auth = getAuth(app);
const database = getDatabase(app);

export { auth, database };

