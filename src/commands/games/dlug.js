import fs from "node:fs";
import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
	.setName("długi")
	.setDescription("List długów (pls chce bajgle)");

/**
 * 
* @param {CommandInteraction} interaction 
*/
export async function execute(interaction) {
	/** @type {import("../../../types.js").IUserSettings} */
	const settings = JSON.parse(fs.readFileSync("./data/userSettings.json", "utf8"));
	const ranking = [];
	for (const [uid, value] of Object.entries(settings)) {
		if (value.dlug !== undefined && uid != "230917788699459584")
			ranking.push({ uid: uid, val: value.dlug });
	}

	ranking.sort(function(a, b) {
		return b.val - a.val;
	});

	let desc = "";
	for (let i = 0; i < ranking.length; i++)
		desc += String(i + 1) + ". <@" + ranking[i].uid + "> " + ranking[i].val + " bajgele\n";

	const embed = new EmbedBuilder()
		.setColor(/** @type {import("discord.js").ColorResolvable} */("#" + Math.floor(Math.random() * 16777215).toString(16)))
		.setTitle("Pls dajcie mi bajgle")
		.setDescription(desc);
	await interaction.reply({ embeds: [embed] });
}
