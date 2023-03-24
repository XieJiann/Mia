import { Box, List } from '@mui/material'
import React, { useEffect, useRef } from 'react'
import { Virtuoso, VirtuosoHandle, VirtuosoProps } from 'react-virtuoso'
import * as chat_t from '../../stores/chat'
import { shallow } from '../../stores'
import ChatMessageItem from './ChatMessageItem'
import { useMemoizedFn, useThrottleFn } from 'ahooks'
import { useSnackbar } from 'notistack'
import { formatErrorUserFriendly } from '../../utils'

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
}
export default function ChatMessageList({ messages }: ChatMessageListProps) {
  // TODO: impl to bottom button, see https://virtuoso.dev/stick-to-bottom/
  // We use followOutput=auto to scroll to bottom when totalCount changes
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

  const handleScrollToButtom = () => {
    if (virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({ index: 'LAST' })
    }
  }

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
        main: 10,
        reverse: 10,
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
            <ObserveHeight
              onHeightChanged={(height, prevHeight) => {
                // ignore first changes (when component is first mounted)
                if (prevHeight <= 0) {
                  return
                }
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
