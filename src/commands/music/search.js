import { QueryType } from "discord-player";
import fs from "fs";
import { player } from "../../index.js";
import { repeatingDigitsText } from "../../lib/types.js";
import {
    EmbedBuilder,
    SlashCommandBuilder,
    SlashCommandStringOption,
    TextChannel,
} from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("search")
    .setDescription("Wyszukaj piosenkę")
    .addStringOption(
        new SlashCommandStringOption()
            .setName("name")
            .setDescription("co wyszukać")
            .setRequired(true),
    );

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

    const search = interaction.options.getString("name");
    // @ts-expect-error
    const res = await player.search(search, {
        requestedBy: interaction.user.username,
        searchEngine: QueryType.AUTO,
    });

    console.log(res);

    if (!res || !res.tracks.length) {
        interaction.editReply("Nic nie znaleziono");
        return;
    }

    // let queue = player.getQueue(interaction.guildId);
    // if (!queue)
    // 	queue = player.createQueue(interaction.guild, { metadata: true });

    const desc = "Masz 15 sekund na wybór\n\n";
    let songsDesc = "";
    let i = 1;
    for (const track of res.tracks) {
        songsDesc += `**${i}.** ${track.title} **|** ${track.author}\n`;
        i++;
        if (i == 11) break;
    }

    let embed = new EmbedBuilder()
        .setColor(
            /** @type {import("discord.js").ColorResolvable} */ (
                "#" + Math.floor(Math.random() * 16777215).toString(16)
            ),
        )
        .setTitle("Wyniki wyszukiwania")
        .setDescription(desc + songsDesc)
        .setAuthor({
            name: interaction.user.username,
            // @ts-expect-error
            iconURL: interaction.user.avatarURL(),
        });

    const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
    const msg = await interaction.editReply({ embeds: [embed] });
    const message = /** @type {import("discord.js").TextChannel} */ (
        interaction.client.channels.cache.get(interaction.channelId)
    ).messages.cache.get(msg.id);

    /** @type {import("../../../types.js").IMusicInfo} */
    const musicInfo = JSON.parse(fs.readFileSync("./data/music.json", "utf-8"));
    // @ts-expect-error
    if (!(interaction.guildId in musicInfo)) {
        // @ts-expect-error
        musicInfo[interaction.guildId] = {
            volume: 100,
        };

        fs.writeFileSync("./data/music.json", JSON.stringify(musicInfo));
    }

    for (let j = 1; j < i; j++)
        // @ts-expect-error
        message
            .react(repeatingDigitsText[j])
            .catch((error) => console.log(error));

    // @ts-expect-error
    const collector = message.createReactionCollector({
        time: 15000,
        filter: (reaction, reactionUser) =>
            reactionUser.id === interaction.user.id &&
            // @ts-expect-error
            emojis.includes(reaction.emoji.name),
        max: 1,
    });

    collector.on("collect", async (reaction, reactionUser) => {
        // @ts-expect-error
        const number = emojis.indexOf(reaction.emoji.name);
        collector.stop();

        // @ts-expect-error
        let queue = player.queues.get(interaction.guildId);
        if (!queue)
            // @ts-expect-error
            queue = player.queues.create(interaction.guild, { metadata: true });

        try {
            if (!queue.connection)
                // @ts-expect-error
                await queue.connect(user.voice.channel);
        } catch (error) {
            // @ts-expect-error
            player.queues.delete(interaction.guildId);
            interaction.editReply("Nie można dołączyć do VC");
            console.error(error);
            return;
        }

        queue.addTrack(res.tracks[number]);
        if (!queue.isPlaying())
            queue.node.play().then(() =>
                // @ts-expect-error
                queue.node.setVolume(musicInfo[interaction.guildId].volume),
            );

        embed = new EmbedBuilder()
            .setColor(
                /** @type {import("discord.js").ColorResolvable} */ (
                    "#" + Math.floor(Math.random() * 16777215).toString(16)
                ),
            )
            .setTitle(res.tracks[number].title)
            .setURL(res.tracks[number].url)
            .setDescription(
                `Dodano film do kolejki (${res.tracks[number].duration})`,
            )
            .setImage(res.tracks[number].thumbnail)
            .setAuthor({
                name: interaction.user.username,
                // @ts-expect-error
                iconURL: interaction.user.avatarURL(),
            });

        // @ts-expect-error
        message.reactions.removeAll();
        interaction.editReply({ embeds: [embed] });
    });

    collector.on("end", async (collected, reason) => {
        if (reason == "time") {
            embed = new EmbedBuilder()
                .setColor(
                    /** @type {import("discord.js").ColorResolvable} */ (
                        "#" + Math.floor(Math.random() * 16777215).toString(16)
                    ),
                )
                .setTitle("Wyniki wyszukiwania")
                .setDescription("Nie zdążyłeś wybrać")
                .setAuthor({
                    name: interaction.user.username,
                    // @ts-expect-error
                    iconURL: interaction.user.avatarURL(),
                });

            // @ts-expect-error
            message.reactions.removeAll();
            interaction.editReply({ embeds: [embed] });
        } else if (reason != "user") {
            console.error(`Weird collector end: ${reason}`);
        }
    });
}
