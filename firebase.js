import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD1kzRrpxzHkY65p8qfpD7KScJ-7EurF98",
  authDomain: "work-manual-9e4cd.firebaseapp.com",
  projectId: "work-manual-9e4cd",
  storageBucket: "work-manual-9e4cd.firebasestorage.app",
  messagingSenderId: "844623387068",
  appId: "1:844623387068:web:db37d7d247a7bef3dddb3b9",
  measurementId: "G-RCNSXDPR7G"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const manualCollection = collection(db, "work-manual");
const manualQuery = query(manualCollection, orderBy("updatedAt", "desc"));

export {
  db,
  manualCollection,
  manualQuery,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp
};
