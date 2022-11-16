import { Telegraf } from "telegraf";
import { config } from "dotenv";
import { MessageEntity } from "telegraf/typings/core/types/typegram";
config();

const nitterLinks = process.env.NITTER_INSTANCES.trim()
  .split(/\s+/)
  .map((a) => new URL(a));

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.command("show_nitter_instances", (ctx) =>
  ctx.reply(nitterLinks.map(String).join("\n"), {
    reply_to_message_id: ctx.message.message_id,
  })
);

bot.on(["audio", "photo", "video", "document"], async (ctx) => {
  const twitterLinks = extractTwitterLinks(
    ctx.message.caption,
    ctx.message.caption_entities
  );

  const nitter = selectRandomNitter();

  for (let link of twitterLinks) {
    await ctx.reply(prepareNewLink(link, nitter), {
      reply_to_message_id: ctx.message.message_id,
    });
  }
});

bot.on("text", async (ctx) => {
  const twitterLinks = extractTwitterLinks(
    ctx.message.text,
    ctx.message.entities
  );

  const nitter = selectRandomNitter();

  for (let link of twitterLinks) {
    await ctx.reply(prepareNewLink(link, nitter), {
      reply_to_message_id: ctx.message.message_id,
    });
  }
});

bot
  .launch(
    process.env.DISABLE_WEBHOOK === "true"
      ? undefined
      : {
          webhook: {
            domain: process.env.WEBHOOK_DOMAIN,
            port: Number(process.env.WEBHOOK_PORT),
            hookPath: process.env.WEBHOOK_PATH,
          },
        }
  )
  .then(() => {
    console.log("Bot started");
  });

const rTwitterLink = /^(\w+:\/\/)?(?:mobile\.)?twitter\.com\b/i;

function extractTwitterLinks(text?: string, entities: MessageEntity[] = []) {
  return entities
    .map((entity) => {
      switch (entity.type) {
        case "url":
          return text.substring(entity.offset, entity.offset + entity.length);
        case "text_link":
          return entity.url;
        default:
          return null;
      }
    })
    .filter((link): link is string => link && rTwitterLink.test(link))
    .map((link) => new URL(link.includes("://") ? link : `https://${link}`));
}

function selectRandomNitter() {
  return nitterLinks[Math.floor(Math.random() * nitterLinks.length)];
}

function prepareNewLink(source: URL, replacement: URL) {
  const url = new URL(source);

  url.host = replacement.host;

  url.search = "";

  return url.toString();
}
