import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, deleteToken, Messaging, isSupported } from 'firebase/messaging'

let firebaseApp: FirebaseApp | null = null
let messaging: Messaging | null = null

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null

  if (!firebaseApp) {
    const apps = getApps()
    if (apps.length > 0) {
      firebaseApp = apps[0]
    } else {
      try {
        firebaseApp = initializeApp(firebaseConfig)
        console.log('✅ Firebase Client initialized')
      } catch (error) {
        console.error('❌ Error initializing Firebase Client:', error)
        return null
      }
    }
  }

  return firebaseApp
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null

  if (!messaging) {
    const app = getFirebaseApp()
    if (!app) return null

    try {
      const supported = await isSupported()
      if (!supported) {
        console.warn('⚠️ Firebase Messaging is not supported in this browser')
        return null
      }

      messaging = getMessaging(app)
      console.log('✅ Firebase Messaging initialized')
    } catch (error) {
      console.error('❌ Error initializing Firebase Messaging:', error)
      return null
    }
  }

  return messaging
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission
  }

  return Notification.permission
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('⚠️ Service Workers not supported')
    return null
  }

  try {
    // Reusar el SW existente que controla esta página si existe
    const existing = await navigator.serviceWorker.getRegistration()
    if (existing?.active?.scriptURL?.includes('/firebase-messaging-sw.js')) {
      console.log('✅ Service Worker already registered:', existing.scope)
      
      // Verificar si está controlando la página
      if (!navigator.serviceWorker.controller) {
        console.log('⏳ Esperando a que el SW tome control...')
        await new Promise<void>((resolve) => {
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('✅ Service Worker ahora controla la página')
            resolve()
          }, { once: true })
          
          // Timeout de seguridad
          setTimeout(() => resolve(), 2000)
        })
      }
      
      return existing
    }

    // Importante: usar scope '/' para que controle TODA la app (incluye /admin, /dashboard, etc.)
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    })
    
    console.log('✅ Service Worker registered:', registration.scope)
    
    // Esperar a que el service worker esté activo
    if (registration.installing) {
      console.log('⏳ Service Worker installing...')
      await new Promise<void>((resolve) => {
        registration.installing!.addEventListener('statechange', (e) => {
          if ((e.target as ServiceWorker).state === 'activated') {
            console.log('✅ Service Worker activated')
            resolve()
          }
        })
      })
    } else if (registration.waiting) {
      console.log('⏳ Service Worker waiting...')
      // Forzar activación del SW en espera
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    } else if (registration.active) {
      console.log('✅ Service Worker already active')
    }
    
    // Esperar a que el SW tome control de la página
    if (!navigator.serviceWorker.controller) {
      console.log('⏳ Esperando a que el SW tome control de la página...')
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('✅ Service Worker ahora controla la página')
          resolve()
        }, { once: true })
        
        // Timeout de seguridad de 3 segundos
        setTimeout(() => {
          console.log('⚠️ Timeout esperando control del SW')
          resolve()
        }, 3000)
      })
    }
    
    return registration
  } catch (error) {
    console.error('❌ Error registering Service Worker:', error)
    return null
  }
}

export async function deleteFCMToken(): Promise<boolean> {
  try {
    const m = await getFirebaseMessaging()
    if (!m) return false
    const success = await deleteToken(m)
    if (success) {
      console.log('✅ FCM token deleted from client')
    } else {
      console.warn('⚠️ FCM token delete returned false')
    }
    return success
  } catch (error) {
    console.error('❌ Error deleting FCM token:', error)
    return false
  }
}

export async function getFCMToken(): Promise<string | null> {
  try {
    // Primero registrar el service worker
    const registration = await registerServiceWorker()
    if (!registration) {
      console.error('❌ Service Worker registration failed')
      return null
    }

    const permission = await requestNotificationPermission()
    
    if (permission !== 'granted') {
      console.log('ℹ️ Notification permission not granted')
      return null
    }

    const messaging = await getFirebaseMessaging()
    if (!messaging) return null

    let vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    if (!vapidKey) {
      console.error('❌ VAPID key not configured')
      return null
    }

    // Limpiar el VAPID key de espacios y saltos de línea
    vapidKey = vapidKey.trim().replace(/\s+/g, '')

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration
    })
    console.log('✅ FCM token obtained:', token.substring(0, 20) + '...')

    try {
      window.localStorage.setItem('fcmToken', token)
    } catch {}

    return token

  } catch (error) {
    console.error('❌ Error getting FCM token:', error)
    return null
  }
}

export async function registerFCMToken(token: string): Promise<boolean> {
  try {
    const response = await fetch('/api/fcm/register-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })

    const data = await response.json()
    
    if (data.success) {
      console.log('✅ FCM token registered on server')
      return true
    } else {
      console.error('❌ Failed to register FCM token:', data.error)
      return false
    }
  } catch (error) {
    console.error('❌ Error registering FCM token:', error)
    return false
  }
}

export async function unregisterFCMToken(token: string): Promise<boolean> {
  try {
    const response = await fetch('/api/fcm/register-token', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })

    const data = await response.json()
    
    if (data.success) {
      console.log('✅ FCM token unregistered from server')

      try {
        const stored = window.localStorage.getItem('fcmToken')
        if (stored === token) {
          window.localStorage.removeItem('fcmToken')
        }
      } catch {}

      return true
    } else {
      console.error('❌ Failed to unregister FCM token:', data.error)
      return false
    }
  } catch (error) {
    console.error('❌ Error unregistering FCM token:', error)
    return false
  }
}

export function onMessageListener(callback: (payload: any) => void) {
  let unsubscribe: (() => void) | null = null

  getFirebaseMessaging().then(messaging => {
    if (!messaging) return

    unsubscribe = onMessage(messaging, (payload) => {
      console.log('📬 Message received:', payload)
      callback(payload)
    })
  })

  return () => {
    if (unsubscribe) unsubscribe()
  }
}
