import fs from "node:fs";
import crypto from "node:crypto";
import util from "node:util";
import stream from "node:stream";
const streamPipeline = util.promisify(stream.pipeline);
// const streamPipeline = util.promisify(require('stream').pipeline)

// let hashes = require(`${process.cwd()}/data/hashes.json`)
let hashes = JSON.parse(fs.readFileSync("./data/hashes.json", "utf-8"));

/** @typedef {{[guildId: string]: {[hash: string]: string}}} IHashes */

/**
 * 
 * @param {string} url 
 * @returns 
 */
function get_url_extension(url) { // nie kradzione wcale
	// @ts-expect-error
	return url.split(/[#?]/)[0].split(".").pop().trim();
}

export function updateHashes() {
	/** @type {IHashes} */
	const newHashes = {};

	for (const [guildId, hashesGuild] of Object.entries(hashes)) {
		newHashes[guildId] = {};
		for (const [hash, link] of Object.entries(hashesGuild)) {
			const splits = link.split("/");
			newHashes[guildId][hash] = splits[splits.length - 3] + "," + splits[splits.length - 2] + "," + splits[splits.length - 1];
		}
	}

	fs.writeFileSync("./data/hashes.json", JSON.stringify(newHashes, null, 2));
	hashes = newHashes;
}

/**
 * 
 * @param {string} url 
 * @param {import("discord.js").Message<boolean>} message 
 * @returns 
 */
export async function hashFile(url, message) {
	// if (message.author.id == message.client.id)
	// jak to działało? poprawiłem:
	if (message.author.id == message.client.user.id)
		return;

	console.time("Downloading");
	const extension = get_url_extension(url);
	const imgResult = await fetch(url);
	// @ts-expect-error
	await streamPipeline(imgResult.body, fs.createWriteStream("./tmp/tmp." + extension));
	console.timeEnd("Downloading");

	console.time("Hashing");
	const img = fs.readFileSync("./tmp/tmp." + extension);
	const hashSum = crypto.createHash("sha256");
	hashSum.update(img);
	const hexHash = hashSum.digest("hex");

	// console.log(hexHash)

	// @ts-expect-error
	if (!(message.guildId in hashes))
		// @ts-expect-error
		hashes[message.guildId] = {};

	// @ts-expect-error
	if (hexHash in hashes[message.guildId]) {
		// @ts-expect-error
		const splits = hashes[message.guildId][hexHash].split(",");
		/** @type {import("discord.js").Message<boolean> | undefined} */
		let repost;
		try {
			// @ts-expect-error
			repost = await /** @type {import("discord.js").TextChannel} */ (message.client.guilds.cache.get(splits[0]).channels.cache.get(splits[1])).messages.fetch(splits[2]);
		}
		catch (error) {
			repost = undefined;
		}

		if (repost === undefined) {
			// @ts-expect-error
			hashes[message.guildId][hexHash] = message.guildId + "," + message.channelId + "," + message.id;
			fs.writeFileSync("./data/hashes.json", JSON.stringify(hashes, null, 2));
		}
		else {
			const link = "https://discord.com/channels/" + splits[0] + "/" + splits[1] + "/" + splits[2];
			try {
				message.reply("repost :grimacing:\n" + link);
			}
			catch {
				console.log("Couldnt reply to message (probably deleted).");
			}
		}
	}
	else {
		// @ts-expect-error
		hashes[message.guildId][hexHash] = message.guildId + "," + message.channelId + "," + message.id;
		fs.writeFileSync("./data/hashes.json", JSON.stringify(hashes, null, 2));
	}

	console.timeEnd("Hashing");
}

/**
 * 
 * @param {import("discord.js").Message<boolean>} message 
 */
export async function hashFileFromMessageContent(message) {
	const regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*).(webm|mp4|mov|avi|flv|mkv|wmv|m4v|png|jpg|gif|jpeg|webp|svg|ovg|ogg)\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/ig;
	let match;
	while (match = regex.exec(message.content)) {
		const url = message.content.slice(regex.lastIndex - match[0].length, regex.lastIndex);
		if (url.search("tenor.com") == -1) { // TODO fuch me
			try {
				// ?? to działało??
				// hashfile przyjmuje MessageAttachment (bo robisz tam metode chyba .url) a nie to
				// await hashFile({ url: url }, message)
				await hashFile(url, message);
			}
			catch (error) {
				console.log(error);
			}
		}
	}
}
