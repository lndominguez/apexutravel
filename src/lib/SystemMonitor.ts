'use client'

import { useState, useEffect } from 'react'

// Tipos de recursos que el sistema necesita cargar
export enum SystemResource {
  AUTH_SESSION = 'auth_session',
  USER_PREFERENCES = 'user_preferences',
  DATABASE_CONNECTION = 'database_connection',
  THEME_APPLICATION = 'theme_application',
  UI_COMPONENTS = 'ui_components',
  NAVIGATION_READY = 'navigation_ready'
}

export enum ResourceStatus {
  PENDING = 'pending',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

export interface ResourceState {
  status: ResourceStatus
  progress: number // 0-100
  message?: string
  error?: string
  timestamp?: number
}

export interface SystemState {
  resources: Record<SystemResource, ResourceState>
  overallProgress: number
  isReady: boolean
  hasErrors: boolean
}

class SystemMonitorClass {
  private state: SystemState = {
    resources: {
      [SystemResource.AUTH_SESSION]: { status: ResourceStatus.PENDING, progress: 0 },
      [SystemResource.USER_PREFERENCES]: { status: ResourceStatus.PENDING, progress: 0 },
      [SystemResource.DATABASE_CONNECTION]: { status: ResourceStatus.PENDING, progress: 0 },
      [SystemResource.THEME_APPLICATION]: { status: ResourceStatus.PENDING, progress: 0 },
      [SystemResource.UI_COMPONENTS]: { status: ResourceStatus.PENDING, progress: 0 },
      [SystemResource.NAVIGATION_READY]: { status: ResourceStatus.PENDING, progress: 0 }
    },
    overallProgress: 0,
    isReady: false,
    hasErrors: false
  }

  private listeners: Array<(state: SystemState) => void> = []
  private minimumLoadTime = 2000 // 2 segundos mínimo
  private startTime = Date.now()

  // Suscribirse a cambios de estado
  subscribe(listener: (state: SystemState) => void) {
    this.listeners.push(listener)
    
    // Devolver función para desuscribirse
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  // Actualizar estado de un recurso
  updateResource(
    resource: SystemResource, 
    status: ResourceStatus, 
    progress: number = 0,
    message?: string,
    error?: string
  ) {
    this.state.resources[resource] = {
      status,
      progress: Math.min(100, Math.max(0, progress)),
      message,
      error,
      timestamp: Date.now()
    }

    this.calculateOverallState()
    this.notifyListeners()
  }

  // Marcar recurso como cargando
  startLoading(resource: SystemResource, message?: string) {
    this.updateResource(resource, ResourceStatus.LOADING, 0, message)
  }

  // Actualizar progreso de un recurso
  updateProgress(resource: SystemResource, progress: number, message?: string) {
    const currentResource = this.state.resources[resource]
    this.updateResource(
      resource, 
      currentResource.status === ResourceStatus.PENDING ? ResourceStatus.LOADING : currentResource.status,
      progress, 
      message
    )
  }

  // Marcar recurso como completado
  markSuccess(resource: SystemResource, message?: string) {
    this.updateResource(resource, ResourceStatus.SUCCESS, 100, message)
  }

  // Marcar recurso como error
  markError(resource: SystemResource, error: string) {
    this.updateResource(resource, ResourceStatus.ERROR, 0, undefined, error)
  }

  // Calcular estado general del sistema
  private calculateOverallState() {
    const resources = Object.values(this.state.resources)
    const totalProgress = resources.reduce((sum, resource) => sum + resource.progress, 0)
    const averageProgress = totalProgress / resources.length

    // Verificar si hay errores
    const hasErrors = resources.some(resource => resource.status === ResourceStatus.ERROR)
    
    // Verificar si todos están completos
    const allComplete = resources.every(resource => resource.status === ResourceStatus.SUCCESS)
    
    // Verificar tiempo mínimo
    const timeElapsed = Date.now() - this.startTime
    const minimumTimeMet = timeElapsed >= this.minimumLoadTime

    this.state.overallProgress = averageProgress
    this.state.hasErrors = hasErrors
    this.state.isReady = allComplete && minimumTimeMet && !hasErrors
  }

  // Notificar a todos los listeners
  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.state }))
  }

  // Obtener estado actual
  getState(): SystemState {
    return { ...this.state }
  }

  // Resetear el monitor
  reset() {
    this.startTime = Date.now()
    this.state = {
      resources: {
        [SystemResource.AUTH_SESSION]: { status: ResourceStatus.PENDING, progress: 0 },
        [SystemResource.USER_PREFERENCES]: { status: ResourceStatus.PENDING, progress: 0 },
        [SystemResource.DATABASE_CONNECTION]: { status: ResourceStatus.PENDING, progress: 0 },
        [SystemResource.THEME_APPLICATION]: { status: ResourceStatus.PENDING, progress: 0 },
        [SystemResource.UI_COMPONENTS]: { status: ResourceStatus.PENDING, progress: 0 },
        [SystemResource.NAVIGATION_READY]: { status: ResourceStatus.PENDING, progress: 0 }
      },
      overallProgress: 0,
      isReady: false,
      hasErrors: false
    }
    this.notifyListeners()
  }

  // Forzar como listo (para casos de emergencia)
  forceReady() {
    Object.keys(this.state.resources).forEach(key => {
      const resource = key as SystemResource
      if (this.state.resources[resource].status !== ResourceStatus.SUCCESS) {
        this.markSuccess(resource, 'Forzado como listo')
      }
    })
  }
}

// Instancia singleton
export const SystemMonitor = new SystemMonitorClass()

// Hook para usar el monitor en componentes React
export function useSystemMonitor() {
  const [state, setState] = useState<SystemState>(SystemMonitor.getState())

  useEffect(() => {
    const unsubscribe = SystemMonitor.subscribe(setState)
    return unsubscribe
  }, [])

  return {
    ...state,
    updateResource: SystemMonitor.updateResource.bind(SystemMonitor),
    startLoading: SystemMonitor.startLoading.bind(SystemMonitor),
    updateProgress: SystemMonitor.updateProgress.bind(SystemMonitor),
    markSuccess: SystemMonitor.markSuccess.bind(SystemMonitor),
    markError: SystemMonitor.markError.bind(SystemMonitor),
    reset: SystemMonitor.reset.bind(SystemMonitor),
    forceReady: SystemMonitor.forceReady.bind(SystemMonitor)
  }
}
