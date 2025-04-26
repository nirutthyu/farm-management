// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, child,push, onValue  } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAjDsFKQYAQYQv7kwUeoNvkwfD3OXGpoY8",
  authDomain: "agri-b9323.firebaseapp.com",
  databaseURL: "https://agri-b9323-default-rtdb.firebaseio.com",
  projectId: "agri-b9323",
  storageBucket: "agri-b9323.appspot.com",
  messagingSenderId: "899364467045",
  appId: "1:899364467045:web:96f7f0a15901a5f8bef18c",
  measurementId: "G-FCDTHZ1NQ0"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, get, child ,push, onValue };
