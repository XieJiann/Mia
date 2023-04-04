import { Box, List } from '@mui/material'
import React, { useEffect, useRef } from 'react'
import { Virtuoso, VirtuosoHandle, VirtuosoProps } from 'react-virtuoso'
import * as chat_t from '../../stores/chat'
import { shallow } from '../../stores'
import ChatMessageItem from './ChatMessageItem'
import { useCreation, useMemoizedFn, useThrottleFn } from 'ahooks'
import { useSnackbar } from 'notistack'
import { formatErrorUserFriendly } from '../../utils'

// Component use to observe height changes
function ObserveHeight({
  children,
  onHeightChanged,
  throttle = 500,
}: {
  children: React.ReactElement
  onHeightChanged: (
    curRect: DOMRectReadOnly,
    prevRect: DOMRectReadOnly | undefined
  ) => void
  throttle?: number
}) {
  const prevRect = useRef<DOMRectReadOnly | undefined>(undefined)
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
      const newRect = entries[0].contentRect
      handleHeightChanged(newRect, prevRect.current)
      prevRect.current = { ...newRect }
    })

    resizeObserver.observe(el)

    return () => resizeObserver.disconnect()
  }, [handleHeightChanged])

  return <Box ref={ref}>{children}</Box>
}

function ObserveMessageChange({
  onScrollToBottom,
  message,
  children,
}: {
  onScrollToBottom: () => void
  children: React.ReactElement
  message: chat_t.ChatMessage
}) {
  const lastMessageRef = useRef<chat_t.ChatMessage | undefined>(undefined)

  return (
    <ObserveHeight
      onHeightChanged={(cur, prev) => {
        if (!prev) {
          return
        }

        if (cur.height <= prev.height) {
          return
        }

        if (
          lastMessageRef.current &&
          message.content.length != lastMessageRef.current.content.length
        ) {
          onScrollToBottom()
        }

        lastMessageRef.current = message
      }}
      throttle={0}
    >
      {children}
    </ObserveHeight>
  )
}

export interface ChatMessageListProps {
  maxWidth: string
  messages: chat_t.ChatMessage[]
}
export default function ChatMessageList({
  messages,
  maxWidth,
}: ChatMessageListProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null)

  const [regenerateMessage, stopGenerateMessage, updateMessage, deleteMessage] =
    chat_t.useChatStore(
      (s) => [
        s.regenerateMessage,
        s.stopGenerateMessage,
        s.updateMessage,
        s.deleteMessage,
      ],
      shallow
    )

  const { enqueueSnackbar } = useSnackbar()

  const { run: handleScrollToButtom } = useThrottleFn(
    () => {
      const virtuoso = virtuosoRef.current

      if (virtuoso) {
        virtuoso.scrollToIndex({
          index: 'LAST',
          align: 'end',
          offset: 0,
        })
      }
    },
    { wait: 500 }
  )

  const handleRegenerateMessage: chat_t.ChatStore['regenerateMessage'] =
    useMemoizedFn(async (p: { messageId: string; chatId: string }) => {
      const resp = await regenerateMessage({
        messageId: p.messageId,
        chatId: p.chatId,
      })

      if (!resp.ok) {
        enqueueSnackbar(formatErrorUserFriendly(resp.error), {
          autoHideDuration: 3000,
          variant: 'error',
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'center',
          },
        })
        return resp
      }

      return { ok: true, value: true }
    })

  const virtuosoComponents: VirtuosoProps<unknown, unknown>['components'] =
    useCreation(
      () => ({
        Header: () => {
          /* Workaround, use dummy div */
          return <Box sx={{ height: '80px' }}></Box>
        },
        Footer: () => {
          /* Workaround, use dummy div */
          return <Box sx={{ height: '20px' }}></Box>
        },
        List: React.forwardRef(({ style, children }, listRef) => {
          return (
            <List
              style={{
                padding: 0,
                ...style,
                marginLeft: 'auto',
                marginRight: 'auto',
                maxWidth,
              }}
              component="div"
              ref={listRef}
            >
              {children}
            </List>
          )
        }),
      }),
      [maxWidth]
    )

  return (
    <Virtuoso
      ref={virtuosoRef}
      style={{
        height: 'calc(100vh - 100px)',
      }}
      components={virtuosoComponents}
      followOutput={true}
      initialTopMostItemIndex={messages.length - 1}
      totalCount={messages.length}
      overscan={{
        main: 3200,
        reverse: 3200,
      }}
      itemContent={(index) => {
        const isLast = index === messages.length - 1
        const message = messages[index]

        const item = (
          <ChatMessageItem
            key={message.id}
            message={message}
            onRegenerate={handleRegenerateMessage}
            onStopGenerate={stopGenerateMessage}
            onUpdateMessage={updateMessage}
            onDeleteMessage={deleteMessage}
          />
        )

        if (isLast) {
          return (
            <ObserveMessageChange
              message={message}
              onScrollToBottom={handleScrollToButtom}
            >
              {item}
            </ObserveMessageChange>
          )
        }

        return item
      }}
    />
  )
}
