import {
  Add as AddIcon,
  Chat as ChatIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import {
  List,
  ListItem,
  Typography,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Box,
  IconButton,
} from '@mui/material'
import { useMemoizedFn } from 'ahooks'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { shallow } from '../stores'
import { useChatStore } from '../stores/chat'

export function DrawerChatList() {
  const [
    chats,
    currentChatId,
    setCurrentChatId,
    getRandomCharacter,
    createChat,
    deleteChat,
  ] = useChatStore(
    (s) => [
      s.chats,
      s.currentChatId,
      s.setCurrentChatId,
      s.getRandomCharacter,
      s.createChat,
      s.deleteChat,
    ],
    shallow
  )

  const sortedChats = useMemo(() => {
    const sortedChats = [...chats]
    return sortedChats.reverse()
  }, [chats])

  const navigate = useNavigate()

  const handleCreateChat = useMemoizedFn(() => {
    const chara = getRandomCharacter()
    const chat = createChat({
      character: chara,
    })

    navigate(`/chats/${chat.id}`, { replace: false })
  })

  const handleSelectChat = useMemoizedFn((id: string) => {
    navigate(`/chats/${id}`, { replace: false })
  })

  return (
    <Box
      component="nav"
      display="flex"
      flexDirection="column"
      alignItems="stretch"
      height="100%"
    >
      <Box paddingY={2} paddingX={4}>
        <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
          Chats
        </Typography>
      </Box>
      <List
        sx={{
          height: '100%',
          overflowY: 'scroll',
        }}
      >
        <ListItem disablePadding>
          <ListItemButton onClick={handleCreateChat}>
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>
            <ListItemText primary={'Add Chat'} />
          </ListItemButton>
        </ListItem>
        {sortedChats.map((chat) => (
          <ListItem
            key={chat.id}
            secondaryAction={
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => deleteChat(chat.id)}
              >
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemButton
              onClick={() => handleSelectChat(chat.id)}
              selected={chat.id == currentChatId}
            >
              <ListItemIcon>
                <ChatIcon />
              </ListItemIcon>
              <ListItemText primary={chat.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )
}
