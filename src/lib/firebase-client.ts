import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, Messaging, isSupported } from 'firebase/messaging'

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

export async function getFCMToken(): Promise<string | null> {
  try {
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

    const token = await getToken(messaging, { vapidKey })
    console.log('✅ FCM token obtained:', token.substring(0, 20) + '...')
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
  getFirebaseMessaging().then(messaging => {
    if (!messaging) return

    onMessage(messaging, (payload) => {
      console.log('📬 Message received:', payload)
      callback(payload)
    })
  })
}
