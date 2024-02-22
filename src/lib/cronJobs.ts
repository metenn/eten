import cron from "cron";
import fetch from "node-fetch";
import joinImages from "./joinImages";
import util from "util";
import fs from "fs";
import { Client, MessageAttachment, TextChannel } from "discord.js";
import config from "../config.json";
import stream from "stream";
import rotateAvatar from "./rotateAvatar";
import miniwalls from "./miniwalls";
const streamPipeline = util.promisify(stream.pipeline);
// const streamPipeline = util.promisify(require('stream').pipeline)
let client: Client<boolean>;

// Daily Inspiration cron
const dailyJob = new cron.CronJob(
	"0 0 6 * * *",
	async function() {
		// Get inspirational image and send. Or at least, try to.
		// const settings = require(`${process.cwd()}/data/settings.json`)
		const settings = JSON.parse(fs.readFileSync("./data/settings.json", "utf-8"));

		try {
			const res = await fetch("https://inspirobot.me/api?generate=true");
			if (!res.ok) throw new Error(`Unexpected response ${res.statusText}`);
			const response = await fetch(await res.text());
			if (!response.ok) throw new Error(`Unexpected response ${response.statusText}`);
			await streamPipeline(response.body, fs.createWriteStream("./tmp/placeholder.jpg"));
			const attachment = new MessageAttachment("./tmp/placeholder.jpg");

			for (const info of settings.inspiracja.where) {
				const inspireChannel = client.guilds.cache.get(info.guild).channels.cache.get(info.channel) as TextChannel;
				await inspireChannel.send({ content: "**Inspiracja na dziś:**", files: [attachment] });
			}
		}
		catch (error) {
			console.error(`Daily inspire failed... ${error}`);
		}
		// Get weather report image and send. Or at least, try to.
		for (const city of config.cronWeather) {
			try {
				const result = await fetch(city.link);
				if (!result.ok) throw new Error(`Unexpected response ${result.statusText}`);
				const resultText = await result.text();
				// const imageRegex = /src="(https:\/\/www\.meteo\.pl\/um\/metco\/mgram_pict\.php\?ntype=0u&fdate=[0-9]+&row=406&col=250&lang=pl)"/g
				const imageRegex = /src="(https:\/\/www\.meteo\.pl\/um\/metco\/mgram_pict\.php\?ntype=0u&fdate=[0-9]+&row=[0-9]+&col=[0-9]+&lang=pl)"/g;
				const link = imageRegex.exec(resultText)[1];
				const imgResult = await fetch(link, {
					headers: {
						Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
						"Accept-Encoding": "gzip, deflate, br",
						"Accept-Language": "en-GB,en;q=0.9",
						Host: "www.meteo.pl",
						Referer: "https://m.meteo.pl/",
						"Sec-Fetch-Dest": "image",
						"Sec-Fetch-Mode": "no-cors",
						"Sec-Fetch-Site": "same-site",
						"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36"
					}
				});
				if (!imgResult.ok) throw new Error(`Unexpected response ${result.statusText}`);
				await streamPipeline(imgResult.body, fs.createWriteStream("./tmp/weather.png"));
				joinImages("data/leg60.png", "tmp/weather.png", "tmp/weatherFinal.png");
				const weatherAttachment = new MessageAttachment("./tmp/weatherFinal.png");

				for (const info of settings.pogoda.where) {
					const channel: TextChannel = client.guilds.cache.get(info.guild).channels.cache.get(info.channel) as TextChannel;
					if (config.cronWeather.length == 1)
						await channel.send({ files: [weatherAttachment] });
					else
						await channel.send({ content: city.title + ":", files: [weatherAttachment] });
				}
			}
			catch (error) {
				console.error(`Daily weather failed... ${error}`);
			}
		}
	},
	null,
	true,
	"Europe/Warsaw"
);

const rotateAvatarJob = new cron.CronJob(
	"0 0 0 * * *",
	rotateAvatar
)

function cronImageSend() {
	if (config.cronImageSend.eneabled) {
		// Co? \/
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const imgConfig = require("../" + config.cronImageSend.images);

		for (const image of imgConfig) {
			const cronJob = new cron.CronJob(
				image.cron,
				async function() {
					for (const img of imgConfig) {
						if (img.cron == this.cronTime.source) {
							await (client.guilds.cache.get(config.cronImageSend.guild).channels.cache.get(config.cronImageSend.channel) as TextChannel).send({ files: [img.imageURL] });
							return;
						}
					}
				},
				null,
				true,
				"Europe/Warsaw"
			);
			cronJob.start();
		}
	}
}

export default function(cl: Client<boolean>) {
	client = cl;
	dailyJob.start();
	cronImageSend();
	rotateAvatarJob.start();
	miniwalls();
}
