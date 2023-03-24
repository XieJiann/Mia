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
import { Constants, models } from '../../backend/service'
import { useTopSnakebar } from '../../hooks/useSnakeBar'

export interface BotListItemProps {
  bot: models.BotMeta
}
export default function BotListItem({ bot }: BotListItemProps) {
  const navigate = useNavigate()

  const { enqueueSnackbar } = useTopSnakebar()

  const handleEditBot = () => {
    if (Constants.PredefinedBotIds.has(bot.id)) {
      enqueueSnackbar('Cannot edit predefined bot', { variant: 'error' })
      return
    }

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
