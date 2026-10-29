importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDLqd_K8WiUVFWbtG68XL4AaNSVt_bgTzY',
  authDomain: 'carbonedge-project.firebaseapp.com',
  projectId: 'carbonedge-project',
  storageBucket: 'carbonedge-project.firebasestorage.app',
  messagingSenderId: '589365124114',
  appId: '1:589365124114:web:12783b15c7639256300ccb'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/logo192.png',
    data: payload.data
  });
});
