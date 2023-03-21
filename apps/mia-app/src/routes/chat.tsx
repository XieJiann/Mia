import { Box } from '@mui/material'

import { ChatPanel } from '../components/ChatPanel'
import { Chat, useChatStore } from '../stores/chat'
import BaseAppBar from '../components/BaseAppBar'
import { Navigate, useParams } from 'react-router-dom'
import { useIsMobile } from '../hooks'

export function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>()
  // you should call dervied function in useStore, otherwise it will not be tracked
  const { value: chat, error } = useChatStore((s) => s.getChat(chatId || ''))

  const isMobie = useIsMobile()

  if (error || (chat && chat.deletedAt != null)) {
    return <Navigate to="/chats" />
  }

  const renderChatPanel = (chat: Chat) => {
    return (
      <Box
        sx={{
          position: 'relative',
          maxWidth: isMobie ? '100vw' : '800px',
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
