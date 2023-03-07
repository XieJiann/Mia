export * as api_t from './types'
import * as api_t from './types'
import axios, { AxiosInstance } from 'axios'
import { Result } from '../types'
import { formatErrorUserFriendly } from '../utils'

export class ApiClientError extends Error {}

export interface OpenAIClientOptions {
  endpoint: string
  apiKey?: string
}

export class OpenAIClient {
  httpClient: AxiosInstance

  constructor(private opts: OpenAIClientOptions) {
    this.httpClient = axios.create({
      baseURL: opts.endpoint,
    })

    // console.log(`Create OpenAI client with endpoint=${opts.endpoint}`)
  }

  async checkApiKeyValid(): Promise<boolean> {
    const headers = this.getHeaders()

    const resp = await this.httpClient.post(
      '/v1/chat/completions',
      {},
      {
        headers,
      }
    )

    if (resp.status === 401) {
      return false
    }

    if (resp.status == 400) {
      return true
    }

    console.error('unexpected response', resp.status, resp.data)
    return false
  }

  async createChatCompletions(
    req: api_t.CreateChatCompletionsRequest
  ): Promise<Result<api_t.CreateChatCompletionsReply>> {
    const headers = this.getHeaders()

    const resp = await this.httpClient.post('/v1/chat/completions', req, {
      headers,
    })

    if (resp.status !== 200) {
      return {
        ok: false,
        error: new ApiClientError(`failed to request, erro=${resp.data}`),
      }
    }

    return { ok: true, value: resp.data }
  }

  async createChatCompletionsStream(
    req: api_t.CreateChatCompletionsRequest,
    cb: (data: api_t.CreateChatCompletionsReplyEventData[]) => void
  ): Promise<Result<boolean>> {
    const headers = this.getHeaders()

    // encounter problem when use stream in axios
    const resp = await fetch(`${this.opts.endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...req,
        stream: true,
      }),
    })

    if (!resp.ok) {
      const text = await resp.text()
      return {
        ok: false,
        error: new ApiClientError(`failed to request, erro=${text}`),
      }
    }

    const stream: ReadableStream<Uint8Array> | null = resp.body

    if (stream) {
      try {
        const reader = stream.getReader()
        while (true) {
          const { done, value } = await reader.read()

          const result = this.parseChatCompletionStream(
            new TextDecoder().decode(value)
          )

          if (done) {
            break
          }

          let has_done = false
          const events: api_t.CreateChatCompletionsReplyEventData[] = []

          for (const event of result) {
            if (event === '[DONE]') {
              has_done = true
            } else {
              events.push(event)
            }
          }

          cb(events)

          if (has_done) {
            break
          }
        }
      } catch (e) {
        return {
          ok: false,
          error: new ApiClientError(
            `encouter error when parse stream, err=${formatErrorUserFriendly(
              e
            )}`,
            {
              cause: e,
            }
          ),
        }
      }
    }

    return { ok: true, value: true }
  }

  // from https://github.com/ztjhz/ChatGPTFreeApp/blob/main/src/api/helper.ts#L7-L22
  private parseChatCompletionStream(
    data: string
  ): ('[DONE]' | api_t.CreateChatCompletionsReplyEventData)[] {
    const result = data
      .split('\n\n')
      .filter(Boolean)
      .map((chunk) => {
        const jsonString = chunk
          .split('\n')
          .map((line) => line.replace(/^data: /, ''))
          .join('')
        if (jsonString === '[DONE]') return jsonString
        try {
          const json = JSON.parse(jsonString)
          return json
        } catch (e) {
          console.warn(`failed to parse json, err=${e}, data=${jsonString}`)
          return null
        }
      })
      .filter(Boolean)

    return result
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.opts.apiKey) {
      headers['Authorization'] = `Bearer ${this.opts.apiKey}`
    }
    return headers
  }
}
