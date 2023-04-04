import { Box, List } from '@mui/material'
import React, { useEffect, useRef } from 'react'
import { Virtuoso, VirtuosoHandle, VirtuosoProps } from 'react-virtuoso'
import * as chat_t from '../../stores/chat'
import { shallow } from '../../stores'
import ChatMessageItem from './ChatMessageItem'
import { useCreation, useMemoizedFn, useThrottleFn } from 'ahooks'
import { useSnackbar } from 'notistack'
import { formatErrorUserFriendly } from '../../utils'
import ChatInputBar from './ChatInputBar'
import { useIsMobile } from '../../hooks'

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

  const handleHeightChanged = useMemoizedFn(onHeightChanged)

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
  chat: chat_t.Chat
}
export default function ChatPanel({ chat }: ChatMessageListProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const isMobile = useIsMobile()
  const { enqueueSnackbar } = useSnackbar()

  const { run: handleScrollToButtom } = useThrottleFn(
    () => {
      const virtuoso = virtuosoRef.current

      if (virtuoso) {
        virtuoso.scrollToIndex({
          index: 'LAST',
          align: 'start',
          behavior: 'smooth',
        })
      }
    },
    { wait: 200 }
  )

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

  const maxWidth = isMobile ? '100vw' : '800px'

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

  const { messages } = chat

  // have one dummy box
  const totalCount = messages.length + 1

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        flexDirection: 'column',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
      }}
    >
      {/* Message List */}
      <Virtuoso
        ref={virtuosoRef}
        style={{
          height: 'calc(100vh - 100px)',
        }}
        components={virtuosoComponents}
        followOutput={'auto'}
        initialTopMostItemIndex={totalCount - 1}
        totalCount={totalCount}
        overscan={{
          main: 1600,
          reverse: 1600,
        }}
        itemContent={(index) => {
          // dummy box, workaround for scroll to bottom
          if (index === totalCount - 1) {
            return <Box style={{ height: '10px' }}></Box>
          }

          const isLastMessage = index === messages.length - 1
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

          if (isLastMessage) {
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

      {/* Input bar */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
        }}
      >
        <Box sx={{ maxWidth: maxWidth, margin: '0 auto' }}>
          <ChatInputBar chatId={chat.id} onFocus={handleScrollToButtom} />
        </Box>
      </Box>
    </Box>
  )
}
