import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { player } from "../../index.js";

export const data = new SlashCommandBuilder()
	.setName("progress")
	.setDescription("Sprawdź jak progress aktualnie granej piosenki/filmu");

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

	const progress = queue.node.createProgressBar();
	const timestamp = queue.node.getTimestamp();
	let desc = "";
	// @ts-expect-error
	if (timestamp.progress == Infinity)
		desc = "Streamy nie mają progressu";
	else
		desc = `${progress}`;

	const embed = new EmbedBuilder()
		.setColor(/** @type {import("discord.js").ColorResolvable} */("#" + Math.floor(Math.random() * 16777215).toString(16)))
		// @ts-expect-error
		.setTitle(queue.currentTrack.title)
		// @ts-expect-error
		.setURL(queue.currentTrack.url)
		// @ts-expect-error
		.setImage(queue.currentTrack.thumbnail)
		.setDescription(desc);

	interaction.editReply({ embeds: [embed] });
}
