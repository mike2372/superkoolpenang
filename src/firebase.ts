import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Detect if the configuration is still using placeholders or was custom-filled
export const isFirebaseConfigured =
  firebaseConfig &&
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "PLACEHOLDER_API_KEY" &&
  !firebaseConfig.apiKey.includes("PLACEHOLDER");

let app;
let db: returnTypeGetFirestore | null = null;
let auth: returnTypeGetAuth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

type returnTypeGetFirestore = ReturnType<typeof getFirestore>;
type returnTypeGetAuth = ReturnType<typeof getAuth>;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    console.info("⚡ SuperCool Penang: Connected to Firebase Cloud Services.");
  } catch (error) {
    console.error("⚠️ Firebase initialization failed, running in Local Mode:", error);
  }
} else {
  console.info("💡 SuperCool Penang: Using Sandbox Local Storage Mode (Firebase not yet provisioned).");
}

export { db, auth, googleProvider };
export { getFirestore, getAuth };
