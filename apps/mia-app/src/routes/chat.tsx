import { Box } from '@mui/material'

import { ChatPanel } from '../components/ChatPanel'
import { useChatStore } from '../stores/chat'
import BaseAppBar from '../components/BaseAppBar'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useSnackbar } from 'notistack'

export function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>()
  // you should call dervied function in useStore, otherwise it will not be tracked
  const chat = useChatStore((s) => s.getChat(chatId || ''))

  if (!chat) {
    return <Navigate to="/chats" />
  }

  return (
    <Box>
      <BaseAppBar title={chat && chat.name} />
      {chat && <ChatPanel chat={chat} />}
    </Box>
  )
}
