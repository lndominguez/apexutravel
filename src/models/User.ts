import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// ====================================================================
// ENUMS Y TIPOS
// ====================================================================

export enum UserRole {
  SUPER_ADMIN = 'super_admin', // Acceso total al sistema
  ADMIN = 'admin',             // Acceso total
  MANAGER = 'manager',         // Ver reportes, gestionar ventas
  AGENT = 'agent',             // Solo sus propias ventas
  VIEWER = 'viewer'            // Solo lectura
}

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark'
}

export enum ColorScheme {
  BLUE = 'blue',
  RED = 'red',
  GREEN = 'green',
  PURPLE = 'purple'
}

export interface UserPreferences {
  theme: ThemeMode;
  colorScheme: ColorScheme;
  language?: string;
}

// ====================================================================
// INTERFACE
// ====================================================================

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  commissionRate: number; // Porcentaje (5 = 5%)
  preferences: UserPreferences;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: Date;
  invitedBy?: mongoose.Types.ObjectId; // Usuario que lo invitó
  invitationToken?: string; // Token de invitación
  invitationExpires?: Date; // Expiración del token
  department?: string; // Departamento o área
  position?: string; // Cargo o posición
  notes?: string; // Notas administrativas
  resetPasswordToken?: string; // Token para reset de password
  resetPasswordExpires?: Date; // Expiración del token de reset
  createdAt: Date;
  updatedAt: Date;

  // Métodos
  comparePassword(candidatePassword: string): Promise<boolean>;
  getFullName(): string;
  updatePreferences(preferences: Partial<UserPreferences>): Promise<IUser>;
}

// ====================================================================
// SCHEMA
// ====================================================================

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'El email es requerido'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email inválido']
    },
    password: {
      type: String,
      required: [true, 'La contraseña es requerida'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
      select: false // No devolver password por defecto en queries
    },
    firstName: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'El apellido es requerido'],
      trim: true
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.AGENT,
      required: true
    },
    phone: {
      type: String,
      trim: true
    },
    avatar: {
      type: String,
      default: null
    },
    commissionRate: {
      type: Number,
      default: 5, // 5% por defecto
      min: [0, 'La comisión no puede ser negativa'],
      max: [100, 'La comisión no puede ser mayor a 100%']
    },
    preferences: {
      theme: {
        type: String,
        enum: Object.values(ThemeMode),
        default: ThemeMode.LIGHT
      },
      colorScheme: {
        type: String,
        enum: Object.values(ColorScheme),
        default: ColorScheme.BLUE
      },
      language: {
        type: String,
        default: 'es'
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    lastLogin: {
      type: Date
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    invitationToken: {
      type: String,
      select: false
    },
    invitationExpires: {
      type: Date,
      select: false
    },
    department: {
      type: String,
      trim: true
    },
    position: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    },
    resetPasswordToken: {
      type: String,
      select: false
    },
    resetPasswordExpires: {
      type: Date,
      select: false
    }
  },
  {
    timestamps: true,
    toJSON: { 
      virtuals: true,
      transform: function(doc, ret: Record<string, unknown>) {
        delete ret.password; // Nunca devolver password en JSON
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

// ====================================================================
// ÍNDICES
// ====================================================================

// Nota: El índice de email ya se crea automáticamente por unique: true
UserSchema.index({ role: 1, isActive: 1 });

// ====================================================================
// HOOKS (Middleware)
// ====================================================================

// Encriptar password antes de guardar
UserSchema.pre('save', async function() {
  // Solo encriptar si el password fue modificado Y no está ya hasheado
  if (!this.isModified('password')) return;
  
  // Verificar si el password ya está hasheado (bcrypt hashes empiezan con $2b$)
  if (this.password.startsWith('$2b$')) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error: unknown) {
    throw error as Error;
  }
});

// ====================================================================
// MÉTODOS DE INSTANCIA
// ====================================================================

// Comparar password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch {
    return false;
  }
};

// Obtener nombre completo
UserSchema.methods.getFullName = function (): string {
  return `${this.firstName} ${this.lastName}`;
};

// Actualizar preferencias
UserSchema.methods.updatePreferences = async function (
  preferences: Partial<UserPreferences>
): Promise<IUser> {
  // Merge con las preferencias actuales
  this.preferences = {
    ...this.preferences,
    ...preferences
  };
  
  return await this.save();
};

// ====================================================================
// MÉTODOS ESTÁTICOS
// ====================================================================

// Buscar usuario activo por email
UserSchema.statics.findActiveByEmail = function (email: string) {
  return this.findOne({ email, isActive: true });
};

// Obtener todos los agentes activos
UserSchema.statics.getActiveAgents = function () {
  return this.find({ 
    role: UserRole.AGENT, 
    isActive: true 
  }).select('-password');
};

// ====================================================================
// EXPORTAR MODELO
// ====================================================================

export const User: Model<IUser> = 
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;