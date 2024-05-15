import config from "../config.json" with { type: "json" };;
import fs from "node:fs";
import { joinVoiceChannel, createAudioPlayer, createAudioResource } from "@discordjs/voice";
import { client } from "../index.js";
import { ChannelType } from "discord.js";
const player = createAudioPlayer();

/**
 * 
 * @param {number} ms 
 * @returns 
 */
function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

async function randomSoundOnVoice() {
	/** @type {import("discord.js").VoiceChannel[]} */
	const channels = [];

	client.guilds.cache.forEach(guild => {
		for (const channel of guild.channels.cache.filter(c => c.type == ChannelType.GuildVoice).values())
			channels.push(/** @type {import("discord.js").VoiceChannel} */(channel));
	});

	let isThereAnyone = false;
	for (const channel of channels.values()) {
		if (/** @type {import("discord.js").Collection<string, import("discord.js").GuildMember>} */(channel.members).size == 0 || Math.random() >= config.randomSoundeffectChance)
			continue;
		isThereAnyone = true;

		let isAlreadyOnVC = false;
		// @ts-expect-error
		if (client.guilds.cache.get(channel.guildId).members.me.voice.channel)
			isAlreadyOnVC = true;

		if (isAlreadyOnVC) // TODO ~~lepiej to~~ nwm o co mi tu chodzilo zeby lepiej zrobic
			continue;

		const connection = joinVoiceChannel({
			channelId: channel.id,
			guildId: channel.guild.id,
			adapterCreator: channel.guild.voiceAdapterCreator
		});

		const files = fs.readdirSync("./soundeffects");

		const resource = createAudioResource("./soundeffects/" + files[Math.floor(Math.random() * files.length)]);
		connection.subscribe(player);
		player.play(resource);
		while (player.state.status != "idle")
			await sleep(100);

		connection.disconnect();
	}

	setTimeout(randomSoundOnVoice, (isThereAnyone ? 1000 * 60 : 1000 * 60 * 15));
}

export default async function() {
	if (config.playRandomSoundeffects)
		randomSoundOnVoice();
}
