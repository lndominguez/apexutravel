import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to } = body
    
    if (!to) {
      return NextResponse.json(
        { success: false, error: 'Email destinatario requerido' },
        { status: 400 }
      )
    }

    console.log('🧪 Iniciando prueba de email...')
    console.log('Destinatario:', to)
    
    const result = await sendEmail({
      to,
      subject: 'Email de Prueba - ApexuTravel',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
          </head>
          <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
              <h1 style="color: #0c3f5b;">✅ Email de Prueba</h1>
              <p>Este es un email de prueba desde ApexuTravel.</p>
              <p>Si estás viendo este mensaje, significa que la configuración de email está funcionando correctamente.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #666; font-size: 14px;">
                <strong>Configuración:</strong><br>
                Host: ${process.env.EMAIL_HOST}<br>
                Port: ${process.env.EMAIL_PORT}<br>
                User: ${process.env.EMAIL_USER}<br>
                From: ${process.env.EMAIL_FROM || process.env.EMAIL_USER}
              </p>
            </div>
          </body>
        </html>
      `
    })

    console.log('🧪 Resultado de prueba:', result)

    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? 'Email de prueba enviado exitosamente' 
        : 'Error al enviar email de prueba',
      details: result
    })
    
  } catch (error) {
    console.error('❌ Error en endpoint de prueba:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
