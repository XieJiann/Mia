import { MiaBackendWorker } from './worker'
import { expose } from 'comlink'
export type { MiaBackendWorker }

const worker = new MiaBackendWorker()

// bind all function in worker
Object.keys(worker).forEach((key) => {
  // @ts-expect-error worker
  if (typeof worker[key] === 'function') {
    // @ts-expect-error worker
    worker[key] = worker[key].bind(worker)
  }
})

expose(worker)