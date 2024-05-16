import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { player } from "../../index.js";
import { QueueRepeatMode } from "discord-player";

export const data = new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Sprawdź kolejkę");

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

    const infoEmbed = new EmbedBuilder()
        .setColor(
            /** @type {import("discord.js").ColorResolvable} */ (
                "#" + Math.floor(Math.random() * 16777215).toString(16)
            ),
        )
        .setTitle("Informacje")
        .setAuthor({
            name: interaction.user.username,
            // @ts-expect-error
            iconURL: interaction.user.avatarURL(),
        }).setDescription(`**Głośność:** ${queue.node.volume}
**Pętla:** ${queue.repeatMode == QueueRepeatMode.OFF ? "wyłączona" : queue.repeatMode == QueueRepeatMode.QUEUE ? "cała kolejka" : "tylko ten utwór"}
**Ilość piosenek w kolejce:** ${queue.tracks.size} \t**Łączna długość:** ${new Date(queue.estimatedDuration).toTimeString().split(" ")[0]}`);

    // @ts-expect-error
    let desc = `**Aktualna piosenka:** ${queue.currentTrack.title} **|** ${queue.currentTrack.author}\n\n`;

    let i = 2;
    for (const track of queue.tracks.store) {
        desc += `**${i}.** ${track.title} **|** ${track.author}\n`;
        i++;
        if (i == 11) break;
    }

    if (queue.tracks.size > 10) {
        desc += `\nI jeszcze ${queue.tracks.size - 10} więcej piosenek w kolejce...`;
    }

    const songsEmbed = new EmbedBuilder()
        .setColor(
            /** @type {import("discord.js").ColorResolvable} */ (
                "#" + Math.floor(Math.random() * 16777215).toString(16)
            ),
        )
        .setTitle("Piosenki w kolejce")
        .setDescription(desc);

    interaction.editReply({ embeds: [infoEmbed, songsEmbed] });
}
