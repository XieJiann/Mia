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
import { Chat, ChatMeta, useChatStore } from '../stores/chat'
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
  chat: ChatMeta
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

  const { confirmingKey, confirming, startConfirming, confirm, cancelConfirm } =
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
    <ListItem secondaryAction={renderActions()}>
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
  const [createChat, deleteChat, updateChat] = useChatStore((s) => [
    s.createChat,
    s.deleteChat,
    s.updateChat,
  ])

  const sortedChats = useChatStore((s) =>
    s.listChats({ orderBy: 'updated_at' })
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
          <ListItem>
            <ListItemButton onClick={handleCreateChat}>
              <ListItemIcon>
                <AddIcon />
              </ListItemIcon>
              <ListItemText primary={'Add Chat'} />
            </ListItemButton>
          </ListItem>
          {sortedChats.data.map((chat) => (
            <>
              <Divider key={`div-${chat.id}`} component="li" />
              <ChatListItem
                key={chat.id}
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
