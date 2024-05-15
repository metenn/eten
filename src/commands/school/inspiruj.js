import util from "util";
import { pipeline } from "stream";
const streamPipeline = util.promisify(pipeline);
import fs from "node:fs";
import { AttachmentBuilder, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
	.setName("inspiruj")
	.setDescription("Zainspiruj się");
export const aliases = ["inspiracja"];

/**
 * 
 * @param {import("discord.js").CommandInteraction} interaction 
 */
export async function execute(interaction) {
	const res = await fetch("https://inspirobot.me/api?generate=true");
	if (!res.ok) throw new Error(`Unexpected response ${res.statusText}`);
	const response = await fetch(await res.text());
	if (!response.ok) throw new Error(`Unexpected response ${response.statusText}`);
	// @ts-expect-error
	await streamPipeline(response.body, fs.createWriteStream("./tmp/placeholder.jpg"));
	const attachment = new AttachmentBuilder("./tmp/placeholder.jpg");
	await interaction.reply({ files: [attachment] });
}
