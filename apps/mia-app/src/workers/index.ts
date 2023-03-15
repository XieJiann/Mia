import type { MiaBackendWorker } from '../backend/index'
export * as backend_t from '../backend/types'

export function createBackendWorker() {
  const worker = new ComlinkWorker<MiaBackendWorker>(
    new URL('../backend', import.meta.url)
  )
  return worker
}
