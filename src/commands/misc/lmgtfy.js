import { SlashCommandBuilder, SlashCommandStringOption } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("lmgtfy")
    .setDescription("gdy ktoś nie wie co to internet")
    .addStringOption(
        new SlashCommandStringOption()
            .setName("query")
            .setDescription("zapytanie")
            .setRequired(true),
    );

/**
 *
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
    // @ts-expect-error
    const query = encodeURIComponent(interaction.options.getString("query"));
    await interaction.reply(`https://lmgt.org/?q=${query}&iie=1`);
}
