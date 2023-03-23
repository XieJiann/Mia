import { Add as AddIcon } from '@mui/icons-material'
import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import BaseAppBar from '../components/BaseAppBar'
import { useChatStore } from '../stores/chat'
import React from 'react'
import ChatListItem from '../components/chat/ChatListItem'

export default function ChatListPage() {
  const [createChat, deleteChat, updateChat] = useChatStore((s) => [
    s.createChat,
    s.deleteChat,
    s.updateChat,
  ])

  const sortedChats = useChatStore((s) =>
    s.listChats({ orderBy: 'created_at', order: 'desc' })
  )

  const navigate = useNavigate()

  const handleCreateChat = () => {
    createChat({})
  }

  const handleSelectChat = (id: string) => {
    navigate(`/chats/${id}`)
  }

  return (
    <Box>
      <BaseAppBar title="Chat List" />

      <Box>
        <List
          sx={{
            height: '100%',
            overflowY: 'scroll',
          }}
        >
          <ListItem key="action-add-chat">
            <ListItemButton onClick={handleCreateChat}>
              <ListItemIcon>
                <AddIcon />
              </ListItemIcon>
              <ListItemText primary={'Add Chat'} />
            </ListItemButton>
          </ListItem>
          {sortedChats.data.map((chat) => (
            <React.Fragment key={chat.id}>
              <Divider component="li" />
              <ChatListItem
                chat={chat}
                onSelectChat={handleSelectChat}
                onDeleteChat={deleteChat}
                onUpdateChat={updateChat}
              />
            </React.Fragment>
          ))}
        </List>
      </Box>
    </Box>
  )
}
