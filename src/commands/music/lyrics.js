import { EmbedBuilder, SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { searchSong, getLyrics, LyricsError, lyricsErrorEnum } from "../../lib/lyrics.js";
import { repeatingDigitsText } from "../../lib/types.js";

export const data = new SlashCommandBuilder()
	.setName("lyrics")
	.setDescription("Znajdź tekst dla piosenki")
	.addStringOption(
		new SlashCommandStringOption()
			.setName("song")
			.setDescription("nazwa piosenki")
			.setRequired(true)
	);

/**
 * 
 * @param {import("discord.js").ChatInputCommandInteraction} interaction 
 * @returns 
 */
export async function execute(interaction) {
	await interaction.deferReply();

	const name = interaction.options.getString("song");
	/** @type {import("../../../types.d.ts").ILyricsSong[]} */
	let songs = [];
	try {
		// @ts-expect-error
		songs = await searchSong(name);
		if (songs.length > 10)
			songs = songs.slice(9);
	}
	catch (error) {
		if (error instanceof LyricsError) {
			if (error.type == lyricsErrorEnum.NoApiKey)
				interaction.editReply("Właściciel bota nie podał API key");
			else if (error.type == lyricsErrorEnum.WrongStatus) {
				interaction.editReply("Wystąpił bład podczas szukania piosenki:(");
				console.error(error);
			}
		}
		else {
			console.error(error);
			interaction.editReply("Wystąpił jakiś error?? sus");
		}
		return;
	}

	let desc, i;
	if (songs.length) {
		desc = "Masz 15 sekund na wybór\n\n";
		i = 1;
		for (const song of songs) {
			desc += `**${i}.** ${song.full_title}\n`;
			i++;
		}
	}
	else
		desc = "Nic nie znaleziono:(";

	let embed = new EmbedBuilder()
		.setColor(/** @type {import("discord.js").ColorResolvable} */("#" + Math.floor(Math.random() * 16777215).toString(16)))
		.setTitle("Wybierz piosenkę")
		.setDescription(desc)
		// @ts-expect-error
		.setAuthor({ name: interaction.user.username, iconURL: interaction.user.avatarURL() });

	const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
	const msg = await interaction.editReply({ embeds: [embed] });
	const message = /** @type {import("discord.js").TextChannel} */(interaction.client.channels.cache.get(interaction.channelId)).messages.cache.get(msg.id);

	if (!songs.length)
		return;

	// @ts-expect-error
	for (let j = 1; j < i; j++)
		// @ts-expect-error
		message.react(repeatingDigitsText[j])
			.catch(error => console.log(error));

	// @ts-expect-error
	const collector = message.createReactionCollector({
		time: 15000,
		// @ts-expect-error
		filter: (reaction, reactionUser) => reactionUser.id === interaction.user.id && emojis.includes(reaction.emoji.name),
		max: 1
	});

	collector.on("collect", async (reaction, reactionUser) => {
		// @ts-expect-error
		const number = emojis.indexOf(reaction.emoji.name);
		collector.stop();

		const lyrics = await getLyrics(songs[number]);

		embed = new EmbedBuilder()
			.setColor(/** @type {import("discord.js").ColorResolvable} */("#" + Math.floor(Math.random() * 16777215).toString(16)))
			.setTitle(songs[number].full_title)
			.setURL(songs[number].url)
			.setDescription(lyrics)
			.setThumbnail(songs[number].song_art_image_url)
			// @ts-expect-error
			.setAuthor({ name: interaction.user.username, iconURL: interaction.user.avatarURL() });

		interaction.editReply({ embeds: [embed] });
		// @ts-expect-error
		message.reactions.removeAll();
	});

	collector.on("end", async (collected, reason) => {
		if (reason == "time") {
			embed = new EmbedBuilder()
				.setColor(/** @type {import("discord.js").ColorResolvable} */("#" + Math.floor(Math.random() * 16777215).toString(16)))
				.setTitle("Wybór piosenki")
				.setDescription("Nie zdążyłeś wybrać")
				// @ts-expect-error
				.setAuthor({ name: interaction.user.username, iconURL: interaction.user.avatarURL() });

			// @ts-expect-error
			message.reactions.removeAll();
			interaction.editReply({ embeds: [embed] });
		}
		else if (reason != "user") {
			console.error(`Weird collector end: ${reason}`);
		}
	});
}
