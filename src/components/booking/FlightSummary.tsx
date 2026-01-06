'use client'

import { Card, CardBody, Chip, Divider } from '@heroui/react'
import { Plane, Clock, Shield } from 'lucide-react'
import { FlightOffer } from '@/types/flight-search'

interface FlightSummaryProps {
  flight: FlightOffer
  fareType: 'basic' | 'guarantee'
  passengers: number
  showPriceBreakdown?: boolean
}

export default function FlightSummary({
  flight,
  fareType,
  passengers,
  showPriceBreakdown = true
}: FlightSummaryProps) {
  const fare = flight.fares.find(f => f.type === fareType)
  const totalPrice = fare ? fare.price * passengers : flight.price * passengers

  const renderItinerary = (itinerary: FlightOffer['outbound'], label: string) => {
    const firstSegment = itinerary.segments[0]
    const lastSegment = itinerary.segments[itinerary.segments.length - 1]

    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase">{label}</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold">{firstSegment.departureTime}</p>
            <p className="text-sm text-gray-600">{firstSegment.departureCity}</p>
            <p className="text-xs text-gray-500">{firstSegment.departureAirport}</p>
          </div>
          <div className="flex-1 px-4 flex flex-col items-center">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{itinerary.totalDuration}</span>
            </div>
            <div className="w-full h-px bg-gray-300 my-1"></div>
            {itinerary.isDirect ? (
              <Chip size="sm" variant="flat" color="success" startContent={<Plane className="w-3 h-3" />}>
                Direct
              </Chip>
            ) : (
              <span className="text-xs text-gray-500">{itinerary.stops} stop{itinerary.stops > 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{lastSegment.arrivalTime}</p>
            <p className="text-sm text-gray-600">{lastSegment.arrivalCity}</p>
            <p className="text-xs text-gray-500">{lastSegment.arrivalAirport}</p>
          </div>
        </div>
        {!itinerary.isDirect && (
          <div className="text-xs text-gray-500 pl-2">
            via {itinerary.segments.slice(0, -1).map(s => s.arrivalAirport).join(', ')}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="sticky top-20">
      <CardBody className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg">
              {flight.outbound.segments[0].departureCity} → {flight.outbound.segments[flight.outbound.segments.length - 1].arrivalCity}
              {flight.inbound && ' and back'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {passengers} passenger{passengers > 1 ? 's' : ''}
            </p>
          </div>
          {fareType === 'guarantee' && (
            <Chip size="sm" color="success" variant="flat" startContent={<Shield className="w-3 h-3" />}>
              Guarantee
            </Chip>
          )}
        </div>

        <Divider />

        {/* Outbound */}
        {renderItinerary(flight.outbound, 'Outbound')}

        {/* Inbound */}
        {flight.inbound && (
          <>
            <Divider />
            {renderItinerary(flight.inbound, 'Inbound')}
          </>
        )}

        {showPriceBreakdown && (
          <>
            <Divider />

            {/* Price Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">1x Adult</span>
                <span className="font-medium">${fare?.price || flight.price}</span>
              </div>
              {fareType === 'guarantee' && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">1x Kiwi.com Guarantee</span>
                  <span className="font-medium text-green-600">$22</span>
                </div>
              )}
              <Divider />
              <div className="flex justify-between font-bold text-lg">
                <span>Total (USD)</span>
                <span className="text-primary">${totalPrice}</span>
              </div>
              <p className="text-xs text-gray-500">
                Includes all taxes, fees, and Kiwi.com service fees. Kiwi.com service fees are non-refundable.
              </p>
            </div>

            {/* Price Lock Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-1">Need more time to decide?</p>
              <p className="text-xs text-blue-800 mb-3">
                We'll hold the ticket for 3 days and you pay the booked price of ${totalPrice} when you're ready to finish your booking.
              </p>
              <p className="text-xs text-blue-700">
                If the price goes down, you'll pay the new, lower price.
              </p>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  )
}
