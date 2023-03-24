import { Box } from '@mui/material'
import { useMemoizedFn } from 'ahooks'
import * as chat_t from '../../stores/chat'
import { useChatStore } from '../../stores/chat'
import { shallow } from '../../stores'
import { useSnackbar } from 'notistack'
import { formatErrorUserFriendly } from '../../utils'
import ChatInputBar from './ChatInputBar'

import { useMemo } from 'react'
import ChatMessageList from './ChatMessageList'

export function ChatPanel(props: { chat: chat_t.Chat }) {
  const { chat } = props

  const [sendChatMessage] = useChatStore((s) => [s.sendNewMessage], shallow)

  const handleSendMessage = useMemoizedFn(async (p: { content: string }) => {
    const res = await sendChatMessage({
      chatId: chat.id,
      ...p,
    })
    return res
  })

  const chatMessages = useMemo(() => chat.messages, [chat.messages])

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
        <ChatMessageList
          messages={chatMessages}
        />
      </Box>

      {/* Input bar */}
      <Box sx={{ position: 'absolute', bottom: 0, width: '100%' }}>
        <ChatInputBar onSendMessage={handleSendMessage} />
      </Box>
    </Box>
  )
}
