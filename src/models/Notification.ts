import mongoose, { Schema, Document, Model } from 'mongoose';

// ====================================================================
// ENUMS Y TIPOS
// ====================================================================

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  BOOKING = 'booking',
  PAYMENT = 'payment',
  SYSTEM = 'system'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationCategory {
  BOOKINGS = 'bookings',
  PAYMENTS = 'payments',
  INVOICES = 'invoices',
  ADMINISTRATION = 'administration',
  INVENTORY = 'inventory',
  OFFERS = 'offers',
  USERS = 'users',
  SYSTEM = 'system'
}

export interface NotificationAction {
  label: string;
  url: string;
  type?: 'primary' | 'secondary';
}

// ====================================================================
// INTERFACE
// ====================================================================

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // Usuario destinatario
  type: NotificationType;
  priority: NotificationPriority;
  category?: NotificationCategory; // Categoría/área de la notificación
  title: string;
  message: string;
  icon?: string; // Nombre del icono de Lucide
  imageUrl?: string; // URL de imagen opcional
  action?: NotificationAction; // Acción opcional (botón)
  metadata?: Record<string, unknown>; // Datos adicionales (bookingId, offerId, etc.)
  targetRoles?: string[]; // Roles que pueden ver esta notificación (opcional, si no se especifica todos la ven)
  isRead: boolean;
  readAt?: Date;
  dismissedAt?: Date;
  isPinned: boolean; // Para notificaciones importantes
  expiresAt?: Date; // Fecha de expiración opcional
  sentVia: {
    inApp: boolean;
    push: boolean;
    email: boolean;
  };
  pushSentAt?: Date;
  emailSentAt?: Date;
  createdBy?: mongoose.Types.ObjectId; // Usuario que creó la notificación (para notificaciones manuales)
  createdAt: Date;
  updatedAt: Date;

  // Métodos
  markAsRead(): Promise<INotification>;
  togglePin(): Promise<INotification>;
  isExpired(): boolean;
}

// ====================================================================
// SCHEMA
// ====================================================================

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario destinatario es requerido'],
      index: true
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      default: NotificationType.INFO,
      required: true
    },
    priority: {
      type: String,
      enum: Object.values(NotificationPriority),
      default: NotificationPriority.MEDIUM,
      required: true
    },
    category: {
      type: String,
      enum: Object.values(NotificationCategory),
      index: true
    },
    title: {
      type: String,
      required: [true, 'El título es requerido'],
      trim: true,
      maxlength: [100, 'El título no puede exceder 100 caracteres']
    },
    message: {
      type: String,
      required: [true, 'El mensaje es requerido'],
      trim: true,
      maxlength: [500, 'El mensaje no puede exceder 500 caracteres']
    },
    icon: {
      type: String,
      trim: true
    },
    imageUrl: {
      type: String,
      trim: true
    },
    action: {
      label: {
        type: String,
        trim: true
      },
      url: {
        type: String,
        trim: true
      },
      type: {
        type: String,
        enum: ['primary', 'secondary'],
        default: 'primary'
      }
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    targetRoles: {
      type: [String],
      default: undefined,
      index: true
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date
    },
    dismissedAt: {
      type: Date,
      index: true
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true
    },
    expiresAt: {
      type: Date
    },
    sentVia: {
      inApp: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: false
      },
      email: {
        type: Boolean,
        default: false
      }
    },
    pushSentAt: {
      type: Date
    },
    emailSentAt: {
      type: Date
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ====================================================================
// ÍNDICES
// ====================================================================

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isPinned: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, dismissedAt: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { sparse: true });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto-eliminar después de 30 días

// ====================================================================
// MÉTODOS DE INSTANCIA
// ====================================================================

NotificationSchema.methods.markAsRead = async function () {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return await this.save();
  }
  return this;
};

NotificationSchema.methods.togglePin = async function () {
  this.isPinned = !this.isPinned;
  return await this.save();
};

NotificationSchema.methods.isExpired = function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// ====================================================================
// EXPORTAR MODELO
// ====================================================================

const NotificationModel = 
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export { NotificationModel as Notification };
export default NotificationModel;
