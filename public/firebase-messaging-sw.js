importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

const firebaseConfig = {
  apiKey: 'AIzaSyCs1WDkpHyHNW2DVhVDUdV6YW9OWNHNJ6k',
  authDomain: 'apexucode.firebaseapp.com',
  projectId: 'apexucode',
  storageBucket: 'apexucode.firebasestorage.app',
  messagingSenderId: '584550030112',
  appId: '1:584550030112:web:e2371c94c35c36100c9545'
}

firebase.initializeApp(firebaseConfig)

const messaging = firebase.messaging()

self.addEventListener('install', () => {
  // Asegura que el SW nuevo se active sin esperar
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Asegura que el SW controle las páginas abiertas
  event.waitUntil(self.clients.claim())
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload)

  const notificationTitle = payload.notification?.title || 'Nueva notificación'
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/logo/apex.png',
    badge: '/logo/apex.png',
    tag: payload.data?.notificationId || 'notification',
    data: {
      // FCM webpush link viene en fcmOptions.link; mantenemos compat con payload.data.clickAction
      url: payload?.fcmOptions?.link || payload.data?.clickAction || '/',
      ...payload.data
    },
    requireInteraction: payload.data?.priority === 'urgent',
    vibrate: [200, 100, 200]
  }

  if (payload.notification?.image) {
    notificationOptions.image = payload.notification.image
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event)

  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})
