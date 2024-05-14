import Parser from "rss-parser";
import "colors";
import crypto from "node:crypto";
import { client } from "../index.js";
import config from "../config.json";
import { MessageEmbed } from "discord.js";

/** @type {Parser} */
const parser = new Parser();

/** @type {Map<string, { base64Hash: string, content: string }>} */
const rssFeedCache = new Map();

/**
 * 
 * @param {boolean?} init 
 * @returns 
 */
async function checkRSS(init) {
	let feed;
	try {
		feed = await parser.parseURL("https://staszic.waw.pl/rss/");
	}
	catch (err) {
		console.error("RSS: Error while parsing RSS feed".red);
		console.error(err);
		return;
	}

	for (const item of feed.items) {
		if (item.guid == null
			|| item.content == null
			|| item.title == null) {
			throw new Error(`RSS Feed entry GUID is ${item.guid}`);
		}
		if (rssFeedCache.has(item.guid)) {
			const cachedItem = rssFeedCache.get(item.guid);
			const newHash = crypto.createHash("SHA256").update(`${item.title}\n${item.content}`).digest("base64");
			if (cachedItem?.base64Hash != newHash) {
				const channel = await client.channels.fetch("1029378257197477939");
				// @ts-expect-error
				if (!channel.isText()) {
					throw new Error("RSS: Debug channel !isText()");
				}
				console.log(`GUID: ${item.guid}`);
				console.log(`OLD: ${cachedItem?.content}`);
				console.log(`NEW: ${item.title}\n${item.content}`);
				rssFeedCache.set(item.guid, { base64Hash: newHash, content: `${item.title}\n${item.content}` });
				await channel.send(`${item.guid} - Content hash different, post edited. See console`);
			}
		}
		else {
			rssFeedCache.set(
				item.guid,
				{
					base64Hash: crypto.createHash("SHA256").update(`${item.title}\n${item.content}`).digest("base64"),
					content: `${item.title}\n${item.content}`
				}
			);
			if (init) {
				continue;
			}
			// @ts-ignore
			for (const channelConfig of config.librusNoticeChannels) {
				const channel = await client.channels.fetch(channelConfig.channel);
				if (channel == null) {
					console.log(`${channelConfig.channel} - channel fetch() returned null!`.white.bgRed);
					continue;
				}
				if (!channel.isText || (channel.type !== "GUILD_TEXT" && channel.type !== "GUILD_NEWS")) {
					console.log(`${channel.id} is not a valid guild text channel!`.white.bgRed);
					continue;
				}
				const embed = new MessageEmbed()
					// @ts-expect-error
					.setURL(item.link)
					.setTitle(`**__${item.title}__**`)
					// @ts-expect-error
					.setDescription(item.contentSnippet.substring(0, 4096))
					// @ts-expect-error
					.setFooter({ text: item.pubDate });
				channel.send({ content: "📰 Nowy post na staszic.waw.pl", embeds: [embed] });
			}
		}
	}
	// console.debug(rssFeedCache);
}

export default async function initRSS() {
	checkRSS(true);
	setInterval(checkRSS, 60 * 60 * 1000);
}
