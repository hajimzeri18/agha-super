const { EmbedBuilder } = require('discord.js');
const Guild = require('../models/Guild');

async function sendLog(client, guildId, eventKey, embedData) {
  try {
    const settings = await Guild.findOne({ guildId });
    if (!settings) return;

    const eventConfig = settings.logs?.[eventKey];
    if (!eventConfig || !eventConfig.enabled || !eventConfig.channelId) return;

    const channel = await client.channels.fetch(eventConfig.channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor(eventConfig.color || 0x5865f2)
      .setTimestamp();

    // ───────── AUTHOR (profile style header) ─────────
    if (embedData.author?.name) {
      embed.setAuthor({
        name: String(embedData.author.name).slice(0, 256),
        iconURL: embedData.author.iconURL || null
      });
    }

    // ───────── TITLE (fallback) ─────────
    if (!embedData.author && embedData.title) {
      embed.setTitle(String(embedData.title).slice(0, 256));
    }

    // ───────── DESCRIPTION ─────────
    if (embedData.description) {
      embed.setDescription(String(embedData.description).slice(0, 4096));
    }

    // ───────── FIELDS ─────────
    if (Array.isArray(embedData.fields) && embedData.fields.length > 0) {
      embed.addFields(
        embedData.fields.map(f => ({
          name: String(f.name).slice(0, 256) || '\u200b',
          value: String(f.value).slice(0, 1024) || '\u200b',
          inline: f.inline ?? false
        }))
      );
    }

    // ───────── THUMBNAIL ─────────
    if (embedData.thumbnail) {
      embed.setThumbnail(embedData.thumbnail);
    }

    // ───────── IMAGE ─────────
    if (embedData.image) {
      embed.setImage(embedData.image);
    }

    // ───────── FOOTER ─────────
    if (embedData.footer) {
      embed.setFooter({
        text: String(embedData.footer).slice(0, 2048)
      });
    }

    await channel.send({ embeds: [embed] });

  } catch (err) {
    console.error(`[Logger] Error sending log for ${eventKey}:`, err);
  }
}

module.exports = { sendLog };
