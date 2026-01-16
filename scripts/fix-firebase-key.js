#!/usr/bin/env node

/**
 * Script para generar el FIREBASE_PRIVATE_KEY en el formato correcto
 */

const fs = require('fs')
const path = require('path')

const jsonPath = process.argv[2] || path.join(__dirname, '../firebase-service-account.json')

if (!fs.existsSync(jsonPath)) {
  console.error('❌ Archivo JSON no encontrado:', jsonPath)
  console.log('\nUso: node scripts/fix-firebase-key.js /Users/leandro/Downloads/apexucode-firebase-adminsdk-fbsvc-ca14eb30f9.json')
  process.exit(1)
}

try {
  const serviceAccount = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  
  console.log('\n📝 Copia EXACTAMENTE esta línea a tu .env:\n')
  console.log('# ============================================')
  console.log('# IMPORTANTE: Copia TODO incluyendo las comillas')
  console.log('# ============================================\n')
  
  // El private_key del JSON ya tiene \n como caracteres de escape
  // Lo envolvemos en comillas dobles para que .env lo maneje correctamente
  const privateKeyForEnv = serviceAccount.private_key
  
  console.log(`FIREBASE_PRIVATE_KEY="${privateKeyForEnv}"`)
  
  console.log('\n✅ Instrucciones:')
  console.log('1. Abre tu archivo .env')
  console.log('2. Busca la línea que dice FIREBASE_PRIVATE_KEY=...')
  console.log('3. REEMPLÁZALA COMPLETAMENTE con la línea de arriba')
  console.log('4. Asegúrate de que esté en UNA SOLA LÍNEA')
  console.log('5. Guarda el archivo')
  console.log('6. Reinicia el servidor (npm run dev)\n')
  
  // Verificar que el key tenga el formato correcto
  if (privateKeyForEnv.includes('-----BEGIN PRIVATE KEY-----') && 
      privateKeyForEnv.includes('-----END PRIVATE KEY-----')) {
    console.log('✅ El private key tiene el formato PEM correcto\n')
  } else {
    console.log('⚠️  ADVERTENCIA: El private key no parece tener el formato PEM correcto\n')
  }
  
} catch (error) {
  console.error('❌ Error al leer el archivo JSON:', error.message)
  process.exit(1)
}
