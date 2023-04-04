import { AutoAwesome, Reply, Send, SendOutlined } from '@mui/icons-material'
import {
  Box,
  Paper,
  IconButton,
  InputBase,
  Button,
  Tooltip,
  Fab,
  Stack,
  Checkbox,
  Switch,
  FormControlLabel,
} from '@mui/material'
import { useMemoizedFn } from 'ahooks'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { useIsMobile } from '../../hooks'
import { shallow, useChatStore, useSettingsStore } from '../../stores'
import { Result } from '../../types'
import { formatErrorUserFriendly } from '../../utils'

export interface ChatInputBarProps {
  chatId: string
  onFocus?: () => void
}

export function ChatInputBarMobile({}: ChatInputBarProps) {
  return <Box></Box>
}

export function ChatInputBarDesktop({ chatId, onFocus }: ChatInputBarProps) {
  const [text, setText] = useState('')

  const { enqueueSnackbar } = useSnackbar()

  const isMobile = useIsMobile()

  const [autoReplyMessage, sendNewMessage, chatTokens] = useChatStore(
    (s) => [s.autoReplyMessage, s.sendNewMessage, s.getChatTokens({ chatId })],
    shallow
  )

  const [followOutput, toggleFollowOutput] = useSettingsStore(
    (s) => [s.ui.followOutput, s.toggleFollowOutput],
    shallow
  )

  const handleToggleFollowOutput = useMemoizedFn(() => {
    if (!followOutput) {
      onFocus?.()
    }

    toggleFollowOutput()
  })

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
      <Stack
        direction="row"
        aria-label="input-bar-actions"
        alignItems="center"
        px={1}
        gap={2}
      >
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

        <Tooltip title="follow output">
          <FormControlLabel
            control={<Checkbox size="small" />}
            label="follow"
            labelPlacement="start"
            value={followOutput}
            onChange={handleToggleFollowOutput}
          />
        </Tooltip>

        <Stack
          sx={{
            marginLeft: 'auto',
          }}
          direction="row"
          alignItems="center"
          gap={2}
        >
          <Box
            marginLeft="auto"
            component="span"
            fontStyle="italic"
            fontSize="14px"
          >
            Tokens: {chatTokens.value?.totalTokens || 0}
          </Box>
        </Stack>
      </Stack>
      <Paper
        component="form"
        sx={{
          position: 'relative',
          p: '4px 8px 4px 16px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
        elevation={1}
      >
        <InputBase
          onFocus={onFocus}
          fullWidth
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
