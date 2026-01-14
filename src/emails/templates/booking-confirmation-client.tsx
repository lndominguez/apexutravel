import * as React from 'react'

interface BookingConfirmationClientProps {
  bookingNumber: string
  customerName: string
  itemName: string
  itemType: 'package' | 'hotel' | 'flight'
  totalPrice: number
  currency: string
  passengers: Array<{
    fullName: string
    type: string
  }>
  details?: {
    checkIn?: string
    checkOut?: string
    nights?: number
    destination?: string
    startDate?: string
  }
}

export const BookingConfirmationClient = ({
  bookingNumber,
  customerName,
  itemName,
  itemType,
  totalPrice,
  currency,
  passengers,
  details
}: BookingConfirmationClientProps) => {
  const typeLabel = itemType === 'package' ? 'Paquete' : itemType === 'hotel' ? 'Hotel' : 'Vuelo'
  
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style={{ 
        margin: 0, 
        padding: 0, 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        backgroundColor: '#f5f5f5'
      }}>
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#f5f5f5', padding: '40px 20px' }}>
          <tr>
            <td align="center">
              <table width="600" cellPadding="0" cellSpacing="0" style={{ 
                backgroundColor: '#ffffff', 
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}>
                {/* Header con gradiente */}
                <tr>
                  <td style={{ 
                    background: 'linear-gradient(135deg, #0c3f5b 0%, #0a5270 100%)',
                    padding: '40px 30px',
                    textAlign: 'center'
                  }}>
                    <h1 style={{ 
                      color: '#ffffff', 
                      margin: '0 0 10px 0',
                      fontSize: '28px',
                      fontWeight: 'bold'
                    }}>
                      ¡Reserva Confirmada!
                    </h1>
                    <p style={{ 
                      color: '#ffffff', 
                      margin: 0,
                      fontSize: '16px',
                      opacity: 0.9
                    }}>
                      Gracias por confiar en ApexuTravel
                    </p>
                  </td>
                </tr>
                
                {/* Contenido principal */}
                <tr>
                  <td style={{ padding: '40px 30px' }}>
                    <p style={{ 
                      fontSize: '16px', 
                      color: '#333333',
                      lineHeight: '1.6',
                      margin: '0 0 20px 0'
                    }}>
                      Hola <strong>{customerName}</strong>,
                    </p>
                    
                    <p style={{ 
                      fontSize: '16px', 
                      color: '#333333',
                      lineHeight: '1.6',
                      margin: '0 0 30px 0'
                    }}>
                      ¡Excelente noticia! Tu reserva ha sido recibida exitosamente. Nuestro equipo la está procesando 
                      y un agente se pondrá en contacto contigo en las próximas 24 horas para confirmar todos los detalles 
                      y coordinar el pago.
                    </p>
                    
                    {/* Número de reserva destacado */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ 
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      padding: '20px',
                      marginBottom: '30px'
                    }}>
                      <tr>
                        <td style={{ textAlign: 'center' }}>
                          <p style={{ 
                            fontSize: '14px', 
                            color: '#666666',
                            margin: '0 0 8px 0',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Número de Reserva
                          </p>
                          <p style={{ 
                            fontSize: '24px', 
                            color: '#0c3f5b',
                            margin: 0,
                            fontWeight: 'bold',
                            letterSpacing: '1px'
                          }}>
                            {bookingNumber}
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    {/* Detalles de la reserva */}
                    <h2 style={{ 
                      fontSize: '20px', 
                      color: '#0c3f5b',
                      margin: '0 0 20px 0',
                      fontWeight: 'bold'
                    }}>
                      Detalles de tu Reserva
                    </h2>
                    
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '20px' }}>
                      <tr>
                        <td style={{ 
                          padding: '12px 0',
                          borderBottom: '1px solid #e5e7eb',
                          fontSize: '14px',
                          color: '#666666'
                        }}>
                          Tipo de Servicio
                        </td>
                        <td style={{ 
                          padding: '12px 0',
                          borderBottom: '1px solid #e5e7eb',
                          fontSize: '14px',
                          color: '#333333',
                          fontWeight: '600',
                          textAlign: 'right'
                        }}>
                          {typeLabel}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ 
                          padding: '12px 0',
                          borderBottom: '1px solid #e5e7eb',
                          fontSize: '14px',
                          color: '#666666'
                        }}>
                          {typeLabel}
                        </td>
                        <td style={{ 
                          padding: '12px 0',
                          borderBottom: '1px solid #e5e7eb',
                          fontSize: '14px',
                          color: '#333333',
                          fontWeight: '600',
                          textAlign: 'right'
                        }}>
                          {itemName}
                        </td>
                      </tr>
                      
                      {details?.checkIn && (
                        <>
                          <tr>
                            <td style={{ 
                              padding: '12px 0',
                              borderBottom: '1px solid #e5e7eb',
                              fontSize: '14px',
                              color: '#666666'
                            }}>
                              Check-in
                            </td>
                            <td style={{ 
                              padding: '12px 0',
                              borderBottom: '1px solid #e5e7eb',
                              fontSize: '14px',
                              color: '#333333',
                              fontWeight: '600',
                              textAlign: 'right'
                            }}>
                              {details.checkIn}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ 
                              padding: '12px 0',
                              borderBottom: '1px solid #e5e7eb',
                              fontSize: '14px',
                              color: '#666666'
                            }}>
                              Check-out
                            </td>
                            <td style={{ 
                              padding: '12px 0',
                              borderBottom: '1px solid #e5e7eb',
                              fontSize: '14px',
                              color: '#333333',
                              fontWeight: '600',
                              textAlign: 'right'
                            }}>
                              {details.checkOut}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ 
                              padding: '12px 0',
                              borderBottom: '1px solid #e5e7eb',
                              fontSize: '14px',
                              color: '#666666'
                            }}>
                              Noches
                            </td>
                            <td style={{ 
                              padding: '12px 0',
                              borderBottom: '1px solid #e5e7eb',
                              fontSize: '14px',
                              color: '#333333',
                              fontWeight: '600',
                              textAlign: 'right'
                            }}>
                              {details.nights}
                            </td>
                          </tr>
                        </>
                      )}
                      
                      {details?.destination && (
                        <tr>
                          <td style={{ 
                            padding: '12px 0',
                            borderBottom: '1px solid #e5e7eb',
                            fontSize: '14px',
                            color: '#666666'
                          }}>
                            Destino
                          </td>
                          <td style={{ 
                            padding: '12px 0',
                            borderBottom: '1px solid #e5e7eb',
                            fontSize: '14px',
                            color: '#333333',
                            fontWeight: '600',
                            textAlign: 'right'
                          }}>
                            {details.destination}
                          </td>
                        </tr>
                      )}
                      
                      <tr>
                        <td style={{ 
                          padding: '12px 0',
                          borderBottom: '1px solid #e5e7eb',
                          fontSize: '14px',
                          color: '#666666'
                        }}>
                          Pasajeros
                        </td>
                        <td style={{ 
                          padding: '12px 0',
                          borderBottom: '1px solid #e5e7eb',
                          fontSize: '14px',
                          color: '#333333',
                          fontWeight: '600',
                          textAlign: 'right'
                        }}>
                          {passengers.length}
                        </td>
                      </tr>
                      
                      <tr>
                        <td style={{ 
                          padding: '16px 0 0 0',
                          fontSize: '16px',
                          color: '#0c3f5b',
                          fontWeight: 'bold'
                        }}>
                          Total
                        </td>
                        <td style={{ 
                          padding: '16px 0 0 0',
                          fontSize: '24px',
                          color: '#0c3f5b',
                          fontWeight: 'bold',
                          textAlign: 'right'
                        }}>
                          ${totalPrice.toLocaleString()} {currency}
                        </td>
                      </tr>
                    </table>
                    
                    {/* Próximos pasos */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ 
                      backgroundColor: '#ecf9ff',
                      borderLeft: '4px solid #0c3f5b',
                      borderRadius: '4px',
                      padding: '20px',
                      marginTop: '30px'
                    }}>
                      <tr>
                        <td>
                          <h3 style={{ 
                            fontSize: '16px', 
                            color: '#0c3f5b',
                            margin: '0 0 12px 0',
                            fontWeight: 'bold'
                          }}>
                            📋 Próximos Pasos
                          </h3>
                          <ul style={{ 
                            margin: 0,
                            padding: '0 0 0 20px',
                            fontSize: '14px',
                            color: '#333333',
                            lineHeight: '1.8'
                          }}>
                            <li>Recibirás un correo de confirmación con más detalles</li>
                            <li>Un agente te contactará en las próximas 24 horas</li>
                            <li>Coordinaremos el método de pago más conveniente para ti</li>
                            <li>Te enviaremos toda la documentación necesaria</li>
                          </ul>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                {/* Footer */}
                <tr>
                  <td style={{ 
                    backgroundColor: '#f8f9fa',
                    padding: '30px',
                    textAlign: 'center',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#666666',
                      margin: '0 0 10px 0'
                    }}>
                      ¿Tienes preguntas? Estamos aquí para ayudarte
                    </p>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#0c3f5b',
                      margin: '0 0 20px 0',
                      fontWeight: '600'
                    }}>
                      📧 info@apexutravel.com | 📱 +52 123 456 7890
                    </p>
                    <p style={{ 
                      fontSize: '12px', 
                      color: '#999999',
                      margin: 0
                    }}>
                      © 2026 ApexuTravel. Todos los derechos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  )
}
