import { Box } from '@mui/material'
import * as chat_t from '../../stores/chat'
import ChatInputBar from './ChatInputBar'

import { useMemo } from 'react'
import ChatMessageList from './ChatMessageList'
import { useIsMobile } from '../../hooks'

export function ChatPanel(props: { chat: chat_t.Chat }) {
  const { chat } = props

  const chatMessages = useMemo(() => chat.messages, [chat.messages])

  const isMobile = useIsMobile()

  const maxWidth = isMobile ? '100vw' : '800px'

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
        <ChatMessageList messages={chatMessages} maxWidth={maxWidth} />
      </Box>

      {/* Input bar */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
        }}
      >
        <Box sx={{ maxWidth: maxWidth, margin: '0 auto' }}>
          <ChatInputBar chatId={chat.id} />
        </Box>
      </Box>
    </Box>
  )
}
