import nodemailer from 'nodemailer'

// Configuración del transportador de email
const createTransporter = () => {
  // Verificar variables de entorno
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Variables de entorno EMAIL_USER y EMAIL_PASS son requeridas')
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true para 465, false para otros puertos
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

// Tipos para los emails
interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

// Función principal para enviar emails
export const sendEmail = async (options: EmailOptions) => {
  try {
    const transporter = createTransporter()
    
    const mailOptions = {
      from: `"${process.env.APP_NAME || 'CRM'}" <${process.env.EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Fallback text
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Email enviado exitosamente:', result.messageId)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('Error enviando email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Template base para emails
const getEmailTemplate = (title: string, content: string, buttonText?: string, buttonUrl?: string) => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #3b82f6;
          margin-bottom: 10px;
        }
        .title {
          font-size: 28px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 20px;
        }
        .content {
          font-size: 16px;
          color: #4b5563;
          margin-bottom: 30px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          margin: 20px 0;
          transition: transform 0.2s;
        }
        .button:hover {
          transform: translateY(-1px);
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
        }
        .warning {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 16px;
          margin: 20px 0;
          font-size: 14px;
          color: #92400e;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">${process.env.APP_NAME || 'CRM Agencia de Viajes'}</div>
        </div>
        
        <h1 class="title">${title}</h1>
        
        <div class="content">
          ${content}
        </div>
        
        ${buttonText && buttonUrl ? `
          <div style="text-align: center;">
            <a href="${buttonUrl}" class="button">${buttonText}</a>
          </div>
        ` : ''}
        
        <div class="footer">
          <p>Este email fue enviado desde ${process.env.APP_NAME || 'CRM Agencia de Viajes'}</p>
          <p>Si no solicitaste esta acción, puedes ignorar este email.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Email de invitación
export const sendInvitationEmail = async (
  email: string,
  inviterName: string,
  role: string,
  token: string
) => {
  const invitationUrl = `${process.env.NEXTAUTH_URL}/auth/invitation?token=${token}`
  
  const roleLabels: Record<string, string> = {
    super_admin: 'Super Administrador',
    admin: 'Administrador',
    manager: 'Manager',
    agent: 'Agente',
    viewer: 'Solo Lectura'
  }

  const content = `
    <p>¡Hola!</p>
    <p><strong>${inviterName}</strong> te ha invitado a unirte al equipo de ${process.env.APP_NAME || 'nuestra empresa'}.</p>
    <p><strong>Rol asignado:</strong> ${roleLabels[role] || role}</p>
    <p>Para completar tu registro y crear tu cuenta, haz clic en el botón de abajo:</p>
    
    <div class="warning">
      <strong>⏰ Importante:</strong> Este enlace de invitación expirará en 7 días.
    </div>
  `

  return await sendEmail({
    to: email,
    subject: `Invitación para unirte a ${process.env.APP_NAME || 'nuestro equipo'}`,
    html: getEmailTemplate(
      '🎉 ¡Has sido invitado!',
      content,
      'Completar Registro',
      invitationUrl
    )
  })
}

// Email de recuperación de contraseña
export const sendPasswordResetEmail = async (
  email: string,
  firstName: string,
  token: string
) => {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`
  
  const content = `
    <p>Hola <strong>${firstName}</strong>,</p>
    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
    <p>Si fuiste tú quien solicitó este cambio, haz clic en el botón de abajo para crear una nueva contraseña:</p>
    
    <div class="warning">
      <strong>🔒 Seguridad:</strong> Este enlace expirará en 1 hora por tu seguridad.
    </div>
    
    <p>Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña actual seguirá siendo válida.</p>
  `

  return await sendEmail({
    to: email,
    subject: 'Restablecer contraseña - ' + (process.env.APP_NAME || 'CRM'),
    html: getEmailTemplate(
      '🔑 Restablecer Contraseña',
      content,
      'Restablecer Contraseña',
      resetUrl
    )
  })
}

// Email de confirmación de cambio de contraseña
export const sendPasswordChangedEmail = async (
  email: string,
  firstName: string
) => {
  const content = `
    <p>Hola <strong>${firstName}</strong>,</p>
    <p>Tu contraseña ha sido cambiada exitosamente.</p>
    <p>Si no realizaste este cambio, contacta inmediatamente con el administrador del sistema.</p>
    <p><strong>Fecha y hora:</strong> ${new Date().toLocaleString('es-ES', { timeZone: 'America/Mexico_City' })}</p>
  `

  return await sendEmail({
    to: email,
    subject: 'Contraseña cambiada - ' + (process.env.APP_NAME || 'CRM'),
    html: getEmailTemplate(
      '✅ Contraseña Actualizada',
      content
    )
  })
}

// Email de confirmación de reserva para el cliente
export const sendBookingConfirmationClient = async (bookingData: {
  customerEmail: string
  customerName: string
  bookingNumber: string
  itemName: string
  itemType: 'package' | 'hotel' | 'flight'
  totalPrice: number
  currency: string
  passengers: Array<{ fullName: string; type: string }>
  details?: any
}) => {
  const { BookingConfirmationClient } = await import('@/emails/templates/booking-confirmation-client')
  const { renderToStaticMarkup } = await import('react-dom/server')
  const React = await import('react')
  
  const html = renderToStaticMarkup(
    React.createElement(BookingConfirmationClient, {
      bookingNumber: bookingData.bookingNumber,
      customerName: bookingData.customerName,
      itemName: bookingData.itemName,
      itemType: bookingData.itemType,
      totalPrice: bookingData.totalPrice,
      currency: bookingData.currency,
      passengers: bookingData.passengers,
      details: bookingData.details
    })
  )
  
  return await sendEmail({
    to: bookingData.customerEmail,
    subject: `Confirmación de Reserva ${bookingData.bookingNumber} - ApexuTravel`,
    html
  })
}

// Email de notificación de nueva reserva para el administrador
export const sendBookingNotificationAdmin = async (bookingData: {
  adminEmail: string
  customerName: string
  customerEmail: string
  customerPhone: string
  bookingNumber: string
  itemName: string
  itemType: 'package' | 'hotel' | 'flight'
  totalPrice: number
  currency: string
  passengers: Array<{ fullName: string; type: string; passport: string }>
  details?: any
  bookingId: string
}) => {
  const { BookingNotificationAdmin } = await import('@/emails/templates/booking-notification-admin')
  const { renderToStaticMarkup } = await import('react-dom/server')
  const React = await import('react')
  
  const html = renderToStaticMarkup(
    React.createElement(BookingNotificationAdmin, {
      bookingNumber: bookingData.bookingNumber,
      customerName: bookingData.customerName,
      customerEmail: bookingData.customerEmail,
      customerPhone: bookingData.customerPhone,
      itemName: bookingData.itemName,
      itemType: bookingData.itemType,
      totalPrice: bookingData.totalPrice,
      currency: bookingData.currency,
      passengers: bookingData.passengers,
      details: bookingData.details,
      bookingId: bookingData.bookingId
    })
  )
  
  return await sendEmail({
    to: bookingData.adminEmail,
    subject: `🔔 Nueva Reserva ${bookingData.bookingNumber} - Acción Requerida`,
    html
  })
}
