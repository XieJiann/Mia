import {
  Avatar,
  Divider,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { models } from '../../backend/service'

export interface BotListItemProps {
  bot: models.BotMeta
}
export default function BotListItem({ bot }: BotListItemProps) {
  const navigate = useNavigate()

  const handleEditBot = () => {
    navigate(`/bots/${bot.id}/update`)
  }

  const renderSecondaryText = () => {
    const description = bot.description || 'no description'
    return (
      <Stack direction="row" gap={2}>
        <Typography
          sx={{ display: 'inline' }}
          component="span"
          variant="body2"
          color="text.secondary"
          width="4rem"
          noWrap
        >
          @{bot.name}
        </Typography>
        <Divider
          component="span"
          variant="fullWidth"
          orientation="vertical"
          flexItem
        />
        <Typography
          component="span"
          variant="body2"
          color={'GrayText'}
          noWrap
        >{`${description}`}</Typography>
      </Stack>
    )
  }

  return (
    <ListItem>
      <ListItemButton onClick={handleEditBot}>
        <ListItemAvatar>
          <Avatar src={bot.avatarUrl}>B</Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={bot.displayName}
          secondary={renderSecondaryText()}
          secondaryTypographyProps={{ color: 'GrayText', component: 'div' }}
        />
      </ListItemButton>
    </ListItem>
  )
}
