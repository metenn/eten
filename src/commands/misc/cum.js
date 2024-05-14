import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
	.setName("cum")
	.setDescription("kiedy widze nowy filmik damonka :trolldog");

export async function execute(interaction: CommandInteraction) {
	await interaction.reply("<:cum:867794003122454539>");
}
