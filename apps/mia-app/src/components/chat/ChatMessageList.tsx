import { Box, List } from '@mui/material'
import React, { useEffect, useRef } from 'react'
import { Virtuoso, VirtuosoHandle, VirtuosoProps } from 'react-virtuoso'
import * as chat_t from '../../stores/chat'
import { shallow } from '../../stores'
import ChatMessageItem from './ChatMessageItem'
import { useThrottleFn } from 'ahooks'

// Component use to observe height changes
function ObserveHeight({
  children,
  onHeightChanged,
  throttle = 500,
}: {
  children: React.ReactElement
  onHeightChanged: (curHeight: number, prevHeight: number) => void
  throttle?: number
}) {
  const prevHeight = useRef<number>(0)
  const ref = useRef<HTMLDivElement>(null)

  const { run: handleHeightChanged } = useThrottleFn(onHeightChanged, {
    wait: throttle,
  })

  useEffect(() => {
    const el = ref.current
    if (!el) {
      return
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const newHeight = entries[0].contentRect.height
      handleHeightChanged(newHeight, prevHeight.current)
      prevHeight.current = newHeight
    })

    resizeObserver.observe(el)

    return () => resizeObserver.disconnect()
  }, [handleHeightChanged])

  return <Box ref={ref}>{children}</Box>
}

export interface ChatMessageListProps {
  messages: chat_t.ChatMessage[]
  onRegenerateMessage: (p: { messageId: string }) => Promise<void>
}
export default function ChatMessageList({
  messages,
  onRegenerateMessage,
}: ChatMessageListProps) {
  // TODO: impl to bottom button, see https://virtuoso.dev/stick-to-bottom/
  // We use followOutput=auto to scroll to bottom when totalCount changes
  const virtuosoRef = useRef<VirtuosoHandle>(null)

  const [stopGenerateMessage, updateMessage, deleteMessage] =
    chat_t.useChatStore(
      (s) => [s.stopGenerateMessage, s.updateMessage, s.deleteMessage],
      shallow
    )

  const handleScrollToButtom = () => {
    if (virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({ index: 'LAST' })
    }
  }

  return (
    <Virtuoso
      ref={virtuosoRef}
      style={{
        height: 'calc(100vh - 80px)',
      }}
      components={VirtuosoComponents}
      followOutput={'auto'}
      initialTopMostItemIndex={messages.length - 1}
      totalCount={messages.length}
      overscan={{
        main: 2,
        reverse: 2,
      }}
      itemContent={(index) => {
        const isLast = index === messages.length - 1
        const message = messages[index]

        const item = (
          <ChatMessageItem
            key={message.id}
            message={message}
            onRegenerate={() => {
              onRegenerateMessage({ messageId: message.id })
            }}
            onStopGenerate={() => {
              stopGenerateMessage({ messageId: message.id })
            }}
            onUpdateMessage={updateMessage}
            onDeleteMessage={deleteMessage}
          />
        )

        if (isLast) {
          return (
            <ObserveHeight
              onHeightChanged={(height) => {
                handleScrollToButtom()
              }}
              throttle={500}
            >
              {item}
            </ObserveHeight>
          )
        }

        return item
      }}
    />
  )
}

// @see https://virtuoso.dev/material-ui-endless-scrolling/
const VirtuosoComponents: VirtuosoProps<unknown, unknown>['components'] = {
  Header: () => {
    /* Workaround, use dummy div */
    return <Box sx={{ height: '80px' }}></Box>
  },
  Footer: () => {
    /* Workaround, use dummy div */
    return <Box sx={{ height: '20px' }}></Box>
  },
}
