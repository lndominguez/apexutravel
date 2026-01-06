'use client'

import React from 'react'
import { Skeleton, Card, CardBody } from '@heroui/react'

interface ContentSkeletonProps {
  type?: 'dashboard' | 'table' | 'cards' | 'form' | 'profile'
  rows?: number
}

export function ContentSkeleton({ type = 'dashboard', rows = 3 }: ContentSkeletonProps) {
  
  if (type === 'dashboard') {
    return (
      <div className="p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="w-full">
              <CardBody className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                  <Skeleton className="h-8 w-16 rounded-lg" />
                  <Skeleton className="h-3 w-24 rounded-lg" />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Content Area Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardBody className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-32 rounded-lg" />
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4 rounded-lg" />
                        <Skeleton className="h-3 w-1/2 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-40 rounded-lg" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-full rounded-lg" />
                      <Skeleton className="h-3 w-2/3 rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    )
  }

  if (type === 'table') {
    return (
      <div className="space-y-4">
        {/* Table Header */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        
        {/* Table Skeleton */}
        <Card>
          <CardBody className="p-0">
            <div className="space-y-0">
              {/* Table Header Row */}
              <div className="flex items-center p-4 border-b border-divider">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex-1 px-2">
                    <Skeleton className="h-4 w-20 rounded-lg" />
                  </div>
                ))}
              </div>
              
              {/* Table Rows */}
              {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center p-4 border-b border-divider last:border-b-0">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="flex-1 px-2">
                      {j === 0 ? (
                        <div className="flex items-center space-x-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-4 w-24 rounded-lg" />
                        </div>
                      ) : (
                        <Skeleton className="h-4 w-16 rounded-lg" />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  if (type === 'cards') {
    return (
      <div className="container mx-auto px-6 py-8 space-y-8 max-w-7xl">
        {/* Header Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-12 w-64 rounded-lg" />
          <Skeleton className="h-6 w-96 rounded-lg" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="w-full">
              <CardBody className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                  <Skeleton className="h-8 w-16 rounded-lg" />
                  <Skeleton className="h-3 w-24 rounded-lg" />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Filters Skeleton */}
        <Card>
          <CardBody className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <Skeleton className="h-12 flex-1 rounded-lg" />
              <Skeleton className="h-12 w-40 rounded-lg" />
              <Skeleton className="h-12 w-40 rounded-lg" />
            </div>
          </CardBody>
        </Card>

        {/* Table Skeleton */}
        <Card>
          <CardBody className="p-0">
            <div className="p-6 border-b">
              <Skeleton className="h-8 w-48 rounded-lg" />
            </div>
            <div className="space-y-0">
              {Array.from({ length: rows || 5 }).map((_, i) => (
                <div key={i} className="flex items-center p-6 border-b border-divider last:border-b-0">
                  <div className="flex items-center gap-4 flex-1">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32 rounded-lg" />
                      <Skeleton className="h-3 w-24 rounded-lg" />
                    </div>
                  </div>
                  <div className="flex gap-8">
                    <Skeleton className="h-4 w-20 rounded-lg" />
                    <Skeleton className="h-4 w-16 rounded-lg" />
                    <Skeleton className="h-4 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  if (type === 'form') {
    return (
      <Card>
        <CardBody className="p-6">
          <div className="space-y-6">
            <Skeleton className="h-8 w-48 rounded-lg" />
            
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24 rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            ))}
            
            <div className="flex justify-end space-x-3">
              <Skeleton className="h-10 w-24 rounded-lg" />
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
          </div>
        </CardBody>
      </Card>
    )
  }

  if (type === 'profile') {
    return (
      <div className="space-y-6">
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center space-x-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-3 flex-1">
                <Skeleton className="h-8 w-48 rounded-lg" />
                <Skeleton className="h-4 w-64 rounded-lg" />
                <Skeleton className="h-4 w-32 rounded-lg" />
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32 rounded-lg" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24 rounded-lg" />
                  <Skeleton className="h-4 w-32 rounded-lg" />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  // Default skeleton
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full rounded-lg" />
      ))}
    </div>
  )
}

// Componentes específicos para fácil uso
export function DashboardSkeleton() {
  return <ContentSkeleton type="dashboard" />
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return <ContentSkeleton type="table" rows={rows} />
}

export function CardsSkeleton({ rows = 2 }: { rows?: number }) {
  return <ContentSkeleton type="cards" rows={rows} />
}

export function FormSkeleton({ rows = 4 }: { rows?: number }) {
  return <ContentSkeleton type="form" rows={rows} />
}

export function ProfileSkeleton() {
  return <ContentSkeleton type="profile" />
}
