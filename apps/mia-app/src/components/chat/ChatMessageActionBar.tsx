import {
  Stack,
  Tooltip,
  Box,
  SxProps,
  Theme,
  IconButton,
  IconButtonProps,
} from '@mui/material'
import React, { useState } from 'react'
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
import CollpaseButton from '../forms/CollapseButton'

const ActionButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (props, ref) => {
    return <IconButton ref={ref} size="small" sx={{ padding: 0 }} {...props} />
  }
)

export type ConfirmingActionKeys = 'edit' | 'delete'
export interface ChatMessageActionBarProps {
  message: models.ChatMessage
  onRegenerate: ChatStore['regenerateMessage']
  onStopGenerate: ChatStore['stopGenerateMessage']
  onUpdateMessage: ChatStore['updateMessage']
  confirming: boolean
  onStartConfirming: (key: ConfirmingActionKeys) => void
  onConfirm: () => void
  onCancelConfirm: () => void
  sx?: SxProps<Theme>
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
  sx,
}: ChatMessageActionBarProps) {
  const [copied, setCopied] = useState<boolean>(false)

  const isUser = message.senderType === 'user'

  const isLoading =
    message.loadingStatus === 'loading' ||
    message.loadingStatus === 'wait_first'

  const isIgnored = message.ignoreAt
  const isCollapsed = message.ui.collapsed

  const isVisible = isCollapsed || confirming || isLoading

  const toggleIgnore = () => {
    onUpdateMessage({
      chatId: message.chat.id,
      messageId: message.id,
      toggleIgnore: true,
    })
  }

  const toggleCollapse = () => {
    onUpdateMessage({
      chatId: message.chat.id,
      messageId: message.id,
      toggleCollapse: true,
    })
  }

  const renderConfirmingButtons = () => {
    if (confirming) {
      return (
        <>
          <Tooltip title="confirm">
            <ActionButton size="small" aria-label="yes" onClick={onConfirm}>
              <CheckIcon fontSize="inherit" />
            </ActionButton>
          </Tooltip>
          <Tooltip title="cancel">
            <ActionButton
              size="small"
              aria-label="no"
              onClick={onCancelConfirm}
            >
              <CloseIcon fontSize="inherit" />
            </ActionButton>
          </Tooltip>
        </>
      )
    }

    return (
      <>
        <Tooltip title="Edit Message">
          <ActionButton
            size="small"
            onClick={(e) => {
              onStartConfirming('edit')
            }}
          >
            <EditOutlined fontSize="inherit" />
          </ActionButton>
        </Tooltip>
        <Tooltip title="Delete Message">
          <ActionButton
            size="small"
            onClick={(e) => {
              onStartConfirming('delete')
            }}
          >
            <DeleteOutline fontSize="inherit" />
          </ActionButton>
        </Tooltip>
      </>
    )
  }

  const renderButtons = () => {
    return (
      <Stack direction="row" gap="12px">
        <Tooltip title={isCollapsed ? 'Expand' : 'Collapse'}>
          <CollpaseButton
            size="small"
            collapsed={isCollapsed}
            onClick={toggleCollapse}
          />
        </Tooltip>
        <Tooltip title={isIgnored ? 'Unignore' : 'Ignore'}>
          <ActionButton size="small" onClick={toggleIgnore}>
            {isIgnored ? (
              <Visibility fontSize="inherit" />
            ) : (
              <VisibilityOff fontSize="inherit" />
            )}
          </ActionButton>
        </Tooltip>
        {renderConfirmingButtons()}
        <Tooltip title="Copy Message">
          <ActionButton
            size="small"
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
          </ActionButton>
        </Tooltip>
      </Stack>
    )
  }

  const renderGenerateButton = () => {
    if (isLoading) {
      return (
        <Tooltip title="Stop Generate">
          <ActionButton
            size="small"
            color="warning"
            onClick={() => onStopGenerate({ messageId: message.id })}
          >
            <CancelOutlined fontSize="inherit" />
          </ActionButton>
        </Tooltip>
      )
    }

    return (
      <Tooltip title="Regenerate">
        <ActionButton
          size="small"
          onClick={() =>
            onRegenerate({ messageId: message.id, chatId: message.chat.id })
          }
        >
          <RefreshIcon fontSize="inherit" />
        </ActionButton>
      </Tooltip>
    )
  }

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      visibility={isVisible ? 'visible' : 'hidden'}
      sx={sx}
    >
      {/* Dummy box */}
      {/* {isUser ? <Box /> : renderGenerateButton()} */}
      {renderGenerateButton()}
      {!isLoading && renderButtons()}
    </Box>
  )
}
