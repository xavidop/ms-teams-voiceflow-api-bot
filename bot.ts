/* eslint-disable no-await-in-loop */
import { GeneralTrace, TraceType } from '@voiceflow/general-types';
import { AxiosResponse } from 'axios';
import { MessageFactory, TeamsActivityHandler, TurnContext } from 'botbuilder';
import dotenv from 'dotenv';

import DialogManagerApi from './dialog-manager-api';
import DialogManagerBody from './types';

class VoiceflowBot extends TeamsActivityHandler {
  getClient = async (ctx: TurnContext) => {
    const senderID = ctx.activity!.id!.toString();
    return DialogManagerApi.getInstance(
      process.env.VOICEFLOW_RUNTIME_ENDPOINT!,
      process.env.VOICEFLOW_API_KEY!,
      process.env.VOICEFLOW_VERSION_ID!,
      senderID
    );
  };

  response = async (ctx: TurnContext, VFctx: AxiosResponse<GeneralTrace[]>) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const trace of Object.values(VFctx)) {
      if (trace.type === TraceType.SPEAK && trace.payload.message !== '') {
        await ctx.sendActivity(MessageFactory.text(trace.payload.message));
        continue;
      }
      if (trace.type === TraceType.VISUAL && trace.payload.visualType === 'image') {
        await ctx.sendActivity(MessageFactory.contentUrl(trace.payload.image!, 'image/png'));
        continue;
      }
    }
  };

  constructor() {
    super();
    dotenv.config();

    // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
    this.onMessage(async (ctx: TurnContext, next) => {
      console.log(ctx);
      const client = await this.getClient(ctx);
      const body: DialogManagerBody = {
        request: {
          type: 'text',
          payload: ctx.activity.text,
        },
      };
      const context = await client.doInteraction(body);
      await this.response(ctx, context);

      // By calling next() you ensure that the next BotHandler is run.
      // eslint-disable-next-line callback-return
      await next();
    });
  }
}

// Create the main dialog.
const VoiceflowBotClient = new VoiceflowBot();

export default VoiceflowBotClient;
