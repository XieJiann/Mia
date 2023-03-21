import { Send, SendOutlined } from '@mui/icons-material'
import {
  Box,
  Paper,
  IconButton,
  InputBase,
  Button,
  Tooltip,
  Fab,
} from '@mui/material'
import { useMemoizedFn } from 'ahooks'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { useIsMobile } from '../hooks'
import { Result } from '../types'
import { formatErrorUserFriendly } from '../utils'

export interface ChatInputBarProps {
  onSendMessage(p: { content: string }): Promise<Result<boolean>>
}

export function ChatInputBarMobile({}: ChatInputBarProps) {
  return <Box></Box>
}

export function ChatInputBarDesktop({ onSendMessage }: ChatInputBarProps) {
  const [text, setText] = useState('')

  const { enqueueSnackbar } = useSnackbar()

  const isMobile = useIsMobile()

  const handleSendMessage = useMemoizedFn(async () => {
    const content = text.trim()
    if (content.trim() == '') {
      return
    }

    setText('')

    const res = await onSendMessage({
      content: content,
    })

    if (!res.ok) {
      enqueueSnackbar(formatErrorUserFriendly(res.error), {
        autoHideDuration: 3000,
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      })
    }
  })

  const handleInputShortcut = useMemoizedFn(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.ctrlKey && e.key == 'Enter') {
        handleSendMessage()
      }
    }
  )

  return (
    <Box
      sx={{
        px: isMobile ? '8px' : '12px',
        mb: isMobile ? '8px' : '24px',
        width: '100%',
      }}
    >
      <Paper
        component="form"
        sx={{
          position: 'relative',
          p: '4px 8px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
        }}
        elevation={1}
      >
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="Type message (Ctrl+Enter to send)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          multiline
          minRows={1}
          onKeyDown={handleInputShortcut}
          size="medium"
        />
        <IconButton onClick={handleSendMessage} size="small" color="primary">
          <Send />
        </IconButton>
      </Paper>
    </Box>
  )
}

export default function ChatInputBar(props: ChatInputBarProps) {
  return <ChatInputBarDesktop {...props} />
}
