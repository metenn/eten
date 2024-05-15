import { SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { player } from "../../index.js";
import { QueueRepeatMode } from "discord-player";

export const data = new SlashCommandBuilder()
	.setName("loop")
	.setDescription("Zapętlij")
	.addStringOption(
		new SlashCommandStringOption()
			.setName("type")
			.setDescription("Typ pętli")
			.addChoices({"name": "wyłącz", "value": QueueRepeatMode.OFF.toString()})
			.addChoices({"name": "tylko ten utwór", "value": QueueRepeatMode.TRACK.toString()})
			.addChoices({"name": "cała kolejka", "value": QueueRepeatMode.QUEUE.toString()})
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

	if (!queue.history.tracks.at(0)) {
		interaction.editReply("Nie ma żadnych filmów po aktualnym");
		return;
	}

	// @ts-expect-error
	const type = parseInt(interaction.options.getString("type"));

	if (type) {
		queue.setRepeatMode(type);

		let msg = "";
		if (type == QueueRepeatMode.OFF)
			msg = "Wyłączono pętlę";
		else if (type == QueueRepeatMode.TRACK)
			msg = "Włączono pętle dla tego filmu";
		else if (type == QueueRepeatMode.QUEUE)
			msg = "Włączno pętle dla całej kolejki";

		interaction.editReply(msg);
	}
	else {
		let msg = "";
		if (queue.repeatMode == QueueRepeatMode.OFF)
			msg = "Pętla jest wyłączona";
		else if (queue.repeatMode == QueueRepeatMode.TRACK)
			msg = "Pętla jest włączona dla tego utworu";
		else if (queue.repeatMode == QueueRepeatMode.QUEUE)
			msg = "Pętla jest włączona dla całej kolejki";

		interaction.editReply(msg);
	}
}
