import { Send as SendIcon } from '@mui/icons-material'
import {
  Box,
  IconButton,
  InputBase,
  Paper,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  List,
} from '@mui/material'
import { useDebounceFn, useMemoizedFn } from 'ahooks'
import { useState } from 'react'
import * as chat_t from '../stores/chat'
import { useIsMobile } from '../hooks'
import { useChatStore } from '../stores/chat'
import { shallow } from '../stores'
import { useSnackbar } from 'notistack'
import { formatErrorUserFriendly } from '../utils'
import ScrollToBottom from 'react-scroll-to-bottom'
import ChatMessageItem from './ChatMessageItem'

export function ChatPanel(props: { chat: chat_t.Chat }) {
  const { chat } = props

  const [sendChatMessageStream, regenerateMessageStream] = useChatStore(
    (s) => [s.sendNewMessageStream, s.regenerateMessageStream],
    shallow
  )
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  const { enqueueSnackbar } = useSnackbar()

  const isMobile = useIsMobile()

  const { run: handleSendMessage } = useDebounceFn(
    async () => {
      if (text == '') {
        return
      }

      setSending(true)
      try {
        const res = await sendChatMessageStream({
          chatId: chat.id,
          content: text,
        })

        if (!res.ok) {
          enqueueSnackbar(formatErrorUserFriendly(res.error), {
            autoHideDuration: 3000,
            variant: 'error',
            anchorOrigin: {
              vertical: 'top',
              horizontal: 'center',
            },
          })
        }
      } finally {
        setSending(false)
      }

      setText('')
    },
    {
      wait: 0,
    }
  )

  const handleRegenerateMessage = useMemoizedFn(
    async (p: { messageId: string }) => {
      const resp = await regenerateMessageStream({
        chatId: chat.id,
        messageId: p.messageId,
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
      }
    }
  )

  const handleInputShortcut = useMemoizedFn(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.ctrlKey && e.key == 'Enter') {
        handleSendMessage()
      }
    }
  )

  return (
    <Box
      aria-label="chat-panel"
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
      <Box
        sx={{
          width: '100%',
          flexGrow: '1',
        }}
      >
        <ScrollToBottom initialScrollBehavior="smooth">
          {/* <ScrollToBottomButton /> */}
          <List sx={{ maxHeight: 'calc(100vh - 100px)' }}>
            {/* Workaround, use dummy div */}
            <Box sx={{ height: '80px' }}></Box>
            {chat.messages
              .filter((msg) => msg.role != 'system')
              .map((message, idx, total) => {
                return (
                  <ChatMessageItem
                    key={message.id}
                    message={message}
                    onRegenerate={() => {
                      handleRegenerateMessage({ messageId: message.id })
                    }}
                  />
                )
              })}
          </List>
        </ScrollToBottom>
      </Box>

      {/* Input bar */}
      <Box
        sx={{
          px: '12px',
          width: '100%',
          mb: isMobile ? '12px' : '24px',
        }}
      >
        <Paper
          component="form"
          sx={{
            p: '4px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <InputBase
            sx={{ ml: 1, flex: 1 }}
            placeholder="Type a message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            multiline={true}
            onKeyDown={handleInputShortcut}
            disabled={sending}
          />
          <IconButton
            onClick={handleSendMessage}
            sx={{ p: '10px' }}
            disabled={sending}
          >
            <SendIcon />
          </IconButton>
        </Paper>
      </Box>
    </Box>
  )
}
