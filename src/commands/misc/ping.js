import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check if the bot is alive and get response time");

/**
 *
 * @param {import("discord.js").CommandInteraction} interaction
 */
export async function execute(interaction) {
    await interaction.reply("Pinging...");
    await interaction.editReply(`Ping: \`${interaction.client.ws.ping}ms\``);
}
