import { Stack, Tooltip, IconButton, Box } from '@mui/material'
import { useState } from 'react'
import { models } from '../../backend/service'
import {
  CancelOutlined,
  CopyAllRounded as CopyAllRoundedIcon,
  Done as DoneIcon,
  EditOutlined,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Visibility,
  VisibilityOff,
  DeleteOutline,
} from '@mui/icons-material'
import { ChatStore } from '../../stores/chat'

export type ConfirmingActionKeys = 'edit' | 'delete'
export interface ChatMessageActionBarProps {
  message: models.ChatMessage
  onRegenerate: () => void
  onStopGenerate: () => void
  onUpdateMessage: ChatStore['updateMessage']
  confirming: boolean
  onStartConfirming: (key: ConfirmingActionKeys) => void
  onConfirm: () => void
  onCancelConfirm: () => void
}
export default function ChatMessageActionBar({
  message,
  onRegenerate,
  onStopGenerate,
  onUpdateMessage,
  confirming,
  onStartConfirming,
  onConfirm,
  onCancelConfirm,
}: ChatMessageActionBarProps) {
  const [copied, setCopied] = useState<boolean>(false)

  const isUser = message.senderType === 'user'

  const isLoading =
    message.loadingStatus === 'loading' ||
    message.loadingStatus === 'wait_first'

  const isHide = message.hiddenAt

  const toggleVisible = () => {
    onUpdateMessage(message.id, {
      toggleHide: true,
    })
  }

  const renderConfirmingButtons = () => {
    if (confirming) {
      return (
        <>
          <Tooltip title="confirm">
            <IconButton
              size="small"
              color="primary"
              aria-label="yes"
              onClick={onConfirm}
            >
              <CheckIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="cancel">
            <IconButton size="small" aria-label="no" onClick={onCancelConfirm}>
              <CloseIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </>
      )
    }

    return (
      <>
        <Tooltip title="Delete Message">
          <IconButton
            size="small"
            color="secondary"
            onClick={(e) => {
              onStartConfirming('delete')
            }}
          >
            <DeleteOutline fontSize="inherit" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit Message">
          <IconButton
            size="small"
            color="secondary"
            onClick={(e) => {
              onStartConfirming('edit')
            }}
          >
            <EditOutlined fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </>
    )
  }

  const renderButtons = () => {
    return (
      <Stack direction="row">
        <Tooltip title={isHide ? 'Unhide' : 'Hide'}>
          <IconButton size="small" onClick={toggleVisible}>
            {isHide ? (
              <Visibility fontSize="inherit" />
            ) : (
              <VisibilityOff fontSize="inherit" />
            )}
          </IconButton>
        </Tooltip>
        {renderConfirmingButtons()}
        <Tooltip title="Copy Message">
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

  const renderGenerateButton = () => {
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
      {/* Dummy box */}
      {isUser ? <Box /> : renderGenerateButton()}
      {!isLoading && renderButtons()}
    </Box>
  )
}
