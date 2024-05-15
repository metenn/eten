import fs from "node:fs";
import { player } from "../../index.js";
import { SlashCommandBuilder, SlashCommandIntegerOption } from "discord.js";

export const data = new SlashCommandBuilder()
	.setName("volume")
	.setDescription("Zmień głośność")
	.addIntegerOption(
		new SlashCommandIntegerOption()
			.setName("volume")
			.setDescription("Głośność")
			.setMinValue(0)
			.setMaxValue(100)
			.setRequired(true)
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

	const volume = interaction.options.getInteger("volume");
	/** @type {import("../../../types.js").IMusicInfo} */
	const musicInfo = JSON.parse(fs.readFileSync("./data/music.json", "utf-8"));
	// @ts-expect-error
	musicInfo[interaction.guildId].volume = volume;
	fs.writeFileSync("./data/music.json", JSON.stringify(musicInfo));

	// @ts-expect-error
	if (queue.node.setVolume(volume))
		await interaction.editReply(`Zmieniono głośność na ${volume}`);
	else
		await interaction.editReply("Nie udało się zmienić głośności");
}
