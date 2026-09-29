import { initializeApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyCTJXrxGG6YwTdYz4eN-MSGJOFa0I1Za0w',
  authDomain: 'concursos-elite.firebaseapp.com',
  databaseURL: 'https://concursos-elite-default-rtdb.firebaseio.com',
  projectId: 'concursos-elite',
  storageBucket: 'concursos-elite.firebasestorage.app',
  messagingSenderId: '120890428956',
  appId: '1:120890428956:web:f5a1d4da309bd36ef199d9',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const authReady = setPersistence(auth, browserLocalPersistence);
