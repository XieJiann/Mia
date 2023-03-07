import {
  Add as AddIcon,
  Chat as ChatIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material'
import {
  Box,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import BaseAppBar from '../components/BaseAppBar'
import { Chat, useChatStore } from '../stores/chat'
import { FixedSizeList, ListChildComponentProps } from 'react-window'
import { shallow } from 'zustand/shallow'
import { useState } from 'react'
import { useDoubleConfirm } from '../hooks/confirm'

type ChatItemAction = 'delete' | 'edit'
function ChatListItem({
  chat,
  onDeleteChat,
  onSelectChat,
}: {
  chat: Chat
  onDeleteChat: (id: string) => void
  onSelectChat: (id: string) => void
}) {
  const handleConfirm = (key: ChatItemAction) => {
    if (key === 'delete') {
      onDeleteChat(chat.id)
      return
    }

    if (key === 'edit') {
    }
  }

  const handleCancelConfirm = (key: ChatItemAction) => {}

  const { confirming, startConfirming, confirm, cancelConfirm } =
    useDoubleConfirm<'delete' | 'edit'>({
      onConfirm: handleConfirm,
      onConfirmCanceled: handleCancelConfirm,
    })

  const renderActions = () => {
    if (confirming) {
      return (
        <Stack direction="row" gap="16px">
          <IconButton edge="end" aria-label="yes" onClick={confirm}>
            <CheckIcon />
          </IconButton>
          <IconButton edge="end" aria-label="no" onClick={cancelConfirm}>
            <CloseIcon />
          </IconButton>
        </Stack>
      )
    }
    return (
      <Stack direction="row" gap="16px">
        <IconButton
          edge="end"
          aria-label="edit"
          onClick={() => startConfirming('edit')}
        >
          <EditIcon />
        </IconButton>

        <IconButton
          edge="end"
          aria-label="delete"
          onClick={() => startConfirming('delete')}
        >
          <DeleteIcon />
        </IconButton>
      </Stack>
    )
  }

  return (
    <ListItem key={chat.id} secondaryAction={renderActions()}>
      <ListItemButton onClick={() => onSelectChat(chat.id)}>
        <ListItemIcon>
          <ChatIcon />
        </ListItemIcon>
        <ListItemText primary={chat.name} />
      </ListItemButton>
    </ListItem>
  )
}

export default function ChatListPage() {
  const [createChat, deleteChat, updateChat, getRandomCharacter] = useChatStore(
    (s) => [s.createChat, s.deleteChat, s.updateChat, s.getRandomCharacter]
  )

  const sortedChats = useChatStore((s) => s.listChats({ sortBy: 'updatedAt' }))

  const navigate = useNavigate()

  const handleCreateChat = () => {
    const character = getRandomCharacter()
    createChat({ character })
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
          <ListItem>
            <ListItemButton onClick={handleCreateChat}>
              <ListItemIcon>
                <AddIcon />
              </ListItemIcon>
              <ListItemText primary={'Add Chat'} />
            </ListItemButton>
          </ListItem>
          {sortedChats.map((chat) => (
            <>
              <Divider key={`div-${chat.id}`} component="li" />
              <ChatListItem
                chat={chat}
                onSelectChat={handleSelectChat}
                onDeleteChat={deleteChat}
              />
            </>
          ))}
        </List>
      </Box>
    </Box>
  )
}
