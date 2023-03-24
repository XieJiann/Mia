import {
  Close,
  Preview,
  Visibility,
  VisibilityOutlined,
  ZoomIn,
  ZoomOut,
} from '@mui/icons-material'
import { Box, IconButton, Stack } from '@mui/material'
import Image from 'rc-image'
import 'rc-image/assets/index.css'
import React from 'react'

export interface PreviewImageProps {
  src?: string
  style?: React.CSSProperties
}

const iconButtonStyle = { color: '#f7f7fa' }

export default function PreviewImage({ src, style }: PreviewImageProps) {
  return (
    <Image
      src={src}
      style={style}
      preview={{
        mask: (
          <Stack alignItems="center">
            <VisibilityOutlined />
            Preview
          </Stack>
        ),
        icons: {
          close: (
            <IconButton style={iconButtonStyle}>
              <Close />
            </IconButton>
          ),
          zoomIn: (
            <IconButton style={iconButtonStyle}>
              <ZoomIn />
            </IconButton>
          ),
          zoomOut: (
            <IconButton style={iconButtonStyle}>
              <ZoomOut />
            </IconButton>
          ),
        },
      }}
    />
  )
}
