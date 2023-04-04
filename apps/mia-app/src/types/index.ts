export type Result<T> =
  | { ok: true; value: T; error?: undefined }
  | { ok: false; error: Error; value?: undefined }
export type Optional<T> = { ok: true; v: T } | { ok: false }

export interface IStreamHandler<T> {
  onData(handler: (v: T) => void): void
  // stop stream
  abort(): void
  // check stream finished
  isFinished(): boolean
  // wait stream finished
  wait(): Promise<Result<boolean>>
  // map to another stream
  map<R>(mapper: (v: T) => R): IStreamHandler<R>
}

export interface StreamState<T> {
  getAbortController(): AbortController
  addData(data: T): void
  markFinished(): void
}

export function makeStreamHandler<T>(
  fn: (state: StreamState<T>) => Promise<Result<boolean>>
): IStreamHandler<T> {
  const handler = new StreamHandler<T>()
  handler.register(fn)
  return handler
}

class ChainedStreamHandler<R, T> implements IStreamHandler<R> {
  private handler: ((v: R) => void) | undefined
  private buffered: R[] = []

  constructor(private parent: IStreamHandler<T>, private mapper: (v: T) => R) {
    parent.onData((v) => {
      const mapped = this.mapper(v)
      if (this.handler) {
        this.handler(mapped)
      } else {
        this.buffered.push(mapped)
      }
    })
  }

  onData(handler: (v: R) => void): void {
    if (this.handler) {
      throw new Error('duplicate handler')
    }

    this.handler = handler
    this.buffered.forEach((v) => {
      handler(v)
    })
    this.buffered = []
  }

  abort(): void {
    this.parent.abort()
  }

  wait(): Promise<Result<boolean>> {
    return this.parent.wait()
  }

  map<R2>(mapper: (v: R) => R2): IStreamHandler<R2> {
    return new ChainedStreamHandler<R2, R>(this, mapper)
  }

  isFinished(): boolean {
    return this.parent.isFinished()
  }
}

class StreamHandler<T> implements IStreamHandler<T>, StreamState<T> {
  private handler: ((v: T) => void) | undefined
  private abortController = new AbortController()
  private buffered: T[] = []
  private errors: Error[] = []
  private finished = false

  private func: Promise<Result<boolean>> | undefined

  constructor() {}

  map<R>(mapper: (v: T) => R): IStreamHandler<R> {
    return new ChainedStreamHandler<R, T>(this, mapper)
  }

  // stream state
  getAbortController(): AbortController {
    return this.abortController
  }

  addData(data: T): void {
    if (this.handler) {
      this.handler(data)
    } else {
      this.buffered.push(data)
    }
  }

  markFinished(): void {
    this.finished = true
  }

  register(fn: (state: StreamState<T>) => Promise<Result<boolean>>) {
    // run it at once
    this.func = fn(this)
    this.func.then(() => {
      this.finished = true
    })
  }

  // stream handler
  onData(handler: (v: T) => void) {
    if (this.handler) {
      throw new Error('duplicate handler')
    }

    this.handler = handler

    for (const v of this.buffered) {
      handler(v)
    }

    this.buffered = []
  }

  abort() {
    this.abortController.abort()
  }

  async wait(): Promise<Result<boolean>> {
    if (!this.func) {
      return {
        ok: false,
        error: new Error('no function registered'),
      }
    }

    const res = await this.func

    if (this.abortController.signal.aborted) {
      // aborted
      return {
        ok: true,
        value: false,
      }
    }

    return res
  }

  isFinished(): boolean {
    return this.finished
  }
}
