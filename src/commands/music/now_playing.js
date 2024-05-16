import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { player } from "../../index.js";

export const data = new SlashCommandBuilder()
    .setName("now_playing")
    .setDescription("Sprawdź co jest teraz odtwarzane");

/**
 *
 * @param {import("discord.js").CommandInteraction} interaction
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

    const embed = new EmbedBuilder()
        .setColor(
            /** @type {import("discord.js").ColorResolvable} */ (
                "#" + Math.floor(Math.random() * 16777215).toString(16)
            ),
        )
        // @ts-expect-error
        .setTitle(`${queue.currentTrack.title} | ${queue.currentTrack.author}`)
        // @ts-expect-error
        .setURL(queue.currentTrack.url)
        .setAuthor({
            name: interaction.user.username,
            // @ts-expect-error
            iconURL: interaction.user.avatarURL(),
        })
        // @ts-expect-error
        .setImage(queue.currentTrack.thumbnail)
        // @ts-expect-error
        .setDescription(`**Długość:** ${queue.currentTrack.duration}`);

    interaction.editReply({ embeds: [embed] });
}
