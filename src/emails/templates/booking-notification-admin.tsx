import * as React from 'react'

interface BookingNotificationAdminProps {
  bookingNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  itemName: string
  itemType: 'package' | 'hotel' | 'flight'
  totalPrice: number
  currency: string
  passengers: Array<{
    fullName: string
    type: string
    passport: string
  }>
  details?: {
    checkIn?: string
    checkOut?: string
    nights?: number
    destination?: string
    startDate?: string
    roomName?: string
    occupancy?: string
  }
  bookingId: string
}

export const BookingNotificationAdmin = ({
  bookingNumber,
  customerName,
  customerEmail,
  customerPhone,
  itemName,
  itemType,
  totalPrice,
  currency,
  passengers,
  details,
  bookingId
}: BookingNotificationAdminProps) => {
  const typeLabel = itemType === 'package' ? 'Paquete' : itemType === 'hotel' ? 'Hotel' : 'Vuelo'
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/bookings/${bookingId}`
  
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
                {/* Header con alerta */}
                <tr>
                  <td style={{ 
                    background: 'linear-gradient(135deg, #ec9c12 0%, #f1c203 100%)',
                    padding: '40px 30px',
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      fontSize: '48px',
                      marginBottom: '10px'
                    }}>
                      🔔
                    </div>
                    <h1 style={{ 
                      color: '#ffffff', 
                      margin: '0 0 10px 0',
                      fontSize: '28px',
                      fontWeight: 'bold'
                    }}>
                      Nueva Reserva Recibida
                    </h1>
                    <p style={{ 
                      color: '#ffffff', 
                      margin: 0,
                      fontSize: '16px',
                      opacity: 0.95
                    }}>
                      Requiere atención inmediata
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
                      margin: '0 0 30px 0'
                    }}>
                      Se ha recibido una nueva reserva en el sistema. Por favor, revisa los detalles y contacta 
                      al cliente en las próximas 24 horas para confirmar el pago y finalizar la reserva.
                    </p>
                    
                    {/* Número de reserva destacado */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ 
                      backgroundColor: '#fff3cd',
                      border: '2px solid #ec9c12',
                      borderRadius: '8px',
                      padding: '20px',
                      marginBottom: '30px'
                    }}>
                      <tr>
                        <td style={{ textAlign: 'center' }}>
                          <p style={{ 
                            fontSize: '14px', 
                            color: '#856404',
                            margin: '0 0 8px 0',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontWeight: '600'
                          }}>
                            Número de Reserva
                          </p>
                          <p style={{ 
                            fontSize: '24px', 
                            color: '#ec9c12',
                            margin: 0,
                            fontWeight: 'bold',
                            letterSpacing: '1px'
                          }}>
                            {bookingNumber}
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    {/* Información del cliente */}
                    <h2 style={{ 
                      fontSize: '20px', 
                      color: '#0c3f5b',
                      margin: '0 0 20px 0',
                      fontWeight: 'bold'
                    }}>
                      👤 Información del Cliente
                    </h2>
                    
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ 
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      padding: '20px',
                      marginBottom: '30px'
                    }}>
                      <tr>
                        <td style={{ 
                          padding: '8px 0',
                          fontSize: '14px',
                          color: '#666666'
                        }}>
                          Nombre:
                        </td>
                        <td style={{ 
                          padding: '8px 0',
                          fontSize: '14px',
                          color: '#333333',
                          fontWeight: '600',
                          textAlign: 'right'
                        }}>
                          {customerName}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ 
                          padding: '8px 0',
                          fontSize: '14px',
                          color: '#666666'
                        }}>
                          Email:
                        </td>
                        <td style={{ 
                          padding: '8px 0',
                          fontSize: '14px',
                          color: '#0c3f5b',
                          fontWeight: '600',
                          textAlign: 'right'
                        }}>
                          <a href={`mailto:${customerEmail}`} style={{ color: '#0c3f5b', textDecoration: 'none' }}>
                            {customerEmail}
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ 
                          padding: '8px 0',
                          fontSize: '14px',
                          color: '#666666'
                        }}>
                          Teléfono:
                        </td>
                        <td style={{ 
                          padding: '8px 0',
                          fontSize: '14px',
                          color: '#0c3f5b',
                          fontWeight: '600',
                          textAlign: 'right'
                        }}>
                          <a href={`tel:${customerPhone}`} style={{ color: '#0c3f5b', textDecoration: 'none' }}>
                            {customerPhone}
                          </a>
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
                      📋 Detalles de la Reserva
                    </h2>
                    
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '20px' }}>
                      <tr>
                        <td style={{ 
                          padding: '12px 0',
                          borderBottom: '1px solid #e5e7eb',
                          fontSize: '14px',
                          color: '#666666'
                        }}>
                          Tipo
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
                          Servicio
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
                      
                      {details?.roomName && (
                        <tr>
                          <td style={{ 
                            padding: '12px 0',
                            borderBottom: '1px solid #e5e7eb',
                            fontSize: '14px',
                            color: '#666666'
                          }}>
                            Habitación
                          </td>
                          <td style={{ 
                            padding: '12px 0',
                            borderBottom: '1px solid #e5e7eb',
                            fontSize: '14px',
                            color: '#333333',
                            fontWeight: '600',
                            textAlign: 'right'
                          }}>
                            {details.roomName} ({details.occupancy})
                          </td>
                        </tr>
                      )}
                      
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
                        </>
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
                          color: '#ec9c12',
                          fontWeight: 'bold'
                        }}>
                          Total a Cobrar
                        </td>
                        <td style={{ 
                          padding: '16px 0 0 0',
                          fontSize: '24px',
                          color: '#ec9c12',
                          fontWeight: 'bold',
                          textAlign: 'right'
                        }}>
                          ${totalPrice.toLocaleString()} {currency}
                        </td>
                      </tr>
                    </table>
                    
                    {/* Lista de pasajeros */}
                    <h3 style={{ 
                      fontSize: '16px', 
                      color: '#0c3f5b',
                      margin: '30px 0 15px 0',
                      fontWeight: 'bold'
                    }}>
                      Pasajeros:
                    </h3>
                    
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ 
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      padding: '15px',
                      marginBottom: '30px'
                    }}>
                      {passengers.map((passenger, idx) => (
                        <tr key={idx}>
                          <td style={{ 
                            padding: '8px 0',
                            fontSize: '14px',
                            color: '#333333'
                          }}>
                            {idx + 1}. {passenger.fullName}
                          </td>
                          <td style={{ 
                            padding: '8px 0',
                            fontSize: '12px',
                            color: '#666666',
                            textAlign: 'right'
                          }}>
                            {passenger.type === 'adult' ? 'Adulto' : passenger.type === 'child' ? 'Niño' : 'Infante'} | {passenger.passport}
                          </td>
                        </tr>
                      ))}
                    </table>
                    
                    {/* Botón de acción */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginTop: '30px' }}>
                      <tr>
                        <td align="center">
                          <a href={adminUrl} style={{
                            display: 'inline-block',
                            backgroundColor: '#0c3f5b',
                            color: '#ffffff',
                            padding: '16px 40px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            fontSize: '16px'
                          }}>
                            Ver Reserva en el Sistema
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    {/* Recordatorio */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ 
                      backgroundColor: '#fff3cd',
                      borderLeft: '4px solid #ec9c12',
                      borderRadius: '4px',
                      padding: '20px',
                      marginTop: '30px'
                    }}>
                      <tr>
                        <td>
                          <h3 style={{ 
                            fontSize: '16px', 
                            color: '#856404',
                            margin: '0 0 12px 0',
                            fontWeight: 'bold'
                          }}>
                            ⚠️ Acción Requerida
                          </h3>
                          <ul style={{ 
                            margin: 0,
                            padding: '0 0 0 20px',
                            fontSize: '14px',
                            color: '#856404',
                            lineHeight: '1.8'
                          }}>
                            <li>Contactar al cliente en las próximas 24 horas</li>
                            <li>Confirmar disponibilidad del servicio</li>
                            <li>Coordinar método y fecha de pago</li>
                            <li>Actualizar el estado de la reserva en el sistema</li>
                            <li>Enviar confirmación final al cliente</li>
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
                      fontSize: '12px', 
                      color: '#999999',
                      margin: 0
                    }}>
                      Este es un correo automático del sistema ApexuTravel
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
