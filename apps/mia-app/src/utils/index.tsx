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

// Extract botname prefix, like `@chatgpt hello, world` -> {name: chatgpt, content: '@chatgpt ...', trimedContent: 'hello, world'}
export function extractBotNamePrefix(content: string): {
  name: string
  content: string
  trimedContent: string
} {
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
