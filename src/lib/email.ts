import { Resend } from 'resend'

// Inicializar Resend
const resend = new Resend(process.env.RESEND_API_KEY)

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
    // Verificar si el envío de emails está habilitado
    if (process.env.EMAIL_ENABLED !== 'true') {
      console.log('⚠️ Envío de emails deshabilitado (EMAIL_ENABLED=false)')
      return { success: false, error: 'Email sending is disabled' }
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY no configurada')
      return { success: false, error: 'RESEND_API_KEY not configured' }
    }

    console.log('📧 Iniciando envío de email con Resend...')
    console.log('Para:', options.to)
    console.log('Asunto:', options.subject)
    
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'APEXUCODE <sales@apexucode.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: process.env.EMAIL_REPLY_TO
    })

    if (result.error) {
      console.error('❌ Error de Resend:', result.error)
      return { success: false, error: result.error.message }
    }
    
    console.log('✅ Email enviado exitosamente con Resend!')
    console.log('Message ID:', result.data?.id)
    
    return { success: true, messageId: result.data?.id }
  } catch (error) {
    console.error('❌ Error enviando email:')
    console.error('Error completo:', error)
    if (error instanceof Error) {
      console.error('Mensaje:', error.message)
      console.error('Stack:', error.stack)
    }
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Template base para emails con branding de ApexuCode
const getEmailTemplate = (title: string, content: string, buttonText?: string, buttonUrl?: string) => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          background: linear-gradient(135deg, #0c3f5b 0%, #1a5a7a 100%);
          padding: 40px 20px;
        }
        .email-wrapper {
          max-width: 600px;
          margin: 0 auto;
        }
        .container {
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .header {
          background: linear-gradient(135deg, #0c3f5b 0%, #1a5a7a 100%);
          padding: 40px 30px;
          text-align: center;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #ffffff;
          margin-bottom: 8px;
          letter-spacing: 1px;
        }
        .logo-subtitle {
          color: #f1c203;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .content-wrapper {
          padding: 40px 30px;
        }
        .title {
          font-size: 28px;
          font-weight: bold;
          color: #0c3f5b;
          margin-bottom: 24px;
          text-align: center;
        }
        .content {
          font-size: 16px;
          color: #4b5563;
          margin-bottom: 30px;
          line-height: 1.8;
        }
        .content p {
          margin-bottom: 16px;
        }
        .content strong {
          color: #0c3f5b;
          font-weight: 600;
        }
        .button-wrapper {
          text-align: center;
          margin: 32px 0;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #0c3f5b 0%, #1a5a7a 100%);
          color: #ffffff;
          padding: 16px 40px;
          text-decoration: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 4px 12px rgba(12, 63, 91, 0.3);
          transition: all 0.3s ease;
        }
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(12, 63, 91, 0.4);
        }
        .warning {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-left: 4px solid #ec9c12;
          border-radius: 8px;
          padding: 20px;
          margin: 24px 0;
          font-size: 14px;
          color: #92400e;
        }
        .warning strong {
          color: #ec9c12;
          display: block;
          margin-bottom: 8px;
          font-size: 15px;
        }
        .info-box {
          background: #f8fafc;
          border-left: 4px solid #0c3f5b;
          border-radius: 8px;
          padding: 20px;
          margin: 24px 0;
          font-size: 14px;
          color: #4b5563;
        }
        .footer {
          background: #f8fafc;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 8px;
        }
        .footer-brand {
          color: #0c3f5b;
          font-weight: 600;
        }
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
          margin: 24px 0;
        }
        @media only screen and (max-width: 600px) {
          .content-wrapper {
            padding: 30px 20px;
          }
          .header {
            padding: 30px 20px;
          }
          .title {
            font-size: 24px;
          }
          .button {
            padding: 14px 32px;
            font-size: 15px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="container">
          <div class="header">
            <div class="logo">ApexuTravel</div>
            <div class="logo-subtitle">Tu Agencia de Viajes</div>
          </div>
          
          <div class="content-wrapper">
            <h1 class="title">${title}</h1>
            
            <div class="content">
              ${content}
            </div>
            
            ${buttonText && buttonUrl ? `
              <div class="button-wrapper">
                <a href="${buttonUrl}" class="button">${buttonText}</a>
              </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p><strong class="footer-brand">ApexuTravel</strong></p>
            <p>Este email fue enviado desde ApexuTravel</p>
            <p>Si no solicitaste esta acción, puedes ignorar este email.</p>
            <div class="divider"></div>
            <p style="font-size: 12px; color: #9ca3af;">© 2024 ApexuTravel. Todos los derechos reservados.</p>
          </div>
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
  token: string,
  expiresInDays: number = 1
) => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const invitationUrl = `${baseUrl}/auth/invitation?token=${token}`
  
  const roleLabels: Record<string, string> = {
    super_admin: 'Super Administrador',
    admin: 'Administrador',
    manager: 'Manager',
    agent: 'Agente',
    viewer: 'Solo Lectura'
  }

  const expirationText = expiresInDays === 1 ? '1 día' : `${expiresInDays} días`

  const content = `
    <p>¡Hola!</p>
    <p><strong>${inviterName}</strong> te ha invitado a unirte al equipo de <strong>ApexuTravel</strong>.</p>
    
    <div class="info-box">
      <p style="margin: 0;"><strong>Rol asignado:</strong> ${roleLabels[role] || role}</p>
    </div>
    
    <p>Para completar tu registro y crear tu cuenta, haz clic en el botón de abajo:</p>
    
    <div class="warning">
      <strong>⏰ Importante:</strong>
      <p style="margin: 8px 0 0 0;">Este enlace de invitación expirará en <strong>${expirationText}</strong>.</p>
    </div>
  `

  return await sendEmail({
    to: email,
    subject: 'Invitación para unirte a ApexuTravel',
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
    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>ApexuTravel</strong>.</p>
    <p>Si fuiste tú quien solicitó este cambio, haz clic en el botón de abajo para crear una nueva contraseña:</p>
    
    <div class="warning">
      <strong>🔒 Importante - Seguridad:</strong>
      <p style="margin: 8px 0 0 0;">Este enlace expirará en <strong>1 hora</strong> por tu seguridad.</p>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #6b7280;">
      <strong>Nota:</strong> Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña actual seguirá siendo válida y tu cuenta está segura.
    </p>
  `

  return await sendEmail({
    to: email,
    subject: 'Restablecer contraseña - ApexuTravel',
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
    <p>Tu contraseña en <strong>ApexuTravel</strong> ha sido cambiada exitosamente.</p>
    
    <div class="info-box">
      <p style="margin: 0;"><strong>📅 Fecha y hora del cambio:</strong></p>
      <p style="margin: 8px 0 0 0;">${new Date().toLocaleString('es-ES', { timeZone: 'America/Mexico_City', dateStyle: 'full', timeStyle: 'short' })}</p>
    </div>
    
    <p>Si reconoces este cambio, no necesitas hacer nada más. Tu cuenta está segura.</p>
    
    <div class="warning">
      <strong>⚠️ Atención:</strong>
      <p style="margin: 8px 0 0 0;">Si <strong>NO</strong> realizaste este cambio, contacta inmediatamente con el administrador del sistema. Tu cuenta podría estar comprometida.</p>
    </div>
  `

  return await sendEmail({
    to: email,
    subject: 'Contraseña actualizada - ApexuTravel',
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
