import {
  AutoAwesome,
  Autorenew,
  Reply,
  Send,
  SendOutlined,
} from '@mui/icons-material'
import {
  Box,
  Paper,
  IconButton,
  InputBase,
  Button,
  Tooltip,
  Fab,
  Stack,
} from '@mui/material'
import { useMemoizedFn } from 'ahooks'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { useIsMobile } from '../../hooks'
import { shallow, useChatStore } from '../../stores'
import { Result } from '../../types'
import { formatErrorUserFriendly } from '../../utils'

export interface ChatInputBarProps {
  chatId: string
}

export function ChatInputBarMobile({}: ChatInputBarProps) {
  return <Box></Box>
}

export function ChatInputBarDesktop({ chatId }: ChatInputBarProps) {
  const [text, setText] = useState('')

  const { enqueueSnackbar } = useSnackbar()

  const isMobile = useIsMobile()

  const [autoReplyMessage, sendNewMessage] = useChatStore(
    (s) => [s.autoReplyMessage, s.sendNewMessage],
    shallow
  )

  const handleSendMessage = useMemoizedFn(async () => {
    const content = text.trim()
    if (content.trim() == '') {
      return
    }

    setText('')

    const res = await sendNewMessage({
      chatId,
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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: '4px',
        px: isMobile ? '8px' : '12px',
        mb: isMobile ? '8px' : '24px',
        width: '100%',
      }}
    >
      <Stack direction="row" aria-label="input-bar-actions" px={1}>
        <Tooltip title="Auto Reply">
          <IconButton
            size="medium"
            color="primary"
            onClick={() => {
              autoReplyMessage({ chatId: chatId })
            }}
          >
            <AutoAwesome fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </Stack>
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
