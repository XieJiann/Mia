import * as _ from 'lodash-es'
import React from 'react'

export function makeContextHook<T>(): [React.Context<T | null>, () => T] {
  const context = React.createContext<T | null>(null)

  const hook = () => {
    const value = React.useContext(context)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return value!
  }

  return [context, hook]
}

export function makeDataCreator<T extends object>(
  defaultValue: T
): (...defaultValues: Partial<T>[]) => T {
  return (...defaultValues: Partial<T>[]): T => {
    return _.mergeWith({}, defaultValue, ...defaultValues)
  }
}

export function formatErrorUserFriendly(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return `${error}`
}

export function extractBotNamePrefixExplict(content: string) {
  const botNamePattern = /^@([-_.$0-9a-zA-Z]+)/

  const trimed = content.trimStart()

  const match = trimed.match(botNamePattern)
  if (match) {
    return {
      name: match[1],
      content,
      trimedContent: trimed.slice(match[0].length),
    }
  }

  return {
    name: '',
    content,
    trimedContent: content,
  }
}

// Extract botname prefix, like `@chatgpt hello, world` -> {name: chatgpt, content: '@chatgpt ...', trimedContent: 'hello, world'}
export function extractBotNamePrefix(content: string): {
  name: string
  content: string
  trimedContent: string
} {
  // try first
  const res1 = extractBotNamePrefixExplict(content)

  if (res1.name) {
    return res1
  }

  // try second sentence
  const sentences = content.split(/[.!?:\u3002\uFF01\uff1a]/, 2)
  console.log(`sentences`, sentences)
  if (sentences.length >= 2) {
    const res2 = extractBotNamePrefixExplict(sentences[1])
    if (res2.name) {
      return res2
    }
  }

  return {
    name: '',
    content,
    trimedContent: content,
  }
}
