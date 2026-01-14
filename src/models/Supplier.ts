import mongoose, { Schema, Document } from 'mongoose'

export interface ISupplier extends Document {
  // Información básica
  name: string
  logo?: string // URL del logo del proveedor
  legalName?: string // Opcional
  type: 'airline' | 'hotel_chain' | 'tour_operator' | 'transport_company' | 'activity_provider' | 'insurance_company' | 'other_agency'
  
  // Contacto
  email: string
  phone: string
  website?: string
  
  // Dirección (todo opcional)
  address?: {
    street?: string
    city?: string
    state?: string
    country?: string
    postalCode?: string
  }
  
  // Información legal y financiera (opcionales)
  taxId?: string // RFC, NIT, etc.
  bankAccount?: {
    bankName: string
    accountNumber: string
    swift?: string
    iban?: string
  }
  
  // Contactos del proveedor
  contacts: Array<{
    name: string
    position: string
    email: string
    phone: string
    isPrimary: boolean
  }>
  
  // Términos comerciales
  paymentTerms: {
    method: 'prepaid' | 'credit' | 'cash' | 'mixed'
    creditDays?: number // Días de crédito si aplica
    currency: string
  }
  
  // Comisiones y márgenes por defecto
  defaultCommission?: number // % de comisión que nos da
  defaultMarkup?: number // % de markup que aplicamos
  
  // Políticas
  cancellationPolicy?: string
  refundPolicy?: string
  
  // Calificación y notas
  rating?: number // 1-5
  notes?: string
  
  // Estado y metadata
  status: 'active' | 'inactive' | 'suspended' | 'pending_approval'
  isVerified: boolean
  
  // Documentos
  documents?: Array<{
    name: string
    type: string
    url: string
    uploadedAt: Date
  }>
  
  // Auditoría
  createdBy: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const SupplierSchema = new Schema<ISupplier>({
  name: { type: String, required: true, index: true },
  logo: String,
  legalName: String, // Ahora opcional
  type: {
    type: String,
    required: true,
    enum: ['airline', 'hotel_chain', 'tour_operator', 'transport_company', 'activity_provider', 'insurance_company', 'other_agency']
  },
  
  email: { type: String, required: true },
  phone: { type: String, required: true },
  website: String,
  
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  
  taxId: { type: String, sparse: true, unique: true }, // Ahora opcional con índice sparse
  bankAccount: {
    bankName: String,
    accountNumber: String,
    swift: String,
    iban: String
  },
  
  contacts: [{
    name: { type: String, required: true },
    position: String,
    email: { type: String, required: true },
    phone: { type: String, required: true },
    isPrimary: { type: Boolean, default: false }
  }],
  
  paymentTerms: {
    method: {
      type: String,
      required: true,
      enum: ['prepaid', 'credit', 'cash', 'mixed']
    },
    creditDays: Number,
    currency: { type: String, default: 'USD' }
  },
  
  defaultCommission: Number,
  defaultMarkup: Number,
  
  cancellationPolicy: String,
  refundPolicy: String,
  
  rating: { type: Number, min: 1, max: 5 },
  notes: String,
  
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'suspended', 'pending_approval'],
    default: 'pending_approval'
  },
  isVerified: { type: Boolean, default: false },
  
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
})

// Índices para búsquedas eficientes
SupplierSchema.index({ name: 'text', legalName: 'text' })
SupplierSchema.index({ type: 1, status: 1 })
SupplierSchema.index({ 'address.country': 1 })

export default mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema)
