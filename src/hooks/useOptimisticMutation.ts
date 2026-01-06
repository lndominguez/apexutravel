import { useSWRConfig } from 'swr'
import { useCallback } from 'react'

interface MutationOptions<T> {
  optimisticData?: (currentData: T) => T
  rollbackOnError?: boolean
  revalidate?: boolean
}

export function useOptimisticMutation() {
  const { mutate } = useSWRConfig()

  const mutateWithOptimism = useCallback(
    async <T>(
      key: string,
      mutationFn: () => Promise<T>,
      options: MutationOptions<T> = {}
    ) => {
      const {
        optimisticData,
        rollbackOnError = true,
        revalidate = true
      } = options

      try {
        // Si hay datos optimistas, aplicarlos inmediatamente
        if (optimisticData) {
          await mutate(key, (currentData: T | undefined) => {
            if (currentData) {
              return optimisticData(currentData)
            }
            return currentData
          }, { revalidate: false })
        }

        // Ejecutar la mutación
        const result = await mutationFn()

        // Revalidar después de la mutación exitosa
        if (revalidate) {
          await mutate(key)
        }

        return result
      } catch (error) {
        // Si hay error y rollback está habilitado, revalidar para recuperar estado original
        if (rollbackOnError) {
          await mutate(key)
        }
        throw error
      }
    },
    [mutate]
  )

  return {
    mutateWithOptimism,
    mutate
  }
}
