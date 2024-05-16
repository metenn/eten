import { SlashCommandBuilder } from "discord.js";
import { player } from "../../index.js";

export const data = new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Zatrzymaj/włacz aktualnie grany film/piosenkę");

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
    if (!queue || !queue.isPlaying()) {
        interaction.editReply("Nie puszczam żadnej muzyki");
        return;
    }

    if (queue.node.setPaused(/** @type {boolean} */ (queue.metadata))) {
        interaction.editReply(
            (queue.metadata ? "Zatrzymano" : "Włączono spowrotem") +
                // @ts-expect-error
                ` ${queue.currentTrack.title}`,
        );
        queue.metadata = !queue.metadata;
    } else {
        interaction.editReply("Nie można zatrzymać/puścić (sus)");
    }
}
