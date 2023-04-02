import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import { IconButton, IconButtonProps, styled } from '@mui/material'
import React from 'react'

export interface CollapseButtonProps extends IconButtonProps {
  collapsed: boolean
}
const CollpaseButton = styled(
  React.forwardRef<HTMLButtonElement, CollapseButtonProps>(
    (props: CollapseButtonProps, ref) => {
      const { collapsed, ...other } = props
      return (
        <IconButton {...other} ref={ref}>
          <ExpandMoreIcon />
        </IconButton>
      )
    }
  )
)(({ theme, collapsed }) => ({
  transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
  padding: 0,
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}))

export default CollpaseButton
