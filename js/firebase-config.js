// Firebase Configuration
// Note: We're using the modular SDK v9+ but with compatibility mode for easier integration

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, set, get, onValue, update, remove, push, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyDrP54lIOANurjo5CpVA02uBRq_cSa-dqQ",
  authDomain: "couples-game-hub.firebaseapp.com",
  databaseURL: "https://couples-game-hub-default-rtdb.firebaseio.com",
  projectId: "couples-game-hub",
  storageBucket: "couples-game-hub.firebasestorage.app",
  messagingSenderId: "849639630320",
  appId: "1:849639630320:web:dc9fb6df39ff5b63882935"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Export database and functions
export {
  database,
  ref,
  set,
  get,
  onValue,
  update,
  remove,
  push,
  serverTimestamp
};
