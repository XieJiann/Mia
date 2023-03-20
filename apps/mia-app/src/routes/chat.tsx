import { Box } from '@mui/material'

import { ChatPanel } from '../components/ChatPanel'
import { Chat, useChatStore } from '../stores/chat'
import BaseAppBar from '../components/BaseAppBar'
import { Navigate, useParams } from 'react-router-dom'
import { useIsMobile } from '../hooks'

export function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>()
  // you should call dervied function in useStore, otherwise it will not be tracked
  const chat = useChatStore((s) => s.getChat(chatId || ''))

  const isMobie = useIsMobile()

  if (!chat || chat.deletedAt) {
    return <Navigate to="/chats" />
  }

  const renderChatPanel = (chat: Chat) => {
    return (
      <Box
        sx={{
          maxWidth: isMobie ? '100vw' : '60vw',
          margin: '0 auto',
        }}
      >
        <ChatPanel chat={chat} />
      </Box>
    )
  }

  return (
    <Box>
      <BaseAppBar title={chat && chat.name} />
      {chat && renderChatPanel(chat)}
    </Box>
  )
}
