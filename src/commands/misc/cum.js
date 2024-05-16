import { CommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("cum")
    .setDescription("kiedy widze nowy filmik damonka :trolldog");

/**
 *
 * @param {CommandInteraction} interaction
 */
export async function execute(interaction) {
    await interaction.reply("<:cum:867794003122454539>");
}
