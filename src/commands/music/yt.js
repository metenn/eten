import { QueryType } from "discord-player";
import fs from "node:fs";
import { player } from "../../index.js";
import { EmbedBuilder, SlashCommandBooleanOption, SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { shuffleQueue } from "./shuffle.js";

/**
 * 
 * @param {import("discord-player").Track[]} array 
 * @returns {import("discord-player").Track[]}
 */
function shuffleArray(array) {
	let currentIndex = array.length, randomIndex;
	while (currentIndex != 0) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		[array[currentIndex], array[randomIndex]] = [
			array[randomIndex], array[currentIndex]
		];
	}

	return array;
}

/**
 * 
 * @param {import("discord-player").PlayerSearchResult} film 
 * @param {import("discord.js").ChatInputCommandInteraction} interaction 
 * @returns {import("discord.js").EmbedBuilder}
 */
function getEmbed(film, interaction) {
	const embed = new EmbedBuilder()
		.setColor(/** @type {import("discord.js").ColorResolvable} */("#" + Math.floor(Math.random() * 16777215).toString(16)));

	if (film.playlist) {
		embed
			.setTitle(film.playlist.title)
			.setURL(film.playlist.url)
			.setDescription(`Dodano playlistę do kolejki (${film.playlist.tracks.length} ${film.playlist.source == "youtube" ? "filmów" : "piosenek"} na playliście)`)
			// @ts-expect-error
			.setAuthor({ name: interaction.user.username, iconURL: interaction.user.avatarURL() });
	}
	else {
		embed
			.setTitle(film.tracks[0].title)
			.setURL(film.tracks[0].url)
			.setDescription(`Dodano ${film.tracks[0].source == "youtube" ? "film" : "piosenkę"} do kolejki (${film.tracks[0].duration})`)
			// @ts-expect-error
			.setAuthor({ name: interaction.user.username, iconURL: interaction.user.avatarURL() })
			.setImage(film.tracks[0].thumbnail);
	}

	return embed;
}

export const data = new SlashCommandBuilder()
	.setName("yt")
	.setDescription("Puść z yt")
	.addStringOption(
		new SlashCommandStringOption()
			.setName("link")
			.setDescription("link do yt")
			.setRequired(true)
	)
	.addBooleanOption(
		new SlashCommandBooleanOption()
			.setName("shuffle")
			.setDescription("Czy chcesz shufflować (działa dla playlist)")
			.setRequired(false)
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
	const link = interaction.options.getString("link");
	const shuffle = interaction.options.getBoolean("shuffle");

	// @ts-expect-error
	if (!user.voice.channel) {
		interaction.editReply("Nie jesteś na VC");
		return;
	}

	// @ts-expect-error
	const res = await player.search(link, {
		requestedBy: interaction.user.username,
		searchEngine: QueryType.AUTO
	});

	if (!res || !res.tracks.length) {
		interaction.editReply("Nic nie znaleziono:(");
		return;
	}

	// @ts-expect-error
	let queue = player.queues.get(interaction.guild.id);
	/** @type {import("../../../types.js").IMusicInfo} */
	const musicInfo = JSON.parse(fs.readFileSync("./data/music.json", "utf-8"));
	// @ts-expect-error
	if (!(interaction.guildId in musicInfo)) {
		// @ts-expect-error
		musicInfo[interaction.guildId] = {
			volume: 100
		};

		fs.writeFileSync("./data/music.json", JSON.stringify(musicInfo));
	}

	if (queue) {
		if (res.playlist && shuffle)
			// res.tracks = shuffleArray(res.tracks);
			shuffleArray(res.tracks);

		res.playlist ? queue.addTrack(res.tracks) : queue.addTrack(res.tracks[0]);

		if (!queue.isPlaying())
			// @ts-expect-error
			(queue.node.play()).then(() => queue.node.setVolume(musicInfo[interaction.guildId].volume));

		// @ts-expect-error
		interaction.editReply({ embeds: [getEmbed(res, interaction)] });
	}
	else {
		if (res.playlist && shuffle)
			// res.tracks = shuffleArray(res.tracks);
			shuffleArray(res.tracks);

		// @ts-expect-error
		queue = player.queues.create(interaction.guild, { metadata: true });

		try {
			if (!queue.connection)
				// @ts-expect-error
				await queue.connect(user.voice.channel);
		}
		catch (error) {
			console.error(error);
			// @ts-expect-error
			player.queues.delete(interaction.guild.id);
			interaction.editReply("Nie mogłem dołączyć do vc:( <@230917788699459584>");
			return;
		}

		res.playlist ? queue.addTrack(res.tracks) : queue.addTrack(res.tracks[0]);

		if (shuffle)
			shuffleQueue(queue);

		if (!queue.isPlaying())
			// @ts-expect-error
			(queue.node.play()).then(() => queue.node.setVolume(musicInfo[interaction.guildId].volume));

		// @ts-expect-error
		interaction.editReply({ embeds: [getEmbed(res, interaction)] });
	}
}
