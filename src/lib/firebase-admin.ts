import * as admin from 'firebase-admin'

let firebaseAdmin: admin.app.App | null = null

export function getFirebaseAdmin() {
  if (firebaseAdmin) {
    return firebaseAdmin
  }

  try {
    // Verificar si ya existe una app inicializada
    const existingApps = admin.apps
    if (existingApps.length > 0) {
      firebaseAdmin = existingApps[0] as admin.app.App
      console.log('✅ Using existing Firebase Admin app')
      return firebaseAdmin
    }

    let privateKey = process.env.FIREBASE_PRIVATE_KEY
    
    if (!privateKey || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
      console.warn('⚠️ Firebase Admin credentials not configured. Push notifications will be disabled.')
      return null
    }

    // Manejar diferentes formatos del private key
    // Si tiene \\n (caracteres de escape), convertirlos a saltos de línea reales
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n')
    }
    
    // Verificar que tenga el formato correcto de PEM
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      console.error('❌ FIREBASE_PRIVATE_KEY no tiene el formato correcto. Debe incluir -----BEGIN PRIVATE KEY-----')
      return null
    }

    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey
      })
    })

    console.log('✅ Firebase Admin initialized successfully')
    return firebaseAdmin
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error)
    return null
  }
}

export function getMessaging() {
  const app = getFirebaseAdmin()
  if (!app) return null
  return admin.messaging(app)
}
