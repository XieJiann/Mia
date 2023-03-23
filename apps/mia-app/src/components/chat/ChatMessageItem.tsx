import {
  Avatar,
  Box,
  Input,
  ListItem,
  ListItemAvatar,
  Paper,
  Stack,
} from '@mui/material'
import * as chat_t from '../../stores/chat'

import ChatMessageContentView from './ChatMessageContentView'
import ChatMessageActionBar, {
  ChatMessageActionBarProps,
  ConfirmingActionKeys,
} from './ChatMessageActionBar'
import { useEditable } from '../../hooks/useEditable'
import { useDoubleConfirm } from '../../hooks/useDoubleConfirm'
import { models } from '../../backend/service'

export default function ChatMessageItem({
  message,
  onRegenerate,
  onStopGenerate,
  onUpdateMessage,
  onDeleteMessage,
}: {
  message: models.ChatMessage
  onRegenerate: ChatMessageActionBarProps['onRegenerate']
  onStopGenerate: ChatMessageActionBarProps['onStopGenerate']
  onUpdateMessage: chat_t.ChatStore['updateMessage']
  onDeleteMessage: chat_t.ChatStore['deleteMessage']
}) {
  const {
    editing,
    startEditing,
    finishEditing,
    cancelEditing,
    editFormValue,
    onEditFormValueChange,
  } = useEditable({
    value: message.content,
    onValueEdited(value) {
      onUpdateMessage(message.id, { content: value })
    },
  })

  const { confirming, startConfirming, confirm, cancelConfirm } =
    useDoubleConfirm<ConfirmingActionKeys>({
      onConfirm(key) {
        if (key === 'edit') {
          finishEditing()
        } else if (key === 'delete') {
          onDeleteMessage(message.id)
        }
      },
      onConfirmCanceled(key) {
        if (key === 'edit') {
          cancelEditing()
        }
      },
      onConfirming(key) {
        if (key === 'edit') {
          startEditing()
        }
      },
    })

  const waitingReceive = message.loadingStatus === 'wait_first'
  const isUser = message.senderType == 'user'
  const isHide = !!message.hiddenAt
  const sender = message.sender

  const renderAvatar = () => {
    const avatarSx = {
      height: '32px',
      width: '32px',
      fontSize: '16px',
      bgcolor: isUser ? 'primary.main' : 'secondary.main',
    }
    if (sender && sender.avatarUrl) {
      return <Avatar sx={avatarSx} src={sender.avatarUrl} />
    }

    return <Avatar sx={avatarSx}>{isUser ? 'U' : 'C'} </Avatar>
  }

  const renderContent = () => {
    // We use display none rather than if to avoid the ui bug
    return (
      <>
        <Input
          multiline
          fullWidth
          sx={{
            display: !editing ? 'none' : undefined,
            color: isUser ? 'primary.contrastText' : 'inherit',
          }}
          value={editFormValue}
          onChange={(e) => onEditFormValueChange(e.target.value)}
          onClick={(e) => {
            e.stopPropagation()
          }}
        />
        <ChatMessageContentView
          content={message.content}
          sx={{
            // use this to expand the width of chat message
            visibility: editing ? 'hidden' : undefined,
            height: editing ? '0px' : undefined,
          }}
        />
      </>
    )
  }

  const displayName = sender ? sender.displayName : isUser ? 'User' : 'Bot'

  return (
    <ListItem
      sx={{
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        mb: '4px',
        gap: '8px',
      }}
    >
      <ListItemAvatar sx={{ minWidth: 0 }}>{renderAvatar()}</ListItemAvatar>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          alignItems: 'stretch',
        }}
      >
        <Stack
          direction={isUser ? 'row-reverse' : 'row'}
          justifyContent="space-between"
        >
          <Box component="span" lineHeight="1" fontSize="13px" color="#AAAAAA">
            {displayName}
          </Box>
          <Box component="span" lineHeight="1" fontSize="13px" color="red">
            {isHide && 'Ignored'}
          </Box>
        </Stack>
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
            {waitingReceive ? 'Loading ...' : renderContent()}
          </Paper>
          <ChatMessageActionBar
            onRegenerate={onRegenerate}
            onStopGenerate={onStopGenerate}
            onUpdateMessage={onUpdateMessage}
            message={message}
            confirming={confirming}
            onConfirm={confirm}
            onCancelConfirm={cancelConfirm}
            onStartConfirming={startConfirming}
          />
        </Box>
      </Box>

      <Box width="40px" />
    </ListItem>
  )
}