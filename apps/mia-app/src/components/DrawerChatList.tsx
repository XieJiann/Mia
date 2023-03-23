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
  Tooltip,
  Stack,
  Button,
} from '@mui/material'
import { useMemoizedFn } from 'ahooks'
import { useNavigate } from 'react-router-dom'
import { useCurrentChatId } from '../hooks'
import { shallow } from '../stores'
import { useChatStore } from '../stores/chat'
import ChatListItem from './chat/ChatListItem'

export function DrawerChatList() {
  const [createChat, deleteChat, updateChat] = useChatStore(
    (s) => [s.createChat, s.deleteChat, s.updateChat],
    shallow
  )

  const currentChatId = useCurrentChatId()
  const navigate = useNavigate()
  const sortedChats = useChatStore((s) =>
    s.listChats({ orderBy: 'updated_at', order: 'desc' })
  )

  const handleCreateChat = useMemoizedFn(async () => {
    const chat = await createChat({})

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
      <Stack paddingY={2} paddingX={4} direction="row" alignItems="center">
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Chats
        </Typography>
        <Button onClick={handleCreateChat}>
          <AddIcon />
          Add Chat
        </Button>
      </Stack>
      <List
        sx={{
          height: '100%',
          overflowY: 'auto',
        }}
      >
        {sortedChats.data.map((chat) => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            onSelectChat={handleSelectChat}
            onDeleteChat={deleteChat}
            onUpdateChat={updateChat}
            selected={currentChatId === chat.id}
          />
        ))}
      </List>
    </Box>
  )
}
