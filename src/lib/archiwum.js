import path from "node:path";
import util from "node:util";
import stream from "node:stream";
const streamPipeline = util.promisify(stream.pipeline);
// const streamPipeline = util.promisify(require('stream').pipeline)
import formData from "form-data";
import fs from "node:fs";
import config from "../config.json" with { type: "json" };;

/**
 * 
 * @param {import("discord.js").Message<boolean>} message 
 * @returns 
 */
export default async function (message) {
	if (config.archiwum.eneabled && message.channel.id == config.archiwum.channel && message.attachments.size) {
		if (message.content.length == 0) {
			await message.reply("Tagi są wymagane (zobacz opis kanału)");
			return;
		}

		// @ts-expect-error
		const url = message.attachments.first().url;
		const ext = path.extname(url);
		const res = await fetch(url, {});
		// @ts-expect-error
		await streamPipeline(res.body, fs.createWriteStream("tmp/tmparchive" + ext));

		const form = new formData();
		const stats = fs.statSync("tmp/tmparchive" + ext);
		const size = stats.size;
		form.append("image", fs.createReadStream("tmp/tmparchive" + ext), { knownLength: size });
		form.append("password", config.archiwum.uploadPassword);
		form.append("tags", message.content);
		form.append("author", message.author.username + "#" + message.author.discriminator);

		console.log(config.archiwum.uploadURL);

		const send = await fetch(config.archiwum.uploadURL, {
			method: "POST",
			body: form
		});

		if (!send.ok) {
			await message.reply(send.statusText + " " + send.status);
			return;
		}

		const text = await send.text();
		if (text != "ok") await message.reply(text);
		else await message.reply("Dodano!");
	}
}
