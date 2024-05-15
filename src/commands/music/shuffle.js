import { SlashCommandBuilder } from "discord.js";
import { player } from "../../index.js";

export const data = new SlashCommandBuilder()
	.setName("shuffle")
	.setDescription("Shuffluj kolejkę");

/**
 * 
 * @param {import("discord-player").GuildQueue} queue 
 */
export function shuffleQueue(queue) {
	// adapted from @discord-player/utils
	for (let i = queue.tracks.store.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[queue.tracks.store[i], queue.tracks.store[j]] = [queue.tracks.store[j], queue.tracks.store[i]];
	}
}

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

	shuffleQueue(queue)

	await interaction.editReply("Shufflowano kolejkę");
}
