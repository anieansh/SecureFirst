import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, Auth } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCYLhQ8E8Ij1Hgz-KNkToYOwHooneM9rE0",
  authDomain: "first-4b330.firebaseapp.com",
  projectId: "first-4b330",
  storageBucket: "first-4b330.firebasestorage.app",
  messagingSenderId: "73782412414",
  appId: "1:73782412414:android:8edd2195f308b50f02c42f"
};

// Initialize Modular SDK
if (!getApps().length) {
  initializeApp(firebaseConfig);
}
const app = getApp();

// Initialize Auth with persistence
const auth: Auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Initialize Compat SDK
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Debug log to verify key presence in the instance
console.log("Firebase App initialized with API Key:", app.options.apiKey ? "PRESENT" : "MISSING");

export { app, auth, firebase, firebaseConfig };
