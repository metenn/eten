import { SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { askQuestion } from "../../openai/index.js";

export const data = new SlashCommandBuilder()
    .setName("gpt")
    .setDescription("Eten gpt")
    .addStringOption(
        new SlashCommandStringOption()
            .setName("message")
            .setDescription("wiadomość")
            .setRequired(true),
    );

/**
 *
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
    await interaction.deferReply();
    const response = await askQuestion(
        // @ts-expect-error
        interaction.options.getString("message"),
    );
    // @ts-expect-error
    interaction.editReply(response);
}
