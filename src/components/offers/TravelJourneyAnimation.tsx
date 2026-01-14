'use client'

import { Plane, MapPin, Globe } from 'lucide-react'

export default function TravelJourneyAnimation() {
  return (
    <div className="w-full py-6 mb-4">
      {/* Título y descripción */}
      <div className="text-center mb-8">
        <h3 className="text-lg font-bold" style={{ color: '#0c3f5b' }}>¿A dónde vamos?</h3>
        <p className="text-sm text-default-500">Selecciona el destino para empezar</p>
      </div>

      {/* Recorrido visual */}
      <div className="relative flex items-center justify-center" style={{ height: '100px' }}>
        {/* SVG para la línea curva punteada */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 100" preserveAspectRatio="xMidYMid meet">
          <path
            d="M 100 70 Q 250 20, 400 70"
            stroke="#9ca3af"
            strokeWidth="2"
            fill="none"
            strokeDasharray="8 8"
          />
        </svg>

        {/* Origen */}
        <div className="absolute" style={{ left: '15%', top: '50%', transform: 'translate(-50%, -50%)' }}>
          <MapPin size={40} style={{ color: '#0c3f5b' }} strokeWidth={1.5} />
        </div>

        <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
          <div className="flex items-center justify-center gap-3">
            <Plane size={34} style={{ color: '#0c3f5b', transform: 'rotate(45deg)' }} strokeWidth={1.5} />
            <Globe size={34} style={{ color: '#ec9c12' }} strokeWidth={1.5} />
          </div>
        </div>

        {/* Destino */}
        <div className="absolute" style={{ right: '15%', top: '50%', transform: 'translate(50%, -50%)' }}>
          <MapPin size={40} style={{ color: '#ec9c12' }} strokeWidth={1.5} />
        </div>
      </div>
    </div>
  )
}
