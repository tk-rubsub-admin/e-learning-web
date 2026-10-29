import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import config from 'config';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDLqd_K8WiUVFWbtG68XL4AaNSVt_bgTzY',
  authDomain: 'carbonedge-project.firebaseapp.com',
  projectId: 'carbonedge-project',
  storageBucket: 'carbonedge-project.firebasestorage.app',
  messagingSenderId: '589365124114',
  appId: '1:589365124114:web:12783b15c7639256300ccb'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { messaging, getToken, onMessage };
