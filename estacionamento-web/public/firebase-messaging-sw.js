importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Using the same config as in src/lib/firebase.ts, but hardcoded here since SW doesn't access .env easily
// Ideally we would inject this during build, but for simplicity we'll hardcode or valid values
// For security in public repos this is bad, but for this private setup it's acceptable/standard for SW
// However, since we can't easily read process.env here without Webpack magic in Next.js public folder:

// Parse Query params or use default if we could pass them, but SW installation is static usually.
// We will fetch the config from an endpoint or just hardcode it for the SW.
// Given the user provided the config publicly in the chat, I will put it here.

const firebaseConfig = {
    apiKey: "AIzaSyBewo_zx9SYC1oIR9-rvQXVYpJ06v5oft4",
    authDomain: "portaria-web-notify.firebaseapp.com",
    projectId: "portaria-web-notify",
    storageBucket: "portaria-web-notify.firebasestorage.app",
    messagingSenderId: "669918996873",
    appId: "1:669918996873:web:1bf1add336a97148219958"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/vercel.svg', // Ensure this icon exists or use a default
        // customize further
        tag: 'portaria-notification'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
    console.log('[firebase-messaging-sw.js] Notification click received.');
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
            // Check if there is already a window/tab open with the target URL
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                // Adjust the URL to match your app's structure
                if (client.url.indexOf('/morador') !== -1 && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no window/tab is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow('/morador/dashboard');
            }
        })
    );
});
