import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import { IconButton, IconButtonProps, styled } from '@mui/material'

export interface CollapseButtonProps extends IconButtonProps {
  collapsed: boolean
}
const CollpaseButton = styled((props: CollapseButtonProps) => {
  const { collapsed, ...other } = props
  return (
    <IconButton {...other}>
      <ExpandMoreIcon />
    </IconButton>
  )
})(({ theme, collapsed }) => ({
  transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}))

export default CollpaseButton
