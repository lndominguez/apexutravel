// Script para crear un usuario administrador de prueba
require('dotenv').config({ path: '.env.local' })
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// Esquema simplificado del usuario
const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['super_admin', 'admin', 'manager', 'agent', 'viewer'],
    default: 'admin'
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
})

// Método para comparar passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Hash password antes de guardar
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return
  
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
})

const User = mongoose.models.User || mongoose.model('User', UserSchema)

async function createAdminUser() {
  try {
    // Conectar a MongoDB usando la misma configuración que la app
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI no está definida en .env.local')
    }
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Conectado a MongoDB')

    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ email: 'admin@test.com' })
    
    if (existingAdmin) {
      console.log('ℹ️ Usuario admin ya existe')
      console.log('📧 Email: admin@test.com')
      console.log('🔑 Password: admin123')
      return
    }

    // Crear usuario admin
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: 'admin123', // Se hasheará automáticamente
      role: 'super_admin',
      isActive: true
    })

    await adminUser.save()
    
    console.log('🎉 Usuario administrador creado exitosamente!')
    console.log('📧 Email: admin@test.com')
    console.log('🔑 Password: admin123')
    console.log('👤 Rol: super_admin')
    
  } catch (error) {
    console.error('❌ Error creando usuario admin:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Desconectado de MongoDB')
  }
}

createAdminUser()
