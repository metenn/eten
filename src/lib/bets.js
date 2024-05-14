import fs from "node:fs";
import Discord from "discord.js";
import config from "../config.json";
import { client } from "../index.js";

/**
 * 
 * @param {Date} time 
 */
export async function addTime(time) {
	const predictions = JSON.parse(fs.readFileSync("./data/predictions.json", "utf-8"));
	if (predictions.bets[time.getDay()] === undefined)
		predictions.bets[time.getDay()] = [];
	predictions.bets[time.getDay()].push(time.getTime());
	fs.writeFileSync("./data/predictions.json", JSON.stringify(predictions));
}

/**
 * 
 * @param {Date} date 
 */
export async function check(date) {
	// eneabled?
	if (!config.bets.eneabled)
		return;

	const now = Date.parse(`1970-01-01 ${date.toTimeString()}`);

	const users = [];
	const cheaters = [];
	/** @type {import("../../types.d.ts").IBets} */
	const bets = JSON.parse(fs.readFileSync("./data/bets.json", "utf8"));

	if (Object.keys(bets).length == 0)
		return;

	for (const [user, time] of Object.entries(bets)) {
		let diff;
		let cheated = false;
		if (Math.abs(time.timeAdded - date.getTime()) <= 0 * 60 * 1000) {
			diff = Math.abs(time.timeAdded - date.getTime());
			cheated = true;
		}
		else {
			diff = Math.abs(time.time - now);
		}

		// let mili = parseInt(diff)
		// parseInt jest dla stringów, czy nie chciałeś tu roundować czy coś idk? podieniłem na math.round
		const mili = Math.round(diff);
		const sec = Math.floor(mili / 1000);
		const mins = Math.floor(sec / 60);
		const hours = Math.floor(mins / 60);
		// Mam nadzieję, że to działa, nie wiem co to za czarna magia że skaczesz z inta na stringa na inta (porównanie) na stringa
		const miliS = ("000" + (mili % 1000)).slice(-3);
		const secS = ("00" + (sec % 60)).slice(-2);
		const minsS = ("00" + (mins % 60)).slice(-2);
		const hoursS = ("00" + (hours % 60)).slice(-2);

		let niceDiff = "";
		if (!cheated) {
			if (time.time > now)
				niceDiff = "za pózno o ";
			else
				niceDiff = "za wcześnie o ";
		}

		if (hours > 0)
			niceDiff += `${hoursS}:${minsS} godzin`;
		else if (mins > 0)
			niceDiff += `${minsS} minut`;
		else if (sec > 0)
			niceDiff += `${secS} sekund`;
		else if (mili > 0)
			niceDiff += `${miliS} milisekund`;

		if (cheated)
			niceDiff += " temu";

		if (cheated) {
			cheaters.push({
				user: user,
				timeAdded: time.timeAdded,
				diff: diff,
				niceDiff: niceDiff
			});
		}
		else {
			users.push({
				user: user,
				time: time.time,
				timeAdded: time.timeAdded,
				message: time.message,
				diff: diff,
				niceDiff: niceDiff
			});
		}
	}

	users.sort((a, b) => {
		if (a.diff == b.diff)
			return a.timeAdded - b.timeAdded;
		return a.diff - b.diff;
	});

	cheaters.sort((a, b) => {
		if (a.diff == b.diff)
			return a.timeAdded - b.timeAdded;
		return a.diff - b.diff;
	});

	let embed, desc, i;
	if (users.length != 0) {
		desc = "";
		i = 1;
		for (const user of users) {
			desc += `**${i.toString()}.** <@${user.user}>: ${user.niceDiff} (podany czas: ${user.message})\n`;
			i++;
		}

		embed = new Discord.MessageEmbed()
			.setColor(`#${Math.floor(Math.random() * 16777215).toString(16)}`)
			.setTitle("Dzisiejsze wyniki zakładuw")
			.setDescription(desc)
			.setFooter({ text: "Ogłoszenie dodane o " + date.toTimeString().split(" ")[0] });

		// @ts-expect-error
		/** @type {import("discord.js").TextChannel} */(client.guilds.cache.get(config.bets.guild).channels.cache.get(config.bets.channel)).send({ embeds: [embed] });

		fs.writeFileSync("./data/bets.json", "{}");

		const ranking = JSON.parse(fs.readFileSync("./data/ranking.json", "utf-8"));

		if (!(users[0].user in ranking.bets))
			ranking.bets[users[0].user] = 0;
		ranking.bets[users[0].user]++;

		fs.writeFileSync("./data/ranking.json", JSON.stringify(ranking));
	}

	fs.writeFileSync("./data/bets.json", "{}");
	fs.writeFileSync("./data/betsInfo.json", `{"time": "${date.toDateString()}"}`);

	if (cheaters.length == 0)
		return;

	desc = "";
	i = 1;
	for (const user of cheaters) {
		desc += `**${i.toString()}.** <@${user.user}>: ${user.niceDiff}\n`;
		i++;
	}

	embed = new Discord.MessageEmbed()
		.setColor(`#${Math.floor(Math.random() * 16777215).toString(16)}`)
		.setTitle("Dzisiejsi oszuści")
		.setDescription(desc);

	// @ts-expect-error
	/** @type {import("discord.js").TextChannel} */(client.guilds.cache.get(config.bets.guild).channels.cache.get(config.bets.channel)).send({ embeds: [embed] });
}
