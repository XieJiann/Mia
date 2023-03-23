import * as icons from '@mui/icons-material'
import { Box, Button, SxProps } from '@mui/material'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

// Source is from https://github.com/ztjhz/ChatGPTFreeApp/blob/HEAD/src/components/Chat/ChatContent/Message/MessageContent.tsx
const ChatMessageContentViewImpl = React.memo(
  ({ content }: { content: string }) => {
    const [codeCopied, setCodeCopied] = useState<boolean>(false)
    return (
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[[rehypeKatex, { output: 'mathml' }]]}
        components={{
          img({ node, ...props }) {
            return (
              <img
                {...props}
                style={{
                  objectFit: 'cover',
                  maxWidth: '100%',
                  maxHeight: '200px',
                }}
              />
            )
          },
          // code({ node, inline, className, children, ...props }) )
          code({ node, inline, className, children, ...props }) {
            if (inline)
              return (
                <Box component="code" sx={{ overflowX: 'auto' }}>
                  {children}
                </Box>
              )
            let highlight

            const match = /language-(\w+)/.exec(className || '')
            const lang = match && match[1]
            // @see https://github.com/highlightjs/highlight.js/issues/2337
            if (lang && hljs.getLanguage(lang)) {
              highlight = hljs.highlight(children.toString(), {
                language: lang,
              })
            } else {
              highlight = hljs.highlightAuto(children.toString())
            }

            return (
              <Box sx={{ borderRadius: '8px' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: 'gray',
                    padding: '4px 16px',
                    fontSize: '14px',
                  }}
                >
                  <Box component="span">{highlight.language}</Box>
                  <Button
                    sx={{ fontSize: '12px' }}
                    onClick={() => {
                      navigator.clipboard
                        .writeText(children.toString())
                        .then(() => {
                          setCodeCopied(true)
                          setTimeout(() => setCodeCopied(false), 3000)
                        })
                    }}
                  >
                    {codeCopied ? (
                      <>
                        <icons.Done />
                        Copied!
                      </>
                    ) : (
                      <>
                        <icons.CopyAll />
                        Copy code
                      </>
                    )}
                  </Button>
                </Box>
                <Box
                  sx={{
                    padding: '8px 8px',
                    overflowY: 'auto',
                    border: '0px dashed gray',
                    borderTopWidth: '1px',
                    borderBottomWidth: '1px',
                    marginBottom: '6px',
                  }}
                >
                  <Box
                    component="div"
                    sx={{ whiteSpace: 'pre !important' }}
                    className={`hljs language-${highlight.language}`}
                  >
                    <Box
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(highlight.value, {
                          USE_PROFILES: { html: true },
                        }),
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            )
          },
          p({ className, children, ...props }) {
            return <p className="whitespace-pre-wrap">{children}</p>
          },
        }}
      >
        {content}
      </ReactMarkdown>
    )
  }
)

export default function ChatMessageContentView({
  content,
  sx,
}: {
  content: string
  sx?: SxProps
}) {
  return (
    <Box sx={sx}>
      <ChatMessageContentViewImpl content={content} />
    </Box>
  )
}
