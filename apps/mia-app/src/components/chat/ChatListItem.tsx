import {
  Stack,
  IconButton,
  Input,
  ListItemText,
  ListItem,
  ListItemButton,
  ListItemIcon,
} from '@mui/material'
import { ChatMeta } from '../../backend/models'
import { useDoubleConfirm } from '../../hooks/useDoubleConfirm'
import { useEditable } from '../../hooks/useEditable'
import {
  Chat as ChatIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'

type ChatItemAction = 'delete' | 'edit'
export default function ChatListItem({
  chat,
  onDeleteChat,
  onSelectChat,
  onUpdateChat,
  selected = false,
}: {
  chat: ChatMeta
  onDeleteChat: (id: string) => void
  onSelectChat: (id: string) => void
  onUpdateChat: (
    id: string,
    p: {
      name?: string | undefined
    }
  ) => Promise<void>
  selected?: boolean
}) {
  const {
    editing,
    startEditing,
    finishEditing,
    cancelEditing,
    editFormValue,
    onEditFormValueChange,
  } = useEditable({
    value: chat.name,
    onValueEdited(value) {
      onUpdateChat(chat.id, { name: value })
    },
  })

  const handleConfirming = (key: ChatItemAction) => {
    if (key === 'edit') {
      startEditing()
    }
  }

  const handleConfirm = (key: ChatItemAction) => {
    if (key === 'delete') {
      onDeleteChat(chat.id)
      return
    }

    if (key === 'edit') {
      finishEditing()
    }
  }

  const handleCancelConfirm = (key: ChatItemAction) => {
    if (key === 'edit') {
      cancelEditing()
    }
  }

  const { confirming, startConfirming, confirm, cancelConfirm } =
    useDoubleConfirm<'delete' | 'edit'>({
      onConfirm: handleConfirm,
      onConfirmCanceled: handleCancelConfirm,
      onConfirming: handleConfirming,
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
          onClick={() => {
            startConfirming('edit')
          }}
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

  const renderText = () => {
    if (editing) {
      return (
        <Input
          fullWidth
          value={editFormValue}
          onChange={(e) => onEditFormValueChange(e.target.value)}
          onClick={(e) => {
            e.stopPropagation()
          }}
          onKeyUp={(e) => {
            if (e.key === 'Enter') {
              confirm()
            }
          }}
        />
      )
    }

    return (
      <ListItemText
        primary={chat.name}
        primaryTypographyProps={{ noWrap: true }}
      />
    )
  }

  return (
    <ListItem key={chat.id} secondaryAction={renderActions()}>
      <ListItemButton onClick={() => onSelectChat(chat.id)} selected={selected}>
        <ListItemIcon>
          <ChatIcon />
        </ListItemIcon>
        {renderText()}
      </ListItemButton>
    </ListItem>
  )
}
