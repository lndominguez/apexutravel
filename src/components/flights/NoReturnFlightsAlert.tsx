'use client'

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Chip } from '@heroui/react'
import { AlertCircle, Calendar, Plane, X } from 'lucide-react'

interface AlternativeDate {
  date: string
  offset: number
  flightCount: number
}

interface NoReturnFlightsAlertProps {
  isOpen: boolean
  onClose: () => void
  requestedDate: string
  origin: string
  destination: string
  alternativeDates?: AlternativeDate[]
  onSelectAlternative: (date: string) => void
  onConvertToOneWay: () => void
}

export default function NoReturnFlightsAlert({
  isOpen,
  onClose,
  requestedDate,
  origin,
  destination,
  alternativeDates = [],
  onSelectAlternative,
  onConvertToOneWay
}: NoReturnFlightsAlertProps) {
  const formatDate = (dateInput: string | Date | null | undefined) => {
    if (!dateInput) return 'Fecha no disponible'
    
    // Convertir a string si es un objeto Date
    let dateString: string
    if (dateInput instanceof Date) {
      dateString = dateInput.toISOString().split('T')[0]
    } else if (typeof dateInput === 'string') {
      dateString = dateInput
    } else {
      // Si es otro tipo, intentar convertirlo a string
      dateString = String(dateInput)
    }
    
    // Validar formato de fecha
    if (!dateString || typeof dateString !== 'string' || !dateString.includes('-')) {
      return 'Fecha inválida'
    }
    
    // Parsear la fecha como UTC para evitar desfase de timezone
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))
    return date.toLocaleDateString('es-ES', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    })
  }

  const getOffsetLabel = (offset: number) => {
    if (offset === 0) return 'mismo día'
    if (offset === 1) return '1 día después'
    if (offset === -1) return '1 día antes'
    if (offset > 0) return `${offset} días después`
    return `${Math.abs(offset)} días antes`
  }

  const handleSelectDate = (date: string) => {
    onSelectAlternative(date)
    onClose()
  }

  const handleConvertToOneWay = () => {
    onConvertToOneWay()
    onClose()
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="2xl"
      backdrop="blur"
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-sm",
        base: "border border-warning/20",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                  <AlertCircle className="text-warning" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">
                    No hay vuelos de regreso disponibles
                  </h3>
                </div>
              </div>
            </ModalHeader>
            
            <ModalBody>
              <p className="text-sm text-foreground/70 mb-4">
                No encontramos vuelos de <span className="font-semibold">{destination}</span> a{' '}
                <span className="font-semibold">{origin}</span> para el{' '}
                <span className="font-semibold">{formatDate(requestedDate)}</span>
              </p>

              {/* Alternative Dates */}
              {alternativeDates.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground/80 flex items-center gap-2">
                    <Calendar size={16} />
                    Fechas alternativas disponibles:
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {alternativeDates.map((alt) => (
                      <button
                        key={alt.date}
                        onClick={() => handleSelectDate(alt.date)}
                        className="group relative p-4 rounded-lg border-2 border-divider hover:border-primary hover:bg-primary/5 transition-all text-left"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-primary">
                            {getOffsetLabel(alt.offset)}
                          </span>
                          <Chip size="sm" color="success" variant="flat" className="text-[10px] h-5">
                            {alt.flightCount} {alt.flightCount === 1 ? 'vuelo' : 'vuelos'}
                          </Chip>
                        </div>
                        <div className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                          {formatDate(alt.date)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-default-100 rounded-lg p-4">
                  <p className="text-sm text-foreground/70 text-center">
                    No encontramos vuelos en fechas cercanas (±3 días)
                  </p>
                </div>
              )}
            </ModalBody>
            
            <ModalFooter>
              <Button
                color="default"
                variant="flat"
                size='lg'
                onPress={onClose}
              >
                Buscar otra fecha
              </Button>
              <Button
                color="primary"
                variant="flat"
                size='lg'
                startContent={<Plane size={16} />}
                onPress={handleConvertToOneWay}
              >
                Convertir a solo ida
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
