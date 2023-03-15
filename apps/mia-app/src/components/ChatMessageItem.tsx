import {
  Avatar,
  Button,
  Divider,
  IconButton,
  ListItem,
  ListItemAvatar,
  Paper,
  Stack,
} from '@mui/material'
import * as chat_t from '../stores/chat'

import { useState } from 'react'
import {
  Cancel as CancelIcon,
  CopyAllRounded as CopyAllRoundedIcon,
  Done as DoneIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import ChatMessageContentView from './ChatMessageContentView'

interface ChatMessageActionsProps {
  message: chat_t.ChatMessage
  onRegenerate: () => void
  onStopGenerate: () => void
}
function ChatMessageActions({
  message,
  onRegenerate,
  onStopGenerate,
}: ChatMessageActionsProps) {
  const [copied, setCopied] = useState<boolean>(false)

  // console.log(message)

  const isLoading =
    message.loadingStatus === 'loading' ||
    message.loadingStatus === 'wait_first'

  const renderGenerateButton = () => {
    if (isLoading) {
      return (
        <IconButton size="small" color="error" onClick={onStopGenerate}>
          <CancelIcon fontSize="inherit" />
        </IconButton>
      )
    }

    return (
      <IconButton size="small" onClick={onRegenerate} color="warning">
        <RefreshIcon fontSize="inherit" />
      </IconButton>
    )
  }

  return (
    <Stack direction="row-reverse" gap="0px" marginTop="4px">
      <IconButton
        size="small"
        color="secondary"
        onClick={async () => {
          await navigator.clipboard.writeText(message.content)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }}
      >
        {copied ? (
          <DoneIcon fontSize="inherit" />
        ) : (
          <CopyAllRoundedIcon fontSize="inherit" />
        )}
      </IconButton>

      {renderGenerateButton()}
    </Stack>
  )
}

export default function ChatMessageItem({
  message,
  onRegenerate,
  onStopGenerate,
}: {
  message: chat_t.ChatMessage
} & ChatMessageActionsProps) {
  const waitingReceive = message.loadingStatus === 'wait_first'
  const isUser = message.role == 'user'

  return (
    <ListItem
      sx={{
        flexDirection: isUser ? 'row-reverse' : 'row',
        mb: '4px',
        gap: '16px',
      }}
    >
      <ListItemAvatar sx={{ minWidth: 0 }}>
        <Avatar
          sx={{
            bgcolor: isUser ? 'primary.main' : 'secondary.main',
          }}
        >
          {isUser ? 'U' : 'C'}{' '}
        </Avatar>
      </ListItemAvatar>
      <Paper
        sx={{
          padding: '8px 16px 4px',
          color: isUser ? 'primary.contrastText' : 'black',
          borderRadius: '12px',
          backgroundColor: isUser ? '#1777ff' : '#f9f9fe',
          maxWidth: '580px',
          minWidth: '10px',
        }}
      >
        {waitingReceive ? (
          'Loading ...'
        ) : (
          <ChatMessageContentView content={message.content} />
        )}
        {!isUser && (
          <>
            <Divider sx={{ mt: '8px' }} />{' '}
            <ChatMessageActions
              onRegenerate={onRegenerate}
              onStopGenerate={onStopGenerate}
              message={message}
            />{' '}
          </>
        )}
      </Paper>
    </ListItem>
  )
}
