/// <reference lib="webworker" />
declare const self: DedicatedWorkerGlobalScope

export class MiaBackendWorker {
  constructor() {}

  getHelloMessage() {
    return 'Hello, world'
  }

  async getHelloMessage2() {
    return 'Hello, world 2'
  }

  getHelloWithOpts(opt: unknown) {
    return `Hello, world with opts: ${JSON.stringify(opt)}`
  }
}
