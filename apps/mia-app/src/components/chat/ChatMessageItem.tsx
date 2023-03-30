import {
  Avatar,
  Box,
  Collapse,
  Input,
  ListItem,
  ListItemAvatar,
  Paper,
  Stack,
} from '@mui/material'
import * as chat_t from '../../stores/chat'

import ChatMessageContentView from './ChatMessageContentView'
import ChatMessageActionBar, {
  ConfirmingActionKeys,
} from './ChatMessageActionBar'
import { useEditable } from '../../hooks/useEditable'
import { useDoubleConfirm } from '../../hooks/useDoubleConfirm'
import { models } from '../../backend/service'
import React from 'react'

function sublines(s: string, line: number) {
  const parts = s.split('\n', line)
  return parts.slice(0, -1).join('\n')
}

export interface ChatMessageItemProps {
  message: models.ChatMessage
  onRegenerate: chat_t.ChatStore['regenerateMessage']
  onStopGenerate: chat_t.ChatStore['stopGenerateMessage']
  onUpdateMessage: chat_t.ChatStore['updateMessage']
  onDeleteMessage: chat_t.ChatStore['deleteMessage']
}
const ChatMessageItem = React.memo(
  ({
    message,
    onRegenerate,
    onStopGenerate,
    onUpdateMessage,
    onDeleteMessage,
  }: ChatMessageItemProps) => {
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
            return
          }

          if (key === 'delete') {
            onDeleteMessage({
              chatId: message.chat.id,
              messageId: message.id,
            })
            return
          }
        },
        onConfirmCanceled(key) {
          if (key === 'edit') {
            cancelEditing()
            return
          }
        },
        onConfirming(key) {
          if (key === 'edit') {
            startEditing()
            return
          }
        },
      })

    const waitingReceive = message.loadingStatus === 'wait_first'
    const isUser = message.senderType == 'user'
    const isHide = !!message.ignoreAt
    const isCollapsed = message.ui.collapsed
    const sender = message.sender

    const renderAvatar = () => {
      const avatarSx = {
        height: '32px',
        width: '32px',
        fontSize: '16px',
        backgroundColor: isUser ? 'primary.main' : undefined,
      }
      if (sender && sender.avatarUrl) {
        return <Avatar sx={avatarSx} src={sender.avatarUrl} />
      }

      return <Avatar sx={avatarSx}>{isUser ? 'U' : 'C'} </Avatar>
    }

    const renderContent = () => {
      // console.log(message.id, { content: message.content })
      // We use display none rather than `if` to avoid the ui bug
      return (
        <Collapse in={!isCollapsed} timeout="auto">
          <Input
            multiline
            fullWidth
            sx={{
              display: !editing ? 'none' : undefined,
              // color: isUser ? 'primary.contrastText' : 'inherit',
              color: 'inherit',
            }}
            value={editFormValue}
            onChange={(e) => onEditFormValueChange(e.target.value)}
            onClick={(e) => {
              e.stopPropagation()
            }}
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === 'Enter') {
                confirm()
              }
            }}
          />
          <ChatMessageContentView
            content={message.content}
            sx={{
              // use this to expand the width of chat message
              visibility: isCollapsed || editing ? 'hidden' : undefined,
              height: editing ? '0px' : undefined,
            }}
          />
        </Collapse>
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
            <Box
              component="span"
              lineHeight="1"
              fontSize="13px"
              color="#AAAAAA"
            >
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
                // color: isUser ? 'primary.contrastText' : 'black',
                borderRadius: '12px',
                // backgroundColor: isUser ? '#1777ff' : '#ffffff',
                backgroundColor: isUser ? '#95ec69' : '#ffffff',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: 'calc(min(80vw, 500px))',
                width: 'fit-content',
                minWidth: '10px',
                minHeight: '40px',
              }}
              elevation={isUser ? 0 : 1}
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
)

export default ChatMessageItem
