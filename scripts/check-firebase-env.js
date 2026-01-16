#!/usr/bin/env node

/**
 * Script para verificar que las variables de Firebase estén configuradas correctamente
 */

require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

console.log('\n🔍 Verificando configuración de Firebase...\n')

const checks = {
  '📦 Firebase Admin (Backend)': {
    'FIREBASE_PROJECT_ID': process.env.FIREBASE_PROJECT_ID,
    'FIREBASE_CLIENT_EMAIL': process.env.FIREBASE_CLIENT_EMAIL,
    'FIREBASE_PRIVATE_KEY': process.env.FIREBASE_PRIVATE_KEY ? '✅ Configurado' : '❌ No configurado'
  },
  '🌐 Firebase Client (Frontend)': {
    'NEXT_PUBLIC_FIREBASE_API_KEY': process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID': process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    'NEXT_PUBLIC_FIREBASE_APP_ID': process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    'NEXT_PUBLIC_FIREBASE_VAPID_KEY': process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ? '✅ Configurado' : '❌ No configurado'
  }
}

let allGood = true

for (const [section, vars] of Object.entries(checks)) {
  console.log(`${section}:`)
  for (const [key, value] of Object.entries(vars)) {
    const status = value ? '✅' : '❌'
    const displayValue = value && value !== '✅ Configurado' && value !== '❌ No configurado' 
      ? (value.length > 50 ? value.substring(0, 50) + '...' : value)
      : (value || '❌ No configurado')
    
    console.log(`  ${status} ${key}: ${displayValue}`)
    
    if (!value) allGood = false
  }
  console.log('')
}

if (allGood) {
  console.log('✅ ¡Todas las variables de Firebase están configuradas!\n')
  
  // Verificar que el private key tenga el formato correcto
  if (process.env.FIREBASE_PRIVATE_KEY) {
    const pk = process.env.FIREBASE_PRIVATE_KEY
    if (pk.includes('\\n')) {
      console.log('✅ El FIREBASE_PRIVATE_KEY tiene caracteres de escape \\n (correcto)\n')
    } else if (pk.includes('\n')) {
      console.log('⚠️  El FIREBASE_PRIVATE_KEY tiene saltos de línea reales')
      console.log('   Esto está bien, el código lo manejará correctamente.\n')
    } else {
      console.log('❌ El FIREBASE_PRIVATE_KEY no tiene saltos de línea')
      console.log('   Asegúrate de copiar la clave completa desde el JSON\n')
    }
  }
  
  process.exit(0)
} else {
  console.log('❌ Faltan variables de Firebase. Por favor configúralas en .env o .env.local\n')
  process.exit(1)
}
