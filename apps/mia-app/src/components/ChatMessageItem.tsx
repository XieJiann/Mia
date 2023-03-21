import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  ListItem,
  ListItemAvatar,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import * as chat_t from '../stores/chat'

import { useState } from 'react'
import {
  Cancel as CancelIcon,
  CancelOutlined,
  CopyAllRounded as CopyAllRoundedIcon,
  Done as DoneIcon,
  EditOutlined,
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

  const renderButtons = () => {
    return (
      <Stack direction="row">
        <Tooltip title="Edit Reply">
          <IconButton size="small" color="secondary">
            <EditOutlined fontSize="inherit" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Copy Reply">
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
        </Tooltip>
      </Stack>
    )
  }

  const renderLoadingButton = () => {
    if (isLoading) {
      return (
        <Tooltip title="Stop Generate">
          <IconButton size="small" color="warning" onClick={onStopGenerate}>
            <CancelOutlined fontSize="inherit" />
          </IconButton>
        </Tooltip>
      )
    }

    return (
      <Tooltip title="Regenerate">
        <IconButton size="small" onClick={onRegenerate} color="primary">
          <RefreshIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
    )
  }

  return (
    <Box display="flex" justifyContent="space-between">
      {renderLoadingButton()}
      {!isLoading && renderButtons()}
    </Box>
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
        alignItems: 'flex-start',
        mb: '4px',
        gap: '8px',
      }}
    >
      <ListItemAvatar sx={{ minWidth: 0 }}>
        <Avatar
          sx={{
            height: '32px',
            width: '32px',
            fontSize: '16px',
            bgcolor: isUser ? 'primary.main' : 'secondary.main',
          }}
        >
          {isUser ? 'U' : 'C'}{' '}
        </Avatar>
      </ListItemAvatar>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          alignItems: isUser ? 'flex-end' : 'flex-start',
        }}
      >
        <Box component="span" lineHeight="1" fontSize="13px" color="#AAAAAA">
          {isUser ? 'User' : 'ChatGPT'}
        </Box>
        <Box display="flex" flexDirection="column" gap="2px">
          <Paper
            sx={{
              padding: '8px 16px',
              paddingBottom: '8px',
              color: isUser ? 'primary.contrastText' : 'black',
              borderRadius: '12px',
              backgroundColor: isUser ? '#1777ff' : '#ffffff',
              maxWidth: '500px',
              minWidth: '10px',
            }}
            elevation={1}
          >
            {waitingReceive ? (
              'Loading ...'
            ) : (
              <ChatMessageContentView content={message.content} />
            )}
          </Paper>
          {!isUser && (
            <>
              <ChatMessageActions
                onRegenerate={onRegenerate}
                onStopGenerate={onStopGenerate}
                message={message}
              />{' '}
            </>
          )}
        </Box>
      </Box>

      <Box width="40px" />
    </ListItem>
  )
}
