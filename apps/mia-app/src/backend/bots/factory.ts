import { BotInitParams, IBotService } from '.'
import { OpenAIClient } from '../../api'
import { Result } from '../../types'
import { Constants, models } from '../service'

import { OpenaiChatBot, OpenaiImageBot } from './openai'

export function createBotService(p: {
  bot: models.Bot
  openaiClient: OpenAIClient
}): Result<IBotService> {
  const { bot, openaiClient } = p

  const initParams: BotInitParams = {
    botId: bot.id,
    botName: bot.name,
    template: bot.botTemplate,
    templateParams: bot.botTemplateParams,
  }
  switch (bot.botTemplate.id) {
    case Constants.BotTemplateOpenaiChat:
      return { ok: true, value: new OpenaiChatBot(initParams, openaiClient) }
    case Constants.BotTemplateOpenaiImage:
      return { ok: true, value: new OpenaiImageBot(initParams, openaiClient) }
  }

  return {
    ok: false,
    error: new Error(`Bot template ${bot.botTemplate.id} not supported`),
  }
}
