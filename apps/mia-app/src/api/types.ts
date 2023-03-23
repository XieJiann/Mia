export interface ChatCompletionMessage {
  role: 'assistant' | 'system' | 'user'
  content: string
}

export interface CreateChatCompletionsRequest {
  // "gpt-3.5-turbo" or "gpt-3.5-turbo-0301"
  model: string
  messages: ChatCompletionMessage[]
}

export interface CreateChatCompletionsReply {
  // example: "chatcmp-123"
  id: string
  // example: "chat.completion"
  object: string
  // example: 1677652288
  created: number
  choices: {
    index: number
    message: ChatCompletionMessage
    finish_reason: 'length' | 'stop' | 'timeout'
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface CreateChatCompletionsReplyEventData {
  id: string
  created: number
  choices: {
    delta: {
      role?: string
      content?: string
    }
    index: number
    finish_reason: 'length' | 'stop' | 'timeout'
  }[]
}

export interface OpenAIGenerateImageRequest {
  // A text description of the desired image(s). The maximum length is 1000 characters.
  prompt: string
  // The number of images to generate. Must be between 1 and 10.
  // default: 1
  n?: number
  // The size of the generated images. Must be one of 256x256, 512x512, or 1024x1024.
  // default: 1024x1024
  size?: string
  // The format in which the generated images are returned. Must be one of url or b64_json.
  // default: url
  response_format?: string
  // A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse. Learn more.
  user?: string
}

export interface OpenAIGenerateImageReply {
  created: number
  data: {
    url: string
  }[]
}
