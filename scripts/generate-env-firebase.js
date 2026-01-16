#!/usr/bin/env node

/**
 * Script para generar las variables de Firebase en el formato correcto para .env
 * Uso: node scripts/generate-env-firebase.js path/to/firebase-service-account.json
 */

const fs = require('fs')
const path = require('path')

const jsonPath = process.argv[2] || path.join(__dirname, '../firebase-service-account.json')

if (!fs.existsSync(jsonPath)) {
  console.error('❌ Archivo JSON no encontrado:', jsonPath)
  console.log('\nUso: node scripts/generate-env-firebase.js path/to/firebase-service-account.json')
  process.exit(1)
}

try {
  const serviceAccount = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  
  console.log('\n📝 Variables de Firebase para tu archivo .env:\n')
  console.log('# ============================================')
  console.log('# Firebase Admin SDK (Backend)')
  console.log('# ============================================')
  console.log(`FIREBASE_PROJECT_ID=${serviceAccount.project_id}`)
  console.log(`FIREBASE_CLIENT_EMAIL=${serviceAccount.client_email}`)
  
  // El private_key ya viene con \n del JSON, así que lo usamos tal cual
  // Pero lo envolvemos en comillas dobles para que .env lo maneje correctamente
  console.log(`FIREBASE_PRIVATE_KEY="${serviceAccount.private_key}"`)
  
  console.log('\n✅ Copia estas líneas a tu archivo .env')
  console.log('\n⚠️  IMPORTANTE: El FIREBASE_PRIVATE_KEY debe estar entre comillas dobles')
  console.log('   y mantener los \\n tal como aparecen arriba.\n')
  
} catch (error) {
  console.error('❌ Error al leer el archivo JSON:', error.message)
  process.exit(1)
}
