import { SlashCommandBuilder } from "discord.js";
import { player } from "../../index.js";

export const data = new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Opuść kanał głosowy i usuń kolejkę");

/**
 *
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 * @returns
 */
export async function execute(interaction) {
    await interaction.deferReply();

    // @ts-expect-error
    const guild = interaction.client.guilds.cache.get(interaction.guild.id);
    // @ts-expect-error
    const user = guild.members.cache.get(interaction.user.id);

    // @ts-expect-error
    if (!user.voice.channel) {
        interaction.editReply("Nie jesteś na VC");
        return;
    }

    // @ts-expect-error
    const queue = player.queues.get(interaction.guild.id);
    if (!queue) {
        interaction.editReply("Kolejka nie istnieje");
        return;
    }

    queue.delete();
    interaction.editReply("Usunięto kolejkę");
}
