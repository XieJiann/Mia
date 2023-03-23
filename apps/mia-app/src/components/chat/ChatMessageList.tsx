import { Box, List } from '@mui/material'
import { useRef } from 'react'
import { Virtuoso, VirtuosoProps } from 'react-virtuoso'
import * as chat_t from '../../stores/chat'
import { shallow } from '../../stores'
import ChatMessageItem from './ChatMessageItem'

export interface ChatMessageListProps {
  messages: chat_t.ChatMessage[]
  onRegenerateMessage: (p: { messageId: string }) => Promise<void>
}
export default function ChatMessageList({
  messages,
  onRegenerateMessage,
}: ChatMessageListProps) {
  // TODO: impl to bottom button, see https://virtuoso.dev/stick-to-bottom/
  // We use followOutput=auto to scroll to bottom when totalCount changes
  const virtuosoRef = useRef(null)

  const [stopGenerateMessage, updateMessage, deleteMessage] =
    chat_t.useChatStore(
      (s) => [s.stopGenerateMessage, s.updateMessage, s.deleteMessage],
      shallow
    )

  return (
    <Virtuoso
      ref={virtuosoRef}
      style={{
        height: 'calc(100vh - 100px)',
      }}
      components={VirtuosoComponents}
      followOutput="auto"
      totalCount={messages.length}
      itemContent={(index) => {
        const message = messages[index]
        return (
          <ChatMessageItem
            key={message.id}
            message={message}
            onRegenerate={() => {
              onRegenerateMessage({ messageId: message.id })
            }}
            onStopGenerate={() => {
              stopGenerateMessage({ messageId: message.id })
            }}
            onUpdateMessage={updateMessage}
            onDeleteMessage={deleteMessage}
          />
        )
      }}
    />
  )
}

// @see https://virtuoso.dev/material-ui-endless-scrolling/
const VirtuosoComponents: VirtuosoProps<unknown, unknown>['components'] = {
  Header: () => {
    /* Workaround, use dummy div */
    return <Box sx={{ height: '80px' }}></Box>
  },
  Footer: () => {
    /* Workaround, use dummy div */
    return <Box sx={{ height: '20px' }}></Box>
  },
}
